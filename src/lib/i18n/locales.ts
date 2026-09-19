export const LOCALES = ["pl", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pl";

export const LOCALE_STORAGE_KEY = "cv-by-jev-locale";

export function parseLocale(value: unknown): Locale {
  if (value === "en" || value === "pl") return value;
  return DEFAULT_LOCALE;
}
