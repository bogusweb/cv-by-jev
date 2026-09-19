"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp, Link2, Loader2, Sparkles } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { explainMatchWhy } from "@/lib/match-explain";
import type { Messages } from "@/lib/i18n/messages";
import type {
  MatchErrorBody,
  MatchRecommendation,
  MatchResult,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type UiState = "idle" | "loading" | "error" | "result";

function normalizeJobUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function recTone(rec: MatchRecommendation) {
  if (rec === "apply") {
    return {
      badge: "border-[var(--ink)] bg-[var(--lime)] text-[var(--ink)]",
      bar: "bg-[var(--lime-strong)]",
      ink: "text-[var(--ink)]",
    };
  }
  if (rec === "maybe") {
    return {
      badge: "border-[var(--ink)] bg-[var(--caution)] text-white",
      bar: "bg-[var(--caution)]",
      ink: "text-[var(--caution)]",
    };
  }
  return {
    badge: "border-[var(--danger)] bg-[var(--danger)] text-white",
    bar: "bg-[var(--danger)]",
    ink: "text-[var(--danger)]",
  };
}

function Meter({
  label,
  value,
  fillClass,
  suffix,
}: {
  label: string;
  value: number | null;
  fillClass: string;
  suffix?: string;
}) {
  const numeric = value ?? 0;
  const clamped = Math.min(100, Math.max(0, numeric));
  const display =
    value === null ? "—" : `${Math.round(clamped)}${suffix ?? ""}`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--quiet)]">
          {label}
        </span>
        <span className="font-mono text-sm tabular-nums text-[var(--ink)]">
          {display}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden border border-[var(--ink)]/20 bg-[var(--wash)]">
        <div
          className={cn("h-full transition-[width] duration-500", fillClass)}
          style={{ width: value === null ? "0%" : `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function SkillGroup({
  title,
  items,
  empty,
  tone,
}: {
  title: string;
  items: string[];
  empty: string;
  tone: "match" | "equiv" | "gap";
}) {
  return (
    <div className={tone === "gap" ? "sm:col-span-2" : undefined}>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--quiet)]">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.slice(0, 10).map((skill) => (
          <Badge
            key={`${tone}-${skill}`}
            variant={tone === "gap" ? "outline" : "secondary"}
            className={cn(
              "rounded-none",
              tone === "equiv" && "border border-[var(--lime)]/50 bg-[var(--lime-soft)]",
              tone === "gap" && "border-[var(--danger)]/35 text-[var(--danger)]",
            )}
          >
            {skill}
          </Badge>
        ))}
        {items.length === 0 && (
          <span className="text-sm text-[var(--quiet)]">{empty}</span>
        )}
      </div>
    </div>
  );
}

function ResultPanel({
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

export function MatchForm() {
  const { locale, messages } = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [jobUrl, setJobUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [uiState, setUiState] = useState<UiState>("idle");
  const [isPending, startTransition] = useTransition();

  function onFileChange(file: File | undefined) {
    setFileName(file?.name ?? null);
    setError(null);
    setResult(null);
    setUiState("idle");
  }

  /** Shared validate + fetch — never relies on native form navigation. */
  function runMatch(form: HTMLFormElement) {
    const data = new FormData(form);
    const file = data.get("cv");
    const normalizedUrl = normalizeJobUrl(String(data.get("jobUrl") ?? ""));

    if (!(file instanceof File) || file.size === 0) {
      setError(messages.form.missingCv);
      setUiState("error");
      return;
    }
    if (!normalizedUrl) {
      setError(messages.form.missingUrl);
      setUiState("error");
      return;
    }

    data.set("jobUrl", normalizedUrl);
    data.set("locale", locale);
    setJobUrl(normalizedUrl);
    setError(null);
    setResult(null);
    setUiState("loading");

    startTransition(async () => {
      try {
        const response = await fetch("/api/match", {
          method: "POST",
          body: data,
        });
        const payload = (await response.json()) as MatchResult | MatchErrorBody;

        if (!response.ok) {
          const message =
            "error" in payload ? payload.error : messages.form.matchFailed;
          setError(message);
          setUiState("error");
          return;
        }

        setResult(payload as MatchResult);
        setUiState("result");
      } catch {
        setError(messages.form.networkError);
        setUiState("error");
      }
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    runMatch(event.currentTarget);
  }

  /**
   * Always preventDefault on click so an invalid (or pre-hydrate) click never
   * triggers native navigation. runMatch handles validation + fetch.
   * type=submit kept for Enter-key / a11y; form onSubmit is the other path.
   */
  function onSubmitClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const form = event.currentTarget.form ?? formRef.current;
    if (form) runMatch(form);
  }

  const busy = isPending || uiState === "loading";

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        method="post"
        action="#"
        encType="multipart/form-data"
        noValidate
        className="relative space-y-6 rounded-none border border-[var(--ink)]/15 bg-[var(--panel)]/90 p-6 shadow-[8px_8px_0_0_var(--ink)] backdrop-blur-sm sm:p-8"
      >
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--lime)]">
            {messages.form.steps}
          </p>
          <h2 className="font-display text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
            {messages.form.title}
          </h2>
          <p className="max-w-prose text-[var(--quiet)]">{messages.form.blurb}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cv" className="text-[var(--ink)]">
            {messages.form.cvLabel}
          </Label>
          <label
            htmlFor="cv"
            className={cn(
              "group flex cursor-pointer flex-col items-start gap-3 border border-dashed border-[var(--ink)]/30 bg-[var(--wash)] px-4 py-5 transition",
              "hover:border-[var(--lime)] hover:bg-[var(--lime-soft)]",
            )}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center border border-[var(--ink)]/20 bg-white text-[var(--lime)]">
                <FileUp className="size-5" />
              </span>
              <div>
                <p className="font-medium text-[var(--ink)]">
                  {fileName ?? messages.form.cvPick}
                </p>
                <p className="text-sm text-[var(--quiet)]">
                  {messages.form.cvHint}
                </p>
              </div>
            </div>
            {/* Native file input — Base UI Field.Control is unreliable for multipart PDF uploads */}
            <input
              id="cv"
              name="cv"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => onFileChange(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobUrl" className="text-[var(--ink)]">
            {messages.form.jobLabel}
          </Label>
          <div className="relative">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--quiet)]" />
            <Input
              id="jobUrl"
              name="jobUrl"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="https://..."
              value={jobUrl}
              onChange={(e) => {
                setJobUrl(e.target.value);
                setError(null);
              }}
              className="h-12 border-[var(--ink)]/20 bg-white pl-10 text-[var(--ink)] placeholder:text-[var(--quiet)]/70"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          onClick={onSubmitClick}
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-none border border-[var(--ink)] bg-[var(--lime)] px-4 text-sm font-medium text-[var(--ink)] shadow-[4px_4px_0_0_var(--ink)] transition hover:bg-[var(--lime-strong)] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {messages.form.submitting}
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              {messages.form.submit}
            </>
          )}
        </button>
      </form>

      <section
        aria-live="polite"
        className="relative min-h-[280px] overflow-hidden border border-[var(--ink)]/15 bg-[var(--panel)]/80 p-6 shadow-[8px_8px_0_0_rgba(20,36,32,0.12)] sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(var(--ink) 1px, transparent 1px), linear-gradient(90deg, var(--ink) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {uiState === "idle" && (
          <div className="relative flex h-full min-h-[240px] flex-col justify-end gap-3 animate-in fade-in duration-500">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--quiet)]">
              {messages.result.idleEyebrow}
            </p>
            <h3 className="font-display text-3xl text-[var(--ink)]">
              {messages.result.idleTitle}
            </h3>
            <p className="max-w-sm text-[var(--quiet)]">
              {messages.result.idleBody}
            </p>
          </div>
        )}

        {busy && (
          <div className="relative flex h-full min-h-[240px] flex-col justify-center gap-4 animate-in fade-in duration-300">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--lime)]">
              {messages.result.analyzingEyebrow}
            </p>
            <h3 className="font-display text-3xl text-[var(--ink)]">
              {messages.result.analyzingTitle}
            </h3>
            <Progress value={66} className="h-2" />
            <p className="text-sm text-[var(--quiet)]">
              {messages.result.analyzingBody}
            </p>
          </div>
        )}

        {uiState === "error" && error && (
          <Alert
            variant="destructive"
            className="relative rounded-none border-[var(--danger)]/40 bg-[var(--danger-soft)] text-[var(--ink)] animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <AlertTitle>{messages.result.errorTitle}</AlertTitle>
            <AlertDescription className="text-[var(--ink)]/80">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {uiState === "result" && result && (
          <ResultPanel result={result} messages={messages} />
        )}
      </section>
    </div>
  );
}
