"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp, Link2, Loader2, Sparkles } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { getMatchApiUrl } from "@/lib/match-api-url";
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
