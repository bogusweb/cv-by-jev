export type MatchProvider = "typesafe" | "heuristic";

export type MatchRecommendation = "apply" | "maybe" | "skip";

export interface MatchHighlight {
  label: string;
  detail: string;
  kind: "match" | "gap" | "note";
}

/** Dimension scores 0–100, derived in code from Jev answers or heuristic analogs. */
export interface MatchMetrics {
  composite: number;
  skills: number;
  experience: number;
  domain: number;
  /** Must-haves Noul × 100 (TypeSafe) or remaining-gap analog (heuristic). */
  mustHaves: number;
  equivalenceCoverage: number;
  /** Average Jev confidence 0–100. Omitted on heuristic — do not invent. */
  confidence?: number;
  /** P(critical gaps after equivalence) × 100 when Jev answered the Noul. */
  stillHasCriticalGaps?: number;
}

export interface MatchResult {
  score: number;
  recommendation: MatchRecommendation;
  summary: string;
  metrics: MatchMetrics;
  highlights: MatchHighlight[];
  matchedSkills: string[];
  /** Job skills with no exact CV token match (pre-equivalence). */
  missingSkills: string[];
  /** Job requirements covered via related/equivalent CV skills (TS↔JS, etc.). */
  coveredByEquivalence: string[];
  /** Requirements that remain unmet after equivalence judgment. */
  stillMissing: string[];
  provider: MatchProvider;
  model?: string;
  confidence?: number;
  cvChars: number;
  jobChars: number;
  jobTitle?: string;
}

export interface MatchErrorBody {
  error: string;
  code:
    | "INVALID_INPUT"
    | "PDF_EMPTY"
    | "PDF_PARSE"
    | "JOB_FETCH"
    | "JOB_EMPTY"
    | "MATCH_FAILED";
}
