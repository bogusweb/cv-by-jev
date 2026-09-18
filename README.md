# CV By Jev

Dopasuj **CV (PDF)** do **oferty pracy (URL)** przy użyciu modelu **Jev** (TypeSafe System One). Bez klucza API aplikacja działa lokalnie na heurystyce słów kluczowych.

## Stack

- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- PDF: `unpdf` (warstwa tekstowa; OCR skanów poza MVP)
- Oferta: `fetch` + Readability / cheerio
- Matching: `@typesafe-ai/sdk` (`jev-latest`) lub heurystyka

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Dev serwer nasłuchuje na `0.0.0.0:43127`. Otwórz [http://127.0.0.1:43127](http://127.0.0.1:43127).

### Opcjonalnie: TypeSafe

```bash
export TYPESAFE_API_KEY=your_key
npm run dev
```

Bez klucza endpoint `/api/match` zwraca `provider: "heuristic"`. Z kluczem — composite scoring przez Jev (`provider: "typesafe"`). Heurystyka zawsze działa w przeglądarce bez sekretów.

## Przepływ

1. Wgraj CV PDF z warstwą tekstową.
2. Wklej URL ogłoszenia.
3. `POST /api/match` → ekstrakcja PDF → pobranie oferty → scoring → wynik (score, rekomendacja, wspólne / pokryte równoważnością / nadal brakujące).

Heurystyka używa lekkiej mapy synonimów (np. TypeScript↔JavaScript). Z kluczem TypeSafe **Jev** ocenia równoważność per skill (Noul) w tym samym wywołaniu `systemOne`.

## Uwagi

- Skan / PDF bez tekstu → czytelny błąd po polsku (OCR później).
- Limit PDF: 8 MB.
