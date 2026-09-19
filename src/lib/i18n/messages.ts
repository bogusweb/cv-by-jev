import type { Locale } from "@/lib/i18n/locales";
import type { MatchRecommendation } from "@/lib/types";

export type Messages = {
  meta: {
    description: string;
  };
  chrome: {
    tagline: string;
    ready: string;
    footer: string;
    langLabel: string;
    langPl: string;
    langEn: string;
  };
  hero: {
    headline: string;
    sub: string;
  };
  form: {
    steps: string;
    title: string;
    blurb: string;
    cvLabel: string;
    cvPick: string;
    cvHint: string;
    jobLabel: string;
    submit: string;
    submitting: string;
    missingCv: string;
    missingUrl: string;
    networkError: string;
    matchFailed: string;
  };
  result: {
    idleEyebrow: string;
    idleTitle: string;
    idleBody: string;
    analyzingEyebrow: string;
    analyzingTitle: string;
    analyzingBody: string;
    errorTitle: string;
    eyebrow: string;
    jobLabel: string;
    matched: string;
    coveredByEquivalence: string;
    stillMissing: string;
    empty: string;
    recommendation: Record<MatchRecommendation, string>;
  };
  api: {
    invalidCv: string;
    invalidPdf: string;
    pdfTooLarge: string;
    missingJobUrl: string;
    matchFailed: string;
    pdfEmpty: string;
    pdfParse: string;
    jobInvalidUrl: string;
    jobHttpOnly: string;
    jobEmpty: string;
    jobFetchFailed: string;
    jobHttpStatus: (status: number) => string;
    jobNotHtml: string;
  };
  heuristic: {
    summaryStrong: (skills: string) => string;
    summaryPartial: (gaps: string) => string;
    summaryWeak: string;
    keywordsFallback: string;
    missingFallback: string;
    labelMatched: string;
    labelEquivalence: string;
    labelMissing: string;
    labelMode: string;
    modeDetail: string;
  };
  typesafe: {
    levels: readonly [string, string, string, string, string];
    task: string;
    gapQuestion: (skill: string) => string;
    skillsFit: string;
    experienceFit: string;
    domainFit: string;
    meetsMustHaves: string;
    equivalenceCoverage: string;
    stillHasCriticalGaps: string;
    recommendPrompt: string;
    recommendApply: string;
    recommendMaybe: string;
    recommendSkip: string;
    summaryApply: (percent: number) => string;
    summaryMaybe: (percent: number) => string;
    summarySkip: (percent: number) => string;
    labelEquivalence: string;
    labelMissing: string;
    labelEquivalenceNote: string;
    labelComposite: string;
    labelMustHave: string;
    labelWeights: string;
    criticalGapsFallback: (p: string) => string;
    fallbackLabel: string;
    fallbackDetail: string;
  };
};

const pl: Messages = {
  meta: {
    description:
      "Dopasuj CV PDF do oferty pracy z Jev (TypeSafe) — lokalnie działa też heurystyka.",
  },
  chrome: {
    tagline: "Match · PDF · URL",
    ready: "TypeSafe Jev ready",
    footer: "OCR skanów i pełny tuning wag composite — w kolejnych iteracjach.",
    langLabel: "Język",
    langPl: "PL",
    langEn: "EN",
  },
  hero: {
    headline: "Sprawdź, czy Twoje CV pasuje do oferty.",
    sub: "Wgraj PDF, wklej link do ogłoszenia — dostaniesz score, rekomendację i konkretne sygnały dopasowania.",
  },
  form: {
    steps: "Krok 1–2",
    title: "Wgraj CV i wklej ofertę",
    blurb:
      "Porównamy tekst CV z treścią ogłoszenia. Bez klucza TypeSafe działa heurystyka; z kluczem — Jev.",
    cvLabel: "Plik CV (PDF)",
    cvPick: "Wybierz PDF z warstwą tekstową",
    cvHint: "Max 8 MB · skany bez OCR w MVP",
    jobLabel: "URL oferty pracy",
    submit: "Sprawdź dopasowanie",
    submitting: "Dopasowuję…",
    missingCv: "Dołącz plik PDF z CV.",
    missingUrl: "Wklej adres URL oferty pracy.",
    networkError: "Błąd sieci. Sprawdź połączenie i spróbuj ponownie.",
    matchFailed: "Nie udało się dopasować CV do oferty.",
  },
  result: {
    idleEyebrow: "Wynik",
    idleTitle: "Tu pojawi się score",
    idleBody:
      "Po wysłaniu zobaczysz procent dopasowania, rekomendację, wspólne sygnały oraz skills pokryte równoważnością vs nadal brakujące.",
    analyzingEyebrow: "Analiza",
    analyzingTitle: "Czytam CV i ofertę…",
    analyzingBody: "Ekstrakcja PDF → pobranie ogłoszenia → scoring",
    errorTitle: "Nie udało się dokończyć",
    eyebrow: "Wynik",
    jobLabel: "Oferta:",
    matched: "Wspólne",
    coveredByEquivalence: "Pokryte równoważnymi skillami",
    stillMissing: "Nadal brakuje",
    empty: "brak",
    recommendation: {
      apply: "Aplikuj",
      maybe: "Rozważ",
      skip: "Pomiń",
    },
  },
  api: {
    invalidCv: "Dołącz plik PDF z CV.",
    invalidPdf: "CV musi być plikiem PDF.",
    pdfTooLarge: "Plik PDF jest za duży (limit 8 MB).",
    missingJobUrl: "Wklej adres URL oferty pracy.",
    matchFailed:
      "Coś poszło nie tak podczas dopasowania. Spróbuj ponownie.",
    pdfEmpty:
      "Nie udało się odczytać tekstu z PDF. Plik może być skanem albo obrazem — OCR dołączymy później. Wgraj CV z warstwą tekstową.",
    pdfParse:
      "Nie udało się przetworzyć pliku PDF. Sprawdź, czy to prawidłowy dokument.",
    jobInvalidUrl: "Podaj prawidłowy adres URL oferty (http lub https).",
    jobHttpOnly: "Obsługujemy tylko adresy http i https.",
    jobEmpty:
      "Strona oferty nie zawiera wystarczającej ilości tekstu do analizy.",
    jobFetchFailed:
      "Nie udało się pobrać oferty. Sprawdź adres URL i spróbuj ponownie.",
    jobHttpStatus: (status) =>
      `Serwer oferty zwrócił błąd HTTP ${status}.`,
    jobNotHtml: "Adres nie wygląda na stronę HTML z ogłoszeniem.",
  },
  heuristic: {
    summaryStrong: (skills) =>
      `Silne dopasowanie — CV pokrywa kluczowe wymagania oferty (${skills}).`,
    summaryPartial: (gaps) =>
      `Częściowe dopasowanie. Warto podkreślić wspólne kompetencje i domknąć luki: ${gaps}.`,
    summaryWeak:
      "Słabe dopasowanie względem tej oferty. CV i ogłoszenie mają mało wspólnych sygnałów kompetencji.",
    keywordsFallback: "istotne słowa kluczowe",
    missingFallback: "brakujące słowa kluczowe",
    labelMatched: "Wspólne sygnały",
    labelEquivalence: "Pokryte równoważnymi skillami",
    labelMissing: "Nadal brakuje",
    labelMode: "Tryb dopasowania",
    modeDetail:
      "Heurystyka + mapa synonimów (bez TYPESAFE_API_KEY). Z kluczem Jev ocenia równoważność skills.",
  },
  typesafe: {
    levels: [
      "Brak istotnego pokrycia",
      "Słabe pokrycie",
      "Umiarkowane pokrycie",
      "Dobre pokrycie",
      "Bardzo dobre pokrycie",
    ],
    task: "Oceń dopasowanie CV kandydata do oferty pracy, w tym równoważność skills.",
    gapQuestion: (skill) =>
      `Czy wymaganie skill „${skill}” z oferty jest pokryte przez równoważny, pokrewny lub transferowalny skill obecny w CV? Przykłady: TypeScript pokrywa JavaScript; Next.js pokrywa React; Spring pokrywa Java; Tailwind pokrywa CSS. Jeśli w CV jest bezpośrednio „${skill}”, też tak.`,
    skillsFit:
      "Jak dobrze umiejętności i stack z CV pokrywają wymagania oferty?",
    experienceFit:
      "Jak dobrze doświadczenie i seniority z CV pasują do oferty?",
    domainFit:
      "Jak dobrze domena / branża / kontekst CV pasuje do oferty?",
    meetsMustHaves:
      "Czy CV spełnia twarde must-have wymagania tej oferty (języki, lata doświadczenia, obowiązkowe technologie)?",
    equivalenceCoverage:
      "Po uwzględnieniu równoważności i transferowalności skills (np. TypeScript↔JavaScript, React↔Next.js, Java↔Spring, CSS↔Tailwind): jak dobrze CV pokrywa wymagania oferty, które wyglądają na brakujące przy prostym porównaniu stringów?",
    stillHasCriticalGaps:
      "Czy po uwzględnieniu równoważnych i pokrewnych skills nadal brakuje istotnych technologii wymaganych w ofercie?",
    recommendPrompt: "Czy kandydat powinien aplikować na tę ofertę?",
    recommendApply: "Tak — warto aplikować",
    recommendMaybe:
      "Może — aplikować po dopracowaniu CV lub z zastrzeżeniami",
    recommendSkip: "Nie — lepiej pominąć tę ofertę",
    summaryApply: (percent) =>
      `Jev (composite) ocenia dopasowanie na ${percent}/100 — silne pokrycie umiejętności i must-have.`,
    summaryMaybe: (percent) =>
      `Jev (composite) ocenia dopasowanie na ${percent}/100 — częściowe pokrycie; warto dopracować CV.`,
    summarySkip: (percent) =>
      `Jev (composite) ocenia dopasowanie na ${percent}/100 — słabe pokrycie względem tej oferty.`,
    labelEquivalence: "Pokryte równoważnymi skillami",
    labelMissing: "Nadal brakuje",
    labelEquivalenceNote: "Równoważność skills (Jev)",
    labelComposite: "Wymiary composite",
    labelMustHave: "Must-have (Noul)",
    labelWeights: "Wagi w kodzie",
    criticalGapsFallback: (p) =>
      `P(istotne luki po równoważności)=${p}`,
    fallbackLabel: "Fallback",
    fallbackDetail:
      "Wywołanie TypeSafe/Jev nie powiodło się — użyto heurystyki słów kluczowych.",
  },
};

const en: Messages = {
  meta: {
    description:
      "Match a CV PDF to a job listing with Jev (TypeSafe) — local keyword heuristic works without an API key.",
  },
  chrome: {
    tagline: "Match · PDF · URL",
    ready: "TypeSafe Jev ready",
    footer: "Scan OCR and full composite weight tuning come in later iterations.",
    langLabel: "Language",
    langPl: "PL",
    langEn: "EN",
  },
  hero: {
    headline: "See how well your CV fits the job.",
    sub: "Upload a PDF, paste the listing URL — get a score, recommendation, and concrete match signals.",
  },
  form: {
    steps: "Step 1–2",
    title: "Upload CV and paste the job",
    blurb:
      "We compare CV text with the listing. Without a TypeSafe key, heuristic scoring runs; with a key — Jev.",
    cvLabel: "CV file (PDF)",
    cvPick: "Choose a text-layer PDF",
    cvHint: "Max 8 MB · scans without OCR in MVP",
    jobLabel: "Job listing URL",
    submit: "Check match",
    submitting: "Matching…",
    missingCv: "Attach a PDF CV.",
    missingUrl: "Paste the job listing URL.",
    networkError: "Network error. Check your connection and try again.",
    matchFailed: "Could not match the CV to the listing.",
  },
  result: {
    idleEyebrow: "Result",
    idleTitle: "Your score will show up here",
    idleBody:
      "After submit you’ll see match %, recommendation, shared signals, skills covered by equivalence, and what’s still missing.",
    analyzingEyebrow: "Analysis",
    analyzingTitle: "Reading CV and listing…",
    analyzingBody: "PDF extract → fetch listing → scoring",
    errorTitle: "Couldn’t finish",
    eyebrow: "Result",
    jobLabel: "Role:",
    matched: "Matched",
    coveredByEquivalence: "Covered by equivalent skills",
    stillMissing: "Still missing",
    empty: "none",
    recommendation: {
      apply: "Apply",
      maybe: "Consider",
      skip: "Skip",
    },
  },
  api: {
    invalidCv: "Attach a PDF CV.",
    invalidPdf: "CV must be a PDF file.",
    pdfTooLarge: "PDF is too large (8 MB limit).",
    missingJobUrl: "Paste the job listing URL.",
    matchFailed: "Something went wrong while matching. Please try again.",
    pdfEmpty:
      "Couldn’t read text from the PDF. It may be a scan or image — OCR comes later. Upload a text-layer CV.",
    pdfParse: "Couldn’t process the PDF. Check that it’s a valid document.",
    jobInvalidUrl: "Enter a valid job URL (http or https).",
    jobHttpOnly: "Only http and https URLs are supported.",
    jobEmpty: "The listing page doesn’t have enough text to analyze.",
    jobFetchFailed: "Couldn’t fetch the listing. Check the URL and try again.",
    jobHttpStatus: (status) => `Listing server returned HTTP ${status}.`,
    jobNotHtml: "That URL doesn’t look like an HTML job listing.",
  },
  heuristic: {
    summaryStrong: (skills) =>
      `Strong match — the CV covers key listing requirements (${skills}).`,
    summaryPartial: (gaps) =>
      `Partial match. Emphasize shared skills and close gaps: ${gaps}.`,
    summaryWeak:
      "Weak match for this listing. The CV and posting share few competence signals.",
    keywordsFallback: "key keywords",
    missingFallback: "missing keywords",
    labelMatched: "Shared signals",
    labelEquivalence: "Covered by equivalent skills",
    labelMissing: "Still missing",
    labelMode: "Match mode",
    modeDetail:
      "Heuristic + synonym map (no TYPESAFE_API_KEY). With a key, Jev judges skill equivalence.",
  },
  typesafe: {
    levels: [
      "No meaningful coverage",
      "Weak coverage",
      "Moderate coverage",
      "Good coverage",
      "Very strong coverage",
    ],
    task: "Score how well the candidate CV matches the job listing, including skill equivalence.",
    gapQuestion: (skill) =>
      `Is the listing skill “${skill}” covered by an equivalent, related, or transferable skill present in the CV? Examples: TypeScript covers JavaScript; Next.js covers React; Spring covers Java; Tailwind covers CSS. If the CV has “${skill}” directly, answer yes.`,
    skillsFit:
      "How well do the skills and stack in the CV cover the listing requirements?",
    experienceFit:
      "How well does CV experience and seniority fit the listing?",
    domainFit:
      "How well does CV domain / industry / context fit the listing?",
    meetsMustHaves:
      "Does the CV meet hard must-have requirements for this listing (languages, years of experience, required technologies)?",
    equivalenceCoverage:
      "After accounting for skill equivalence and transferability (e.g. TypeScript↔JavaScript, React↔Next.js, Java↔Spring, CSS↔Tailwind): how well does the CV cover listing requirements that look missing under naive string matching?",
    stillHasCriticalGaps:
      "After equivalent and related skills, are important required technologies still missing?",
    recommendPrompt: "Should the candidate apply to this listing?",
    recommendApply: "Yes — worth applying",
    recommendMaybe: "Maybe — apply after refining the CV or with caveats",
    recommendSkip: "No — better to skip this listing",
    summaryApply: (percent) =>
      `Jev (composite) scores the match at ${percent}/100 — strong skills and must-have coverage.`,
    summaryMaybe: (percent) =>
      `Jev (composite) scores the match at ${percent}/100 — partial coverage; refine the CV.`,
    summarySkip: (percent) =>
      `Jev (composite) scores the match at ${percent}/100 — weak coverage for this listing.`,
    labelEquivalence: "Covered by equivalent skills",
    labelMissing: "Still missing",
    labelEquivalenceNote: "Skill equivalence (Jev)",
    labelComposite: "Composite dimensions",
    labelMustHave: "Must-have (Noul)",
    labelWeights: "Weights in code",
    criticalGapsFallback: (p) =>
      `P(critical gaps after equivalence)=${p}`,
    fallbackLabel: "Fallback",
    fallbackDetail:
      "TypeSafe/Jev call failed — fell back to keyword heuristic.",
  },
};

const catalogs: Record<Locale, Messages> = { pl, en };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs.pl;
}
