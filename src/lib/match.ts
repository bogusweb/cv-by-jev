import { getMessages, parseLocale, type Locale } from "@/lib/i18n";
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
  locale?: Locale;
}): Promise<MatchResult> {
  const locale = parseLocale(input.locale);
  const withLocale = { ...input, locale };

  if (!hasTypeSafeKey()) {
    return scoreHeuristicMatch(withLocale);
  }

  try {
    return await scoreTypeSafeMatch(withLocale);
  } catch (error) {
    console.error("TypeSafe match failed, falling back to heuristic:", error);
    const fallback = scoreHeuristicMatch(withLocale);
    const t = getMessages(locale).typesafe;
    return {
      ...fallback,
      highlights: [
        {
          kind: "note",
          label: t.fallbackLabel,
          detail: t.fallbackDetail,
        },
        ...fallback.highlights,
      ],
    };
  }
}
