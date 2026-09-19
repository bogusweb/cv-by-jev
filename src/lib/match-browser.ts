import { JobFetchError, type JobDocument } from "@/lib/job-errors";
import { getMessages, parseLocale, type Locale } from "@/lib/i18n";
import { scoreHeuristicMatch } from "@/lib/match-heuristic";
import { extractPdfText } from "@/lib/pdf";
import type { MatchResult } from "@/lib/types";

const MIN_JOB_CHARS = 80;
const FETCH_TIMEOUT_MS = 15_000;

function cleanText(value: string): string {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function assertHttpUrl(raw: string, locale: Locale): URL {
  const t = getMessages(locale).api;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new JobFetchError(t.jobInvalidUrl, "JOB_FETCH");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new JobFetchError(t.jobHttpOnly, "JOB_FETCH");
  }
  return parsed;
}

function extractJobFromHtml(
  html: string,
  url: string,
  locale: Locale,
): JobDocument {
  const t = getMessages(locale).api;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("script, style, noscript, svg, iframe, nav, footer, header")
    .forEach((el) => el.remove());

  const title =
    doc.querySelector("meta[property='og:title']")?.getAttribute("content")?.trim() ||
    doc.querySelector("title")?.textContent?.trim() ||
    doc.querySelector("h1")?.textContent?.trim() ||
    undefined;

  const candidates = [
    doc.querySelector("article")?.textContent ?? "",
    doc.querySelector("[role='main']")?.textContent ?? "",
    doc.querySelector("main")?.textContent ?? "",
    doc.querySelector(".job-description, .jobDescription, #job-description")
      ?.textContent ?? "",
    doc.body?.textContent ?? "",
  ];

  const text = cleanText(
    candidates.find((chunk) => cleanText(chunk).length >= MIN_JOB_CHARS) ?? "",
  );

  if (text.length < MIN_JOB_CHARS) {
    throw new JobFetchError(t.jobEmpty, "JOB_EMPTY");
  }

  return { url, title, text };
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

async function fetchJobListingInBrowser(
  rawUrl: string,
  locale: Locale,
): Promise<JobDocument> {
  const lang = parseLocale(locale);
  const t = getMessages(lang).api;
  const trimmed = rawUrl.trim();
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = assertHttpUrl(withScheme, lang);
  const href = url.toString();

  const attempts = [
    href,
    `https://corsproxy.io/?${encodeURIComponent(href)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(href)}`,
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const html = await fetchHtml(attempt);
      return extractJobFromHtml(html, href, lang);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof JobFetchError) throw lastError;
  throw new JobFetchError(t.jobFetchFailed, "JOB_FETCH");
}

/** Local heuristic path used when the server match API is unreachable. */
export async function runBrowserHeuristicMatch(input: {
  file: File;
  jobUrl: string;
  locale: Locale;
}): Promise<MatchResult> {
  const locale = parseLocale(input.locale);
  const cvText = await extractPdfText(await input.file.arrayBuffer(), locale);
  const job = await fetchJobListingInBrowser(input.jobUrl, locale);
  return scoreHeuristicMatch({
    cvText,
    jobText: job.text,
    jobUrl: job.url,
    jobTitle: job.title,
    locale,
  });
}
