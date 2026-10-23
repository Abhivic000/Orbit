// Dev: scroll the story to given positions (in viewport heights) and screenshot each.
// node scripts/walk.mjs <url> <outPrefix> <w> <h> <vh,vh,...>
import { launch } from "./cdp.mjs";
const [url, prefix, w = "1440", h = "900", list = "0"] = process.argv.slice(2);
const page = await launch({ width: +w, height: +h });
await page.setViewport(+w, +h, +w < 700, 1);
await page.goto(url);
await page
  .waitFor("!!window.__orbit && document.documentElement.dataset.mode === 'story'", 40000)
  .catch(() => {});
await page.sleep(5000);
for (const v of list.split(",")) {
  await page.eval(
    `(window.__lenis ? window.__lenis.scrollTo(${+v} * innerHeight, { immediate: true }) : window.scrollTo(0, ${+v} * innerHeight), true)`,
  );
  await page.sleep(3500);
  const file = `${prefix}-${v}.png`;
  await page.screenshot(file);
  console.log(file, await page.eval("JSON.stringify(window.__orbit?.stats())"));
}
console.log(
  page.console
    .filter((l) => !l.includes("Clock"))
    .slice(-10)
    .join("\n"),
);
page.close().finally(() => process.exit(0));
