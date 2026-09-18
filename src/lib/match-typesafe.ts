import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";
import type { MatchRecommendation, MatchResult } from "@/lib/types";
import { scoreHeuristicMatch } from "@/lib/match-heuristic";
import { EQUIVALENCE_NOUL_THRESHOLD } from "@/lib/skill-equivalence";

/** Composite weights — tune in code, not in the model. */
const WEIGHTS = {
  skills: 0.35,
  experience: 0.25,
  domain: 0.2,
  mustHaves: 0.2,
} as const;

const LEVELS = [
  "Brak istotnego pokrycia",
  "Słabe pokrycie",
  "Umiarkowane pokrycie",
  "Dobre pokrycie",
  "Bardzo dobre pokrycie",
] as const;

const MAX_GAP_NOULS = 8;

function normalizeScore(raw: number, maxLevel = 4): number {
  return Math.min(1, Math.max(0, raw / maxLevel));
}

function recommendationFromComposite(
  composite: number,
  mustHaves: number,
): MatchRecommendation {
  if (mustHaves < 0.35) return "skip";
  if (composite >= 0.7) return "apply";
  if (composite >= 0.45) return "maybe";
  return "skip";
}

function gapQuestionKey(index: number): string {
  return `gapCovered_${index}`;
}

export function hasTypeSafeKey(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY?.trim());
}

export async function scoreTypeSafeMatch(input: {
  cvText: string;
  jobText: string;
  jobUrl: string;
  jobTitle?: string;
}): Promise<MatchResult> {
  const client = new TypeSafeClient({
    apiKey: process.env.TYPESAFE_API_KEY,
    defaultModel: "jev-latest",
  });

  const cv = input.cvText.slice(0, 12_000);
  const job = input.jobText.slice(0, 12_000);

  // Heuristic first: candidate gaps for per-skill Noul (Jev cannot emit string lists).
  const heuristic = scoreHeuristicMatch(input);
  const candidateGaps = heuristic.missingSkills.slice(0, MAX_GAP_NOULS);

  const gapQuestions = Object.fromEntries(
    candidateGaps.map((skill, index) => [
      gapQuestionKey(index),
      noul(
        `Czy wymaganie skill „${skill}” z oferty jest pokryte przez równoważny, pokrewny lub transferowalny skill obecny w CV? Przykłady: TypeScript pokrywa JavaScript; Next.js pokrywa React; Spring pokrywa Java; Tailwind pokrywa CSS. Jeśli w CV jest bezpośrednio „${skill}”, też tak.`,
      ),
    ]),
  );

  // Composite scoring + skill-equivalence judgment in one systemOne call.
  // https://docs.typesafe.ai/patterns/composite-scoring.md
  const response = await client.systemOne({
    model: "jev-latest",
    state: {
      task: "Oceń dopasowanie CV kandydata do oferty pracy, w tym równoważność skills.",
      cv,
      job,
      url: input.jobUrl,
      jobTitle: input.jobTitle ?? null,
      candidateMissingSkills: candidateGaps,
      matchedSkillsExact: heuristic.matchedSkills,
      equivalenceExamples: [
        "TypeScript ↔ JavaScript",
        "React ↔ Next.js",
        "Java ↔ Spring",
        "CSS ↔ Tailwind",
      ],
    },
    questions: {
      skillsFit: score(
        "Jak dobrze umiejętności i stack z CV pokrywają wymagania oferty?",
        [...LEVELS],
      ),
      experienceFit: score(
        "Jak dobrze doświadczenie i seniority z CV pasują do oferty?",
        [...LEVELS],
      ),
      domainFit: score(
        "Jak dobrze domena / branża / kontekst CV pasuje do oferty?",
        [...LEVELS],
      ),
      meetsMustHaves: noul(
        "Czy CV spełnia twarde must-have wymagania tej oferty (języki, lata doświadczenia, obowiązkowe technologie)?",
      ),
      equivalenceCoverage: score(
        "Po uwzględnieniu równoważności i transferowalności skills (np. TypeScript↔JavaScript, React↔Next.js, Java↔Spring, CSS↔Tailwind): jak dobrze CV pokrywa wymagania oferty, które wyglądają na brakujące przy prostym porównaniu stringów?",
        [...LEVELS],
      ),
      stillHasCriticalGaps: noul(
        "Czy po uwzględnieniu równoważnych i pokrewnych skills nadal brakuje istotnych technologii wymaganych w ofercie?",
      ),
      recommend: choice(
        "Czy kandydat powinien aplikować na tę ofertę?",
        {
          apply: "Tak — warto aplikować",
          maybe: "Może — aplikować po dopracowaniu CV lub z zastrzeżeniami",
          skip: "Nie — lepiej pominąć tę ofertę",
        },
      ),
      ...gapQuestions,
    },
  });

  const skills = normalizeScore(response.answers.skillsFit.score);
  const experience = normalizeScore(response.answers.experienceFit.score);
  const domain = normalizeScore(response.answers.domainFit.score);
  const mustHaves = response.answers.meetsMustHaves.noul;
  const equivalence = normalizeScore(
    response.answers.equivalenceCoverage.score,
  );
  const stillHasCriticalGaps = response.answers.stillHasCriticalGaps.noul;

  const composite =
    WEIGHTS.skills * skills +
    WEIGHTS.experience * experience +
    WEIGHTS.domain * domain +
    WEIGHTS.mustHaves * mustHaves;

  const percent = Math.round(composite * 100);
  const modelChoice = response.answers.recommend.choice;
  const recommendation =
    modelChoice === "apply" || modelChoice === "maybe" || modelChoice === "skip"
      ? modelChoice
      : recommendationFromComposite(composite, mustHaves);

  // If model recommendation conflicts strongly with must-haves, prefer hard gate
  const gatedRecommendation =
    mustHaves < 0.35 && recommendation === "apply" ? "maybe" : recommendation;

  // Per-skill Noul → coveredByEquivalence / stillMissing (Jev is source of truth).
  const coveredByEquivalence: string[] = [];
  const stillMissing: string[] = [];
  for (let i = 0; i < candidateGaps.length; i++) {
    const skill = candidateGaps[i]!;
    const key = gapQuestionKey(i) as keyof typeof response.answers;
    const answer = response.answers[key] as { noul?: number } | undefined;
    const p = typeof answer?.noul === "number" ? answer.noul : 0;
    if (p >= EQUIVALENCE_NOUL_THRESHOLD) {
      coveredByEquivalence.push(skill);
    } else {
      stillMissing.push(skill);
    }
  }

  // Gaps beyond MAX_GAP_NOULS: keep heuristic synonym judgment (no Noul asked).
  const overflowSet = new Set(heuristic.missingSkills.slice(MAX_GAP_NOULS));
  if (overflowSet.size) {
    for (const skill of heuristic.coveredByEquivalence) {
      if (overflowSet.has(skill)) coveredByEquivalence.push(skill);
    }
    for (const skill of heuristic.stillMissing) {
      if (overflowSet.has(skill)) stillMissing.push(skill);
    }
  }

  const summary =
    gatedRecommendation === "apply"
      ? `Jev (composite) ocenia dopasowanie na ${percent}/100 — silne pokrycie umiejętności i must-have.`
      : gatedRecommendation === "maybe"
        ? `Jev (composite) ocenia dopasowanie na ${percent}/100 — częściowe pokrycie; warto dopracować CV.`
        : `Jev (composite) ocenia dopasowanie na ${percent}/100 — słabe pokrycie względem tej oferty.`;

  const confidences = [
    response.answers.skillsFit.confidence,
    response.answers.experienceFit.confidence,
    response.answers.domainFit.confidence,
    response.answers.equivalenceCoverage.confidence,
    response.answers.recommend.confidence,
  ];
  const avgConfidence =
    confidences.reduce((a, b) => a + b, 0) / confidences.length;

  const equivalenceHighlights = [];
  if (coveredByEquivalence.length) {
    equivalenceHighlights.push({
      kind: "match" as const,
      label: "Pokryte równoważnymi skillami",
      detail: coveredByEquivalence.slice(0, 8).join(", "),
    });
  }
  if (stillMissing.length || stillHasCriticalGaps >= 0.5) {
    equivalenceHighlights.push({
      kind: "gap" as const,
      label: "Nadal brakuje",
      detail:
        stillMissing.slice(0, 8).join(", ") ||
        `P(istotne luki po równoważności)=${stillHasCriticalGaps.toFixed(2)}`,
    });
  }
  equivalenceHighlights.push({
    kind: "note" as const,
    label: "Równoważność skills (Jev)",
    detail: `equivalenceCoverage=${Math.round(equivalence * 100)}, P(nadal krytyczne luki)=${stillHasCriticalGaps.toFixed(2)}`,
  });

  return {
    score: percent,
    recommendation: gatedRecommendation,
    summary,
    highlights: [
      {
        kind: "match",
        label: "Wymiary composite",
        detail: `skills=${Math.round(skills * 100)}, experience=${Math.round(experience * 100)}, domain=${Math.round(domain * 100)}, mustHaves=${Math.round(mustHaves * 100)}`,
      },
      {
        kind: mustHaves >= 0.5 ? "match" : "gap",
        label: "Must-have (Noul)",
        detail: `P(spełnia must-have)=${mustHaves.toFixed(2)}`,
      },
      {
        kind: "note",
        label: "Wagi w kodzie",
        detail: `skills ${WEIGHTS.skills}, experience ${WEIGHTS.experience}, domain ${WEIGHTS.domain}, mustHaves ${WEIGHTS.mustHaves}`,
      },
      ...equivalenceHighlights,
      ...heuristic.highlights
        .filter(
          (h) =>
            h.kind !== "note" &&
            h.label !== "Pokryte równoważnymi skillami" &&
            h.label !== "Nadal brakuje",
        )
        .slice(0, 1),
    ],
    matchedSkills: heuristic.matchedSkills,
    missingSkills: heuristic.missingSkills,
    coveredByEquivalence: coveredByEquivalence.slice(0, 12),
    stillMissing: stillMissing.slice(0, 12),
    provider: "typesafe",
    model: response.model ?? "jev-latest",
    confidence: avgConfidence,
    cvChars: input.cvText.length,
    jobChars: input.jobText.length,
    jobTitle: input.jobTitle,
  };
}
