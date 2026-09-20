import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pdf = join(root, "fixtures", "sample-cv.pdf");
const url = process.env.DEMO_URL ?? "https://bogusweb.github.io/cv-by-jev/";
const job =
  process.env.DEMO_JOB_URL ??
  "https://bogusweb.github.io/cv-by-jev/sample-job.html";
const docs = join(root, "docs");
const videoDir = join(root, ".demo-video");

if (!existsSync(pdf)) {
  throw new Error(`Missing sample CV: ${pdf}`);
}

mkdirSync(docs, { recursive: true });
mkdirSync(videoDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } },
  locale: "pl-PL",
});
const page = await context.newPage();
page.setDefaultTimeout(25000);

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("#jobUrl");
await page.waitForTimeout(800);

await page.locator('input[type="file"][name="cv"]').setInputFiles(pdf);
await page.waitForTimeout(700);

const jobInput = page.locator("#jobUrl, input[name='jobUrl']").first();
await jobInput.click();
await jobInput.fill("");
await jobInput.pressSequentially(job, { delay: 12 });
await page.waitForTimeout(400);

await page
  .getByRole("button", { name: /sprawdź dopasowanie|check match/i })
  .click();

await page.getByText(/\/\s*100|łączny wynik|dlaczego/i).first().waitFor({
  timeout: 25000,
});
await page.waitForTimeout(2800);

const video = page.video();
await context.close();
await browser.close();
if (!video) {
  throw new Error("Playwright did not produce a video");
}

const recorded = await video.path();
const webm = join(docs, "demo.webm");
const gif = join(docs, "demo.gif");
copyFileSync(recorded, webm);

execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    webm,
    "-vf",
    "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer",
    gif,
  ],
  { stdio: "inherit" },
);

console.log("WROTE", webm);
console.log("WROTE", gif);
