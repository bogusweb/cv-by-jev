import * as cheerio from "cheerio";
import { getMessages, parseLocale, type Locale } from "@/lib/i18n";
import { JobFetchError, type JobDocument } from "@/lib/job-errors";

export { JobFetchError, type JobDocument } from "@/lib/job-errors";

const MIN_JOB_CHARS = 80;
const FETCH_TIMEOUT_MS = 15_000;

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

function cleanText(value: string): string {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function extractWithReadability(
  html: string,
  url: string,
): Promise<JobDocument | null> {
  try {
    const [{ JSDOM }, { Readability }] = await Promise.all([
      import("jsdom"),
      import("@mozilla/readability"),
    ]);
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

function extractWithCheerio(
  html: string,
  url: string,
  locale: Locale,
): JobDocument {
  const t = getMessages(locale).api;
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
    throw new JobFetchError(t.jobEmpty, "JOB_EMPTY");
  }

  return { url, title, text };
}

export async function fetchJobListing(
  rawUrl: string,
  locale: Locale = "pl",
): Promise<JobDocument> {
  const lang = parseLocale(locale);
  const t = getMessages(lang).api;
  const trimmed = rawUrl.trim();
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = assertHttpUrl(withScheme, lang);

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
    throw new JobFetchError(t.jobFetchFailed, "JOB_FETCH");
  }

  if (!response.ok) {
    throw new JobFetchError(t.jobHttpStatus(response.status), "JOB_FETCH");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (
    contentType &&
    !contentType.includes("text/html") &&
    !contentType.includes("application/xhtml") &&
    !contentType.includes("text/plain")
  ) {
    throw new JobFetchError(t.jobNotHtml, "JOB_FETCH");
  }

  const html = await response.text();
  const readable = await extractWithReadability(html, url.toString());
  if (readable) return readable;
  return extractWithCheerio(html, url.toString(), lang);
}
