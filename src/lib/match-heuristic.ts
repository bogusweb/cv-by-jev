import { splitBySynonymEquivalence } from "@/lib/skill-equivalence";
import type {
  MatchHighlight,
  MatchRecommendation,
  MatchResult,
} from "@/lib/types";

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "your",
  "you",
  "we",
  "our",
  "this",
  "will",
  "have",
  "has",
  "i",
  "my",
  "me",
  "and",
  "oraz",
  "się",
  "jest",
  "nie",
  "dla",
  "na",
  "w",
  "z",
  "do",
  "po",
  "od",
  "jak",
  "czy",
  "że",
  "być",
  "praca",
  "stanowisko",
  "oferta",
  "team",
  "role",
  "job",
  "work",
  "experience",
  "years",
  "year",
  "ability",
  "skills",
  "requirements",
  "required",
  "preferred",
  "plus",
]);

const SKILL_HINTS = [
  "typescript",
  "javascript",
  "python",
  "java",
  "kotlin",
  "swift",
  "go",
  "rust",
  "c++",
  "c#",
  "react",
  "next.js",
  "nextjs",
  "vue",
  "angular",
  "node",
  "nodejs",
  "express",
  "nestjs",
  "django",
  "flask",
  "fastapi",
  "spring",
  "sql",
  "postgres",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "graphql",
  "rest",
  "api",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "k8s",
  "terraform",
  "ci/cd",
  "git",
  "linux",
  "tailwind",
  "css",
  "html",
  "figma",
  "ux",
  "ui",
  "design",
  "product",
  "agile",
  "scrum",
  "leadership",
  "communication",
  "testing",
  "jest",
  "cypress",
  "playwright",
  "ml",
  "ai",
  "llm",
  "data",
  "analytics",
  "security",
  "devops",
  "backend",
  "frontend",
  "fullstack",
  "full-stack",
  "mobile",
  "ios",
  "android",
  "spark",
  "hadoop",
  "kafka",
  "elasticsearch",
  "webpack",
  "vite",
  "prisma",
  "drizzle",
  "supabase",
  "firebase",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./ąćęłńóśźż\s-]/gi, " ")
    .split(/[\s,/|;]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token));
}

function uniquePreserve(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function extractSkillCandidates(text: string): string[] {
  const lower = text.toLowerCase();
  // Prefer whole-token / word-boundary hits for short skills (e.g. avoid "java" in "javascript").
  const hinted = SKILL_HINTS.filter((skill) => {
    if (skill.length <= 3) {
      const re = new RegExp(
        `(^|[^a-z0-9+#])${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9+#]|$)`,
        "i",
      );
      return re.test(lower);
    }
    if (skill === "java") {
      return /(^|[^a-z0-9+#])java([^a-z0-9+#]|$)/i.test(lower);
    }
    return lower.includes(skill);
  });
  const tokens = tokenize(text).filter((token) => token.length >= 3);
  return uniquePreserve([...hinted, ...tokens]).slice(0, 120);
}

function recommendationFor(score: number): MatchRecommendation {
  if (score >= 70) return "apply";
  if (score >= 45) return "maybe";
  return "skip";
}

function summaryFor(
  score: number,
  matched: string[],
  missing: string[],
): string {
  if (score >= 70) {
    return `Silne dopasowanie — CV pokrywa kluczowe wymagania oferty (${matched.slice(0, 4).join(", ") || "istotne słowa kluczowe"}).`;
  }
  if (score >= 45) {
    return `Częściowe dopasowanie. Warto podkreślić wspólne kompetencje i domknąć luki: ${missing.slice(0, 4).join(", ") || "brakujące słowa kluczowe"}.`;
  }
  return `Słabe dopasowanie względem tej oferty. CV i ogłoszenie mają mało wspólnych sygnałów kompetencji.`;
}

export function scoreHeuristicMatch(input: {
  cvText: string;
  jobText: string;
  jobUrl: string;
  jobTitle?: string;
}): MatchResult {
  const cvSkills = extractSkillCandidates(input.cvText);
  const jobSkills = extractSkillCandidates(input.jobText);

  const cvSet = new Set(cvSkills);
  const matchedSkills = jobSkills.filter((skill) => cvSet.has(skill));
  const naiveMissing = jobSkills
    .filter((skill) => !cvSet.has(skill))
    .filter((skill) => SKILL_HINTS.includes(skill))
    .slice(0, 12);

  const { coveredByEquivalence, stillMissing } = splitBySynonymEquivalence(
    naiveMissing,
    cvSkills,
  );

  // Treat synonym-covered skills as soft matches for scoring.
  const effectiveMatched = matchedSkills.length + coveredByEquivalence.length;
  const overlapRatio =
    jobSkills.length === 0 ? 0 : effectiveMatched / jobSkills.length;

  const hintedJob = jobSkills.filter((s) => SKILL_HINTS.includes(s));
  const hintedMatched = [
    ...matchedSkills.filter((s) => SKILL_HINTS.includes(s)),
    ...coveredByEquivalence.filter((s) => SKILL_HINTS.includes(s)),
  ];
  const skillBoost =
    hintedJob.length === 0 ? 0 : hintedMatched.length / hintedJob.length;

  const raw = overlapRatio * 55 + skillBoost * 45;
  const normalizedScore = Math.round(Math.min(100, Math.max(0, raw * 100)));

  const highlights: MatchHighlight[] = [];

  if (matchedSkills.length) {
    highlights.push({
      kind: "match",
      label: "Wspólne sygnały",
      detail: matchedSkills.slice(0, 8).join(", "),
    });
  }

  if (coveredByEquivalence.length) {
    highlights.push({
      kind: "match",
      label: "Pokryte równoważnymi skillami",
      detail: coveredByEquivalence.slice(0, 8).join(", "),
    });
  }

  if (stillMissing.length) {
    highlights.push({
      kind: "gap",
      label: "Nadal brakuje",
      detail: stillMissing.slice(0, 8).join(", "),
    });
  }

  highlights.push({
    kind: "note",
    label: "Tryb dopasowania",
    detail:
      "Heurystyka + mapa synonimów (bez TYPESAFE_API_KEY). Z kluczem Jev ocenia równoważność skills.",
  });

  return {
    score: normalizedScore,
    recommendation: recommendationFor(normalizedScore),
    summary: summaryFor(normalizedScore, matchedSkills, stillMissing),
    highlights,
    matchedSkills: matchedSkills.slice(0, 16),
    missingSkills: naiveMissing.slice(0, 12),
    coveredByEquivalence: coveredByEquivalence.slice(0, 12),
    stillMissing: stillMissing.slice(0, 12),
    provider: "heuristic",
    cvChars: input.cvText.length,
    jobChars: input.jobText.length,
    jobTitle: input.jobTitle,
  };
}
