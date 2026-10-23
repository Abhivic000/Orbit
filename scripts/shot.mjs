// Dev: screenshot a URL headlessly. node scripts/shot.mjs <url> <out.png> [w] [h] [waitMs] [scrollY]
import { launch } from "./cdp.mjs";
const [url, out, w = "1440", h = "900", wait = "4000", scrollY = "0"] = process.argv.slice(2);
const page = await launch({ width: +w, height: +h });
await page.setViewport(+w, +h, +w < 700);
await page.goto(url);
if (+scrollY) {
  await page.sleep(1500);
  await page.eval(`window.scrollTo(0, ${scrollY})`);
}
if (process.env.ACTION) {
  await page.sleep(+(process.env.PRE ?? 6000));
  console.log("action ->", await page.eval(process.env.ACTION));
}
await page.sleep(+wait);
await page.screenshot(out);
const info = await page.eval(`JSON.stringify(window.__orbit?.stats?.() ?? null)`).catch(() => null);
console.log("stats", info);
console.log(page.console.slice(-15).join("\n"));
page.close().finally(() => process.exit(0));
