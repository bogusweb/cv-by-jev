export type MatchProvider = "typesafe" | "heuristic";

export type MatchRecommendation = "apply" | "maybe" | "skip";

export interface MatchHighlight {
  label: string;
  detail: string;
  kind: "match" | "gap" | "note";
}

export interface MatchResult {
  score: number;
  recommendation: MatchRecommendation;
  summary: string;
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
