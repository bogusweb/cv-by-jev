import { NextResponse } from "next/server";
import { fetchJobListing, JobFetchError } from "@/lib/job-fetch";
import { runMatch } from "@/lib/match";
import { extractPdfText, PdfExtractionError } from "@/lib/pdf";
import type { MatchErrorBody } from "@/lib/types";

export const runtime = "nodejs";

function errorResponse(
  status: number,
  body: MatchErrorBody,
): NextResponse<MatchErrorBody> {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("cv");
    const jobUrl = String(form.get("jobUrl") ?? "").trim();

    if (!(file instanceof File)) {
      return errorResponse(400, {
        error: "Dołącz plik PDF z CV.",
        code: "INVALID_INPUT",
      });
    }

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return errorResponse(400, {
        error: "CV musi być plikiem PDF.",
        code: "INVALID_INPUT",
      });
    }

    if (file.size > 8 * 1024 * 1024) {
      return errorResponse(400, {
        error: "Plik PDF jest za duży (limit 8 MB).",
        code: "INVALID_INPUT",
      });
    }

    if (!jobUrl) {
      return errorResponse(400, {
        error: "Wklej adres URL oferty pracy.",
        code: "INVALID_INPUT",
      });
    }

    const buffer = await file.arrayBuffer();
    const cvText = await extractPdfText(buffer);
    const job = await fetchJobListing(jobUrl);
    const result = await runMatch({
      cvText,
      jobText: job.text,
      jobUrl: job.url,
      jobTitle: job.title,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PdfExtractionError) {
      return errorResponse(422, {
        error: error.message,
        code: error.code,
      });
    }

    if (error instanceof JobFetchError) {
      return errorResponse(422, {
        error: error.message,
        code: error.code,
      });
    }

    console.error("Unexpected /api/match error:", error);
    return errorResponse(500, {
      error: "Coś poszło nie tak podczas dopasowania. Spróbuj ponownie.",
      code: "MATCH_FAILED",
    });
  }
}
