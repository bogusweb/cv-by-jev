import { scoreHeuristicMatch } from "@/lib/match-heuristic";
import {
  hasTypeSafeKey,
  scoreTypeSafeMatch,
} from "@/lib/match-typesafe";
import type { MatchResult } from "@/lib/types";

export async function runMatch(input: {
  cvText: string;
  jobText: string;
  jobUrl: string;
  jobTitle?: string;
}): Promise<MatchResult> {
  if (!hasTypeSafeKey()) {
    return scoreHeuristicMatch(input);
  }

  try {
    return await scoreTypeSafeMatch(input);
  } catch (error) {
    console.error("TypeSafe match failed, falling back to heuristic:", error);
    const fallback = scoreHeuristicMatch(input);
    return {
      ...fallback,
      highlights: [
        {
          kind: "note",
          label: "Fallback",
          detail:
            "Wywołanie TypeSafe/Jev nie powiodło się — użyto heurystyki słów kluczowych.",
        },
        ...fallback.highlights,
      ],
    };
  }
}
