import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

const MIN_JOB_CHARS = 80;
const FETCH_TIMEOUT_MS = 15_000;

export class JobFetchError extends Error {
  code: "JOB_FETCH" | "JOB_EMPTY";

  constructor(message: string, code: "JOB_FETCH" | "JOB_EMPTY") {
    super(message);
    this.name = "JobFetchError";
    this.code = code;
  }
}

export interface JobDocument {
  url: string;
  title?: string;
  text: string;
}

function assertHttpUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new JobFetchError(
      "Podaj prawidłowy adres URL oferty (http lub https).",
      "JOB_FETCH",
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new JobFetchError(
      "Obsługujemy tylko adresy http i https.",
      "JOB_FETCH",
    );
  }

  return parsed;
}

function cleanText(value: string): string {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function extractWithReadability(html: string, url: string): JobDocument | null {
  try {
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    if (!article?.textContent) return null;

    const text = cleanText(article.textContent);
    if (text.length < MIN_JOB_CHARS) return null;

    return {
      url,
      title: article.title?.trim() || undefined,
      text,
    };
  } catch {
    return null;
  }
}

function extractWithCheerio(html: string, url: string): JobDocument {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, nav, footer, header").remove();

  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("title").first().text().trim() ||
    $("h1").first().text().trim() ||
    undefined;

  const candidates = [
    $("article").text(),
    $("[role='main']").text(),
    $("main").text(),
    $(".job-description, .jobDescription, #job-description").text(),
    $("body").text(),
  ];

  const text = cleanText(
    candidates.find((chunk) => cleanText(chunk).length >= MIN_JOB_CHARS) ?? "",
  );

  if (text.length < MIN_JOB_CHARS) {
    throw new JobFetchError(
      "Strona oferty nie zawiera wystarczającej ilości tekstu do analizy.",
      "JOB_EMPTY",
    );
  }

  return { url, title, text };
}

export async function fetchJobListing(rawUrl: string): Promise<JobDocument> {
  const trimmed = rawUrl.trim();
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = assertHttpUrl(withScheme);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent":
          "CV-By-Jev/0.1 (+https://localhost; job listing text extractor)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
  } catch {
    throw new JobFetchError(
      "Nie udało się pobrać oferty. Sprawdź adres URL i spróbuj ponownie.",
      "JOB_FETCH",
    );
  }

  if (!response.ok) {
    throw new JobFetchError(
      `Serwer oferty zwrócił błąd HTTP ${response.status}.`,
      "JOB_FETCH",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (
    contentType &&
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml") &&
    !contentType.includes("text/plain")
  ) {
    throw new JobFetchError(
      "Adres nie wygląda na stronę HTML z ogłoszeniem.",
      "JOB_FETCH",
    );
  }

  const html = await response.text();
  const readable = extractWithReadability(html, url.toString());
  if (readable) return readable;
  return extractWithCheerio(html, url.toString());
}
