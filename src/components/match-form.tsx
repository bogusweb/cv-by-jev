"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp, Link2, Loader2, Sparkles } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { MatchErrorBody, MatchResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type UiState = "idle" | "loading" | "error" | "result";

function normalizeJobUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
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
                <Badge className="rounded-none border border-[var(--ink)] bg-[var(--lime)] text-[var(--ink)]">
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

            <p className="text-lg leading-relaxed text-[var(--ink)]">
              {result.summary}
            </p>

            <Progress value={result.score} className="h-2" />

            <ul className="space-y-3">
              {result.highlights.map((item) => (
                <li
                  key={`${item.label}-${item.detail}`}
                  className="border-l-2 border-[var(--lime)] pl-3"
                >
                  <p className="text-sm font-medium text-[var(--ink)]">
                    {item.label}
                  </p>
                  <p className="text-sm text-[var(--quiet)]">{item.detail}</p>
                </li>
              ))}
            </ul>

            {(result.matchedSkills.length > 0 ||
              result.coveredByEquivalence.length > 0 ||
              result.stillMissing.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--quiet)]">
                    {messages.result.matched}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedSkills.slice(0, 10).map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="rounded-none"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {result.matchedSkills.length === 0 && (
                      <span className="text-sm text-[var(--quiet)]">
                        {messages.result.empty}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--quiet)]">
                    {messages.result.coveredByEquivalence}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.coveredByEquivalence.slice(0, 10).map((skill) => (
                      <Badge
                        key={`eq-${skill}`}
                        variant="secondary"
                        className="rounded-none border border-[var(--lime)]/40"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {result.coveredByEquivalence.length === 0 && (
                      <span className="text-sm text-[var(--quiet)]">
                        {messages.result.empty}
                      </span>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--quiet)]">
                    {messages.result.stillMissing}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.stillMissing.slice(0, 10).map((skill) => (
                      <Badge
                        key={`miss-${skill}`}
                        variant="outline"
                        className="rounded-none"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {result.stillMissing.length === 0 && (
                      <span className="text-sm text-[var(--quiet)]">
                        {messages.result.empty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
