"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SkillGroup({
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
