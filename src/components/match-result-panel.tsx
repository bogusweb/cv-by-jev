"use client";

import { Badge } from "@/components/ui/badge";
import { Meter, recTone } from "@/components/match-meters";
import { SkillGroup } from "@/components/match-skill-group";
import { explainMatchWhy } from "@/lib/match-explain";
import type { Messages } from "@/lib/i18n/messages";
import type { MatchResult } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ResultPanel({
  result,
  messages,
}: {
  result: MatchResult;
  messages: Messages;
}) {
  const tone = recTone(result.recommendation);
  const why = explainMatchWhy(result, messages);
  const m = result.metrics;
  const confidence =
    typeof m.confidence === "number" ? m.confidence : null;

  return (
    <div className="relative space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--lime)]">
            {messages.result.eyebrow}
          </p>
          <p className="font-display text-6xl leading-none tracking-tight text-[var(--ink)] sm:text-7xl">
            {result.score}
            <span className="text-3xl text-[var(--quiet)]">/100</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={cn("rounded-none border", tone.badge)}>
            {messages.result.recommendation[result.recommendation]}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-none border-[var(--ink)]/30 text-[var(--ink)]"
          >
            {result.provider === "typesafe"
              ? `Jev · ${result.model ?? "jev-latest"}`
              : "heuristic"}
          </Badge>
        </div>
      </div>

      {result.jobTitle && (
        <p className="text-sm text-[var(--quiet)]">
          {messages.result.jobLabel}{" "}
          <span className="text-[var(--ink)]">{result.jobTitle}</span>
        </p>
      )}

      <Meter
        label={messages.result.metricComposite}
        value={m.composite}
        fillClass={tone.bar}
      />

      <div className="border border-[var(--ink)]/15 bg-[var(--wash)]/80 p-4 sm:p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--lime)]">
          {messages.result.whyTitle}
        </p>
        <ol className="mt-3 space-y-2.5">
          {why.map((reason) => (
            <li
              key={reason}
              className="border-l-2 border-[var(--lime)] pl-3 text-sm leading-relaxed text-[var(--ink)]"
            >
              {reason}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--quiet)]">
          {messages.result.metricsTitle}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Meter
            label={messages.result.metricSkills}
            value={m.skills}
            fillClass="bg-[var(--ink)]"
          />
          <Meter
            label={messages.result.metricExperience}
            value={m.experience}
            fillClass="bg-[var(--ink)]"
          />
          <Meter
            label={messages.result.metricDomain}
            value={m.domain}
            fillClass="bg-[var(--ink)]"
          />
          <Meter
            label={messages.result.metricMustHaves}
            value={m.mustHaves}
            fillClass={
              m.mustHaves < 35
                ? "bg-[var(--danger)]"
                : m.mustHaves < 50
                  ? "bg-[var(--caution)]"
                  : "bg-[var(--lime-strong)]"
            }
          />
          <Meter
            label={messages.result.metricEquivalence}
            value={m.equivalenceCoverage}
            fillClass="bg-[var(--lime-strong)]"
          />
          <Meter
            label={messages.result.metricConfidence}
            value={confidence}
            fillClass={
              confidence !== null && confidence < 50
                ? "bg-[var(--caution)]"
                : "bg-[var(--ink)]"
            }
            suffix={confidence === null ? undefined : ""}
          />
        </div>
        {confidence === null && (
          <p className="mt-2 text-xs text-[var(--quiet)]">
            {messages.result.metricConfidence}:{" "}
            {messages.result.confidenceUnavailable}
          </p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-[var(--quiet)]">
          {result.provider === "typesafe"
            ? messages.result.weightsCaption
            : messages.result.heuristicCaption}
        </p>
      </div>

      {(result.matchedSkills.length > 0 ||
        result.coveredByEquivalence.length > 0 ||
        result.stillMissing.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SkillGroup
            title={messages.result.matched}
            items={result.matchedSkills}
            empty={messages.result.empty}
            tone="match"
          />
          <SkillGroup
            title={messages.result.coveredByEquivalence}
            items={result.coveredByEquivalence}
            empty={messages.result.empty}
            tone="equiv"
          />
          <SkillGroup
            title={messages.result.stillMissing}
            items={result.stillMissing}
            empty={messages.result.empty}
            tone="gap"
          />
        </div>
      )}
    </div>
  );
}
