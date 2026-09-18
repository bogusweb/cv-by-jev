import { extractText } from "unpdf";

const MIN_TEXT_CHARS = 40;

export class PdfExtractionError extends Error {
  code: "PDF_EMPTY" | "PDF_PARSE";

  constructor(message: string, code: "PDF_EMPTY" | "PDF_PARSE") {
    super(message);
    this.name = "PdfExtractionError";
    this.code = code;
  }
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    const { text } = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });

    const normalized = Array.isArray(text)
      ? text.join("\n")
      : typeof text === "string"
        ? text
        : "";

    const cleaned = normalized.replace(/\u0000/g, "").trim();

    if (cleaned.length < MIN_TEXT_CHARS) {
      throw new PdfExtractionError(
        "Nie udało się odczytać tekstu z PDF. Plik może być skanem albo obrazem — OCR dołączymy później. Wgraj CV z warstwą tekstową.",
        "PDF_EMPTY",
      );
    }

    return cleaned;
  } catch (error) {
    if (error instanceof PdfExtractionError) throw error;
    throw new PdfExtractionError(
      "Nie udało się przetworzyć pliku PDF. Sprawdź, czy to prawidłowy dokument.",
      "PDF_PARSE",
    );
  }
}
