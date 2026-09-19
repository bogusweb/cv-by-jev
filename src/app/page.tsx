"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { MatchForm } from "@/components/match-form";
import { useLocale } from "@/components/locale-provider";

export default function Home() {
  const { messages } = useLocale();

  return (
    <div className="bg-atmosphere relative flex flex-1 flex-col overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--quiet)]">
          {messages.chrome.tagline}
        </p>
        <div className="flex items-center gap-3 sm:gap-5">
          <p className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink)]/70 sm:block">
            {messages.chrome.ready}
          </p>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 sm:px-8">
        <section className="mb-10 max-w-3xl pt-4 sm:mb-14 sm:pt-8">
          <p className="hero-rise font-display text-5xl leading-[0.95] tracking-tight text-[var(--ink)] sm:text-7xl md:text-8xl">
            CV By Jev
          </p>
          <h1 className="hero-rise-delay mt-5 max-w-xl text-xl font-medium text-[var(--ink)] sm:text-2xl">
            {messages.hero.headline}
          </h1>
          <p className="hero-rise-delay-2 mt-3 max-w-lg text-[var(--quiet)]">
            {messages.hero.sub}
          </p>
        </section>

        <div className="hero-rise-delay-2">
          <MatchForm />
        </div>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-5 py-6 text-sm text-[var(--quiet)] sm:px-8">
        {messages.chrome.footer}
      </footer>
    </div>
  );
}
