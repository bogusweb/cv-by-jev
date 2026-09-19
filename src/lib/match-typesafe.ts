import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";
import { getMessages, parseLocale, type Locale } from "@/lib/i18n";
import { toPercent } from "@/lib/match-explain";
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
  locale?: Locale;
}): Promise<MatchResult> {
  const locale = parseLocale(input.locale);
  const t = getMessages(locale).typesafe;
  const client = new TypeSafeClient({
    apiKey: process.env.TYPESAFE_API_KEY,
    defaultModel: "jev-latest",
  });

  const cv = input.cvText.slice(0, 12_000);
  const job = input.jobText.slice(0, 12_000);

  // Heuristic first: candidate gaps for per-skill Noul (Jev cannot emit string lists).
  const heuristic = scoreHeuristicMatch({ ...input, locale });
  const candidateGaps = heuristic.missingSkills.slice(0, MAX_GAP_NOULS);

  const gapQuestions = Object.fromEntries(
    candidateGaps.map((skill, index) => [
      gapQuestionKey(index),
      noul(t.gapQuestion(skill)),
    ]),
  );

  // Composite scoring + skill-equivalence judgment in one systemOne call.
  // https://docs.typesafe.ai/patterns/composite-scoring.md
  const response = await client.systemOne({
    model: "jev-latest",
    state: {
      task: t.task,
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
      skillsFit: score(t.skillsFit, [...t.levels]),
      experienceFit: score(t.experienceFit, [...t.levels]),
      domainFit: score(t.domainFit, [...t.levels]),
      meetsMustHaves: noul(t.meetsMustHaves),
      equivalenceCoverage: score(t.equivalenceCoverage, [...t.levels]),
      stillHasCriticalGaps: noul(t.stillHasCriticalGaps),
      recommend: choice(t.recommendPrompt, {
        apply: t.recommendApply,
        maybe: t.recommendMaybe,
        skip: t.recommendSkip,
      }),
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
      ? t.summaryApply(percent)
      : gatedRecommendation === "maybe"
        ? t.summaryMaybe(percent)
        : t.summarySkip(percent);

  const confidences = [
    response.answers.skillsFit.confidence,
    response.answers.experienceFit.confidence,
    response.answers.domainFit.confidence,
    response.answers.equivalenceCoverage.confidence,
    response.answers.recommend.confidence,
  ];
  const avgConfidence =
    confidences.reduce((a, b) => a + b, 0) / confidences.length;

  return {
    score: percent,
    recommendation: gatedRecommendation,
    summary,
    metrics: {
      composite: percent,
      skills: toPercent(skills),
      experience: toPercent(experience),
      domain: toPercent(domain),
      mustHaves: toPercent(mustHaves),
      equivalenceCoverage: toPercent(equivalence),
      confidence: toPercent(avgConfidence),
      stillHasCriticalGaps: toPercent(stillHasCriticalGaps),
    },
    highlights: [],
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
