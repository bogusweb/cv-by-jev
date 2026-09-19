# CV By Jev

Dopasuj **CV (PDF)** do **oferty pracy (URL)** przy użyciu modelu **Jev** (TypeSafe System One). Bez klucza API aplikacja działa na heurystyce słów kluczowych.

**Live:** [https://bogusweb.github.io/cv-by-jev/](https://bogusweb.github.io/cv-by-jev/)

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

### TypeSafe / Jev

```bash
export TYPESAFE_API_KEY=your_key
npm run dev
```

`TYPESAFE_API_KEY` jest czytany **tylko po stronie serwera** (`process.env` w `/api/match`). Nie ustawiaj `NEXT_PUBLIC_TYPESAFE_API_KEY` — klucz wylądowałby w paczce przeglądarki.

Bez klucza endpoint zwraca `provider: "heuristic"`. Z kluczem — composite scoring przez Jev (`provider: "typesafe"`).

## Deploy (GitHub Pages + API)

GitHub Pages serwuje tylko pliki statyczne, więc Route Handlers Next.js tam nie działają. Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) przy pushu na `main` (oraz `workflow_dispatch`):

1. Buduje i publikuje **kontener Node** (`ghcr.io/bogusweb/cv-by-jev`) — runtime `next start`, klucz wstrzykiwany przy starcie, nie w obrazie.
2. Wdraża **Cloudflare Worker** z sekretem `TYPESAFE_API_KEY` (serwerowy match API).
3. Eksportuje UI (`basePath` `/cv-by-jev`) na **GitHub Pages**.

### Sekret w GitHub

W repozytorium: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Wymagany | Użycie |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | tak (Jev) | Worker / `docker run -e TYPESAFE_API_KEY=…` / lokalny serwer. Workflow: `TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}` |
| `CLOUDFLARE_API_TOKEN` | dla publicznego Jev API | Deploy Workera (`cv-by-jev-api.*.workers.dev`) |
| `CLOUDFLARE_ACCOUNT_ID` | dla publicznego Jev API | Konto Cloudflare |

Bez Cloudflare UI na Pages nadal działa (heurystyka w przeglądarce). Jev na publicznym URL wymaga Workera albo uruchomienia obrazu GHCR z sekretem.

Pages: **Settings → Pages → Source = GitHub Actions** (workflow ustawia `build_type=workflow` przez API).

## Języki

UI i komunikaty API: **PL** / **EN** (przełącznik w nagłówku, zapis w `localStorage`). Domyślnie polski.

## Przepływ

1. Wgraj CV PDF z warstwą tekstową.
2. Wklej URL ogłoszenia.
3. `POST /api/match` → ekstrakcja PDF → pobranie oferty → scoring → wynik (score, rekomendacja, wspólne / pokryte równoważnością / nadal brakujące).

Heurystyka używa lekkiej mapy synonimów (np. TypeScript↔JavaScript). Z kluczem TypeSafe **Jev** ocenia równoważność per skill (Noul) w tym samym wywołaniu `systemOne`.

## Uwagi

- Skan / PDF bez tekstu → czytelny błąd po polsku (OCR później).
- Limit PDF: 8 MB.
- Nie commituj plików `.env` z prawdziwymi kluczami.
