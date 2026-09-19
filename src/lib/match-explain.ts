import type { Messages } from "@/lib/i18n/messages";
import type { MatchResult } from "@/lib/types";

const MUST_HAVE_GATE = 35;
const MUST_HAVE_OK = 50;
const CONFIDENCE_LOW = 50;
const EQUIVALENCE_LOW = 50;
const CRITICAL_GAPS = 50;

function clampPct(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

/**
 * Plain-language WHY for apply/maybe/skip.
 * Built only from structured scores, Noul, gaps, and equivalence — Jev has no prose.
 */
export function explainMatchWhy(
  result: MatchResult,
  messages: Messages,
): string[] {
  const t = messages.result.why;
  const m = result.metrics;
  const reasons: string[] = [];

  if (result.recommendation === "apply") {
    reasons.push(t.applyBecause(m.composite));
  } else if (result.recommendation === "maybe") {
    reasons.push(t.maybeBecause(m.composite));
  } else {
    reasons.push(t.skipBecause(m.composite));
  }

  if (m.mustHaves < MUST_HAVE_GATE) {
    reasons.push(t.mustHavesBlock(clampPct(m.mustHaves)));
  } else if (m.mustHaves >= MUST_HAVE_OK) {
    reasons.push(t.mustHavesOk(clampPct(m.mustHaves)));
  } else {
    reasons.push(t.mustHavesSoft(clampPct(m.mustHaves)));
  }

  if (result.stillMissing.length > 0) {
    reasons.push(
      t.gapsRemain(
        result.stillMissing.length,
        result.stillMissing.slice(0, 4).join(", "),
      ),
    );
  } else {
    reasons.push(t.noGaps);
  }

  if (result.coveredByEquivalence.length > 0) {
    reasons.push(
      t.equivalenceCovered(
        result.coveredByEquivalence.length,
        clampPct(m.equivalenceCoverage),
      ),
    );
  } else if (
    m.equivalenceCoverage < EQUIVALENCE_LOW &&
    result.stillMissing.length > 0
  ) {
    reasons.push(t.equivalenceLow(clampPct(m.equivalenceCoverage)));
  }

  if (
    typeof m.stillHasCriticalGaps === "number" &&
    m.stillHasCriticalGaps >= CRITICAL_GAPS
  ) {
    reasons.push(t.criticalGaps(clampPct(m.stillHasCriticalGaps)));
  }

  if (typeof m.confidence === "number") {
    const conf = clampPct(m.confidence);
    if (conf < CONFIDENCE_LOW) {
      reasons.push(t.confidenceLow(conf));
    } else {
      reasons.push(t.confidenceOk(conf));
    }
  } else if (result.provider === "heuristic") {
    reasons.push(t.heuristicNote);
  }

  return reasons;
}

export function toPercent(unitInterval: number): number {
  return clampPct(unitInterval * 100);
}
