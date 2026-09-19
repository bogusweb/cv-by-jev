import { fetchJobListing, JobFetchError } from "@/lib/job-fetch";
import { getMessages, parseLocale } from "@/lib/i18n";
import { runMatch } from "@/lib/match";
import { extractPdfText, PdfExtractionError } from "@/lib/pdf";
import type { MatchErrorBody } from "@/lib/types";

function jsonError(status: number, body: MatchErrorBody): Response {
  return Response.json(body, { status });
}

/**
 * Shared POST /api/match implementation for Next.js and the Pages API worker.
 * Reads TYPESAFE_API_KEY only from the process environment (never from the client).
 */
export async function handleMatchRequest(request: Request): Promise<Response> {
  const form = await request.formData();
  const locale = parseLocale(form.get("locale"));
  const t = getMessages(locale).api;

  try {
    const file = form.get("cv");
    const jobUrl = String(form.get("jobUrl") ?? "").trim();

    if (!(file instanceof File)) {
      return jsonError(400, {
        error: t.invalidCv,
        code: "INVALID_INPUT",
      });
    }

    if (
      !file.name.toLowerCase().endsWith(".pdf") &&
      file.type !== "application/pdf"
    ) {
      return jsonError(400, {
        error: t.invalidPdf,
        code: "INVALID_INPUT",
      });
    }

    if (file.size > 8 * 1024 * 1024) {
      return jsonError(400, {
        error: t.pdfTooLarge,
        code: "INVALID_INPUT",
      });
    }

    if (!jobUrl) {
      return jsonError(400, {
        error: t.missingJobUrl,
        code: "INVALID_INPUT",
      });
    }

    const buffer = await file.arrayBuffer();
    const cvText = await extractPdfText(buffer, locale);
    const job = await fetchJobListing(jobUrl, locale);
    const result = await runMatch({
      cvText,
      jobText: job.text,
      jobUrl: job.url,
      jobTitle: job.title,
      locale,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof PdfExtractionError) {
      return jsonError(422, {
        error: error.message,
        code: error.code,
      });
    }

    if (error instanceof JobFetchError) {
      return jsonError(422, {
        error: error.message,
        code: error.code,
      });
    }

    console.error("Unexpected /api/match error:", error);
    return jsonError(500, {
      error: t.matchFailed,
      code: "MATCH_FAILED",
    });
  }
}
