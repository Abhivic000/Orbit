// Render the fallback stills from the real scene.
//
//   pnpm build && pnpm start          (in another terminal)
//   pnpm render:stills [baseUrl]      (default http://localhost:3000)
//
// Opens the story with ?tier=high&still=1 (capture mode: canvas only, centred
// framing, no turntable), scrolls to each beat, sets each colourway via the
// window.__orbitConfig hook, waits for the camera to settle, screenshots via
// the Chrome DevTools Protocol and encodes WebP with sharp.
// Output: public/fallback/<section>-<colourway>.webp and
//         public/fallback/configure-<colourway>-<material>.webp
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { launch } from "./cdp.mjs";

const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = "public/fallback";
const W = 1200;
const H = 900;
const SETTLE = Number(process.env.SETTLE ?? 5000);
const COLOURWAYS = ["basalt", "glacier", "moss", "signal"];
const MATERIALS = ["knit", "leather"];
// Scroll positions (viewport heights) mid-way through each pinned beat.
const SECTIONS = [
  ["hero", 0],
  ["comfort", 2.7],
  ["inside", 5.6],
  ["quiet", 8.1],
  ["colours", 10.6],
  ["outro", 13.3],
];

// ONLY=regex re-renders a subset, e.g. ONLY="^(colours|configure)".
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const want = (name) => !only || only.test(name);

const tmp = path.join(OUT, ".tmp");
await mkdir(tmp, { recursive: true });

async function save(page, name) {
  const png = path.join(tmp, `${name}.png`);
  await page.screenshot(png);
  const out = path.join(OUT, `${name}.webp`);
  const info = await sharp(png).webp({ quality: 80, effort: 6 }).toFile(out);
  console.log(`${out}  ${(info.size / 1024).toFixed(0)} KB`);
}

const page = await launch({ width: W, height: H });
await page.setViewport(W, H, false, 1);
try {
  for (const c of COLOURWAYS) {
    await page.goto(`${BASE}/?tier=high&still=1`);
    await page.waitFor("!!window.__orbit && !!window.__orbitConfig", 60000);
    await page.sleep(3000);
    for (const [section, vh] of SECTIONS) {
      if (!want(`${section}-${c}`)) continue;
      await page.eval(`window.scrollTo(0, ${vh} * innerHeight)`);
      await page.sleep(400);
      await page.eval(`window.__orbitConfig(${JSON.stringify(c)})`);
      await page.sleep(SETTLE);
      await save(page, `${section}-${c}`);
    }
  }
  for (const c of COLOURWAYS) {
    for (const m of MATERIALS) {
      if (!want(`configure-${c}-${m}`)) continue;
      await page.goto(`${BASE}/configure?c=${c}&m=${m}&tier=high&still=1`);
      await page.waitFor("!!window.__orbit", 60000);
      // Lighting comes from the HDRI: don't capture before it has loaded.
      await page.waitFor(
        "performance.getEntriesByType('resource').some((r) => r.name.includes('/hdri/') && r.responseEnd > 0)",
        60000,
      );
      await page.sleep(SETTLE);
      await save(page, `configure-${c}-${m}`);
    }
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
  page.close().finally(() => process.exit(0));
}
