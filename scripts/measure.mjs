// Budget check: first-load transfer, model size, LCP element +
// time, draw calls / triangles / FPS from the live renderer.
//
//   pnpm build && pnpm start      (another terminal)
//   pnpm measure [baseUrl] [--gpu]
//
// Uses headless Chrome over CDP. Without --gpu Chrome renders WebGL with
// SwiftShader (CPU), so FPS here is NOT representative — draw calls,
// triangles, bytes and LCP are. Run with --gpu on a real machine for FPS.
import { stat } from "node:fs/promises";
import { launch } from "./cdp.mjs";

const args = process.argv.slice(2);
const BASE = args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000";
const gpu = args.includes("--gpu");
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function measure(path, { width, height, mobile, tier, scrollVh }) {
  const page = await launch({ width, height, gpu });
  await page.setViewport(width, height, mobile, mobile ? 2 : 1);
  // Fresh profile per run = cold cache, so this is true first-load transfer.

  await page.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `window.__lcp = { t: 0, el: "" };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = { t: e.startTime, el: (e.element && (e.element.id || e.element.tagName)) || e.url || "" }; } })
        .observe({ type: "largest-contentful-paint", buffered: true });`,
  });
  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}tier=${tier}`;
  await page.goto(url);
  await page.waitFor("window.__orbit !== undefined", 60000).catch(() => {});
  await page
    .waitFor(
      "performance.getEntriesByType('resource').some(r => r.name.includes('/models/'))",
      60000,
    )
    .catch(() => {});
  await page.sleep(6000);
  if (scrollVh) {
    await page.eval(`window.scrollTo(0, ${scrollVh} * innerHeight)`);
    await page.sleep(5000);
  }
  // Resource Timing gives transfer sizes for same-origin requests.
  const res = await page.eval(`(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const list = performance.getEntriesByType('resource').map(r => ({ name: r.name, size: r.transferSize || r.encodedBodySize, type: r.initiatorType }));
    return { nav: nav ? nav.transferSize || nav.encodedBodySize : 0, list };
  })()`);
  const lcp = await page.eval("JSON.stringify(window.__lcp)");
  const stats = await page.eval("JSON.stringify(window.__orbit ? window.__orbit.stats() : null)");
  page.close();
  const total = res.nav + res.list.reduce((t, r) => t + r.size, 0);
  const groups = {};
  for (const r of res.list) {
    const k = /\/models\//.test(r.name)
      ? "model"
      : /\/hdri\//.test(r.name)
        ? "hdri"
        : /draco/.test(r.name)
          ? "draco"
          : /\.js/.test(r.name)
            ? "js"
            : /\.css/.test(r.name)
              ? "css"
              : /font|woff/.test(r.name)
                ? "fonts"
                : /fallback|\.webp/.test(r.name)
                  ? "images"
                  : "other";
    groups[k] = (groups[k] ?? 0) + r.size;
  }
  return {
    path,
    tier,
    width,
    total,
    groups,
    lcp: JSON.parse(lcp),
    stats: JSON.parse(stats ?? "null"),
  };
}

const runs = [
  { path: "/", width: 1440, height: 900, mobile: false, tier: "high" },
  { path: "/", width: 1440, height: 900, mobile: false, tier: "high", scrollVh: 8.0 },
  { path: "/", width: 390, height: 844, mobile: true, tier: "low" },
  { path: "/configure", width: 1440, height: 900, mobile: false, tier: "high" },
  { path: "/configure", width: 1440, height: 900, mobile: false, tier: "low" },
  { path: "/", width: 390, height: 844, mobile: true, tier: "fallback" },
];

console.log(
  `model files: halo-one.glb ${kb((await stat("public/models/halo-one.glb")).size)}, mobile ${kb((await stat("public/models/halo-one-mobile.glb")).size)}`,
);
for (const r of runs) {
  const m = await measure(r.path, r);
  const g = Object.entries(m.groups)
    .map(([k, v]) => `${k} ${kb(v)}`)
    .join(", ");
  console.log(
    `\n${m.path}${r.scrollVh ? ` @${r.scrollVh}vh` : ""} [${m.tier}, ${m.width}px]\n  transfer ${kb(m.total)} (${g})\n  LCP ${m.lcp.t.toFixed(0)} ms on <${m.lcp.el}>\n  renderer ${m.stats ? `${m.stats.calls} calls, ${m.stats.triangles} tris, ${m.stats.fps} fps, dpr ${m.stats.dpr}` : "off (fallback)"}`,
  );
}
process.exit(0);
