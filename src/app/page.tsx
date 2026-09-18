import { MatchForm } from "@/components/match-form";

export default function Home() {
  return (
    <div className="bg-atmosphere relative flex flex-1 flex-col overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--quiet)]">
          Match · PDF · URL
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--ink)]/70">
          TypeSafe Jev ready
        </p>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 sm:px-8">
        <section className="mb-10 max-w-3xl pt-4 sm:mb-14 sm:pt-8">
          <p className="hero-rise font-display text-5xl leading-[0.95] tracking-tight text-[var(--ink)] sm:text-7xl md:text-8xl">
            CV By Jev
          </p>
          <h1 className="hero-rise-delay mt-5 max-w-xl text-xl font-medium text-[var(--ink)] sm:text-2xl">
            Sprawdź, czy Twoje CV pasuje do oferty.
          </h1>
          <p className="hero-rise-delay-2 mt-3 max-w-lg text-[var(--quiet)]">
            Wgraj PDF, wklej link do ogłoszenia — dostaniesz score, rekomendację
            i konkretne sygnały dopasowania.
          </p>
        </section>

        <div className="hero-rise-delay-2">
          <MatchForm />
        </div>
      </main>

      <footer className="relative z-10 mx-auto w-full max-w-6xl px-5 py-6 text-sm text-[var(--quiet)] sm:px-8">
        OCR skanów i pełny tuning wag composite — w kolejnych iteracjach.
      </footer>
    </div>
  );
}
