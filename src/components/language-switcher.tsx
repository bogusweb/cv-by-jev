"use client";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

const OPTIONS: Locale[] = ["pl", "en"];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, messages } = useLocale();

  return (
    <div
      role="group"
      aria-label={messages.chrome.langLabel}
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em]",
        className,
      )}
    >
      {OPTIONS.map((code) => {
        const active = locale === code;
        const label =
          code === "pl" ? messages.chrome.langPl : messages.chrome.langEn;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(code)}
            className={cn(
              "border px-2 py-1 transition",
              active
                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--panel)]"
                : "border-[var(--ink)]/25 text-[var(--quiet)] hover:border-[var(--ink)]/50 hover:text-[var(--ink)]",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
