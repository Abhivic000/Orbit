// Minimal Chrome DevTools Protocol driver — zero dependencies (Node ≥ 22 has
// a global WebSocket). Used by render-stills.mjs and for headless checks.
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const CHROME_PATHS = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ width = 1440, height = 900, gpu = false } = {}) {
  const { existsSync } = await import("node:fs");
  const bin = CHROME_PATHS.find((p) => existsSync(p));
  if (!bin) throw new Error("Chrome/Edge not found — set CHROME=/path/to/chrome");
  const userDir = await mkdtemp(path.join(tmpdir(), "orbit-cdp-"));
  const port = 9300 + Math.floor(Math.random() * 500);
  const args = [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDir}`,
    `--window-size=${width},${height}`,
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    ...(gpu
      ? ["--enable-gpu", "--ignore-gpu-blocklist"]
      : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]),
    "about:blank",
  ];
  const proc = spawn(bin, args, { stdio: "ignore" });

  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      target = list.find((t) => t.type === "page");
    } catch {
      /* not up yet */
    }
  }
  if (!target) throw new Error("Chrome did not start");

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => {
    ws.onopen = r;
    ws.onerror = j;
  });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method) listeners.forEach((l) => l(msg));
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id;
      pending.set(mid, { resolve, reject });
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  await send("Page.enable");
  await send("Runtime.enable");
  const consoleLines = [];
  listeners.push((m) => {
    if (m.method === "Runtime.consoleAPICalled")
      consoleLines.push(
        `${m.params.type}: ${m.params.args.map((a) => a.value ?? a.description).join(" ")}`,
      );
    if (m.method === "Runtime.exceptionThrown")
      consoleLines.push(
        `exception: ${m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text}`,
      );
  });

  const page = {
    send,
    console: consoleLines,
    async setViewport(w, h, mobile = false, dpr = 1) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: dpr,
        mobile,
      });
    },
    async emulateReducedMotion(on) {
      await send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-motion", value: on ? "reduce" : "no-preference" }],
      });
    },
    async goto(url) {
      // Resolve on load, or after 20 s (an in-flight HMR/streaming response can
      // delay the load event indefinitely).
      const loaded = new Promise((r) => {
        const l = (m) => m.method === "Page.loadEventFired" && r();
        listeners.push(l);
        setTimeout(r, 20000);
      });
      await send("Page.navigate", { url });
      await loaded;
    },
    async eval(expression) {
      const res = await send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (res.exceptionDetails)
        throw new Error(res.exceptionDetails.exception?.description ?? "eval failed");
      return res.result.value;
    },
    async waitFor(expression, timeout = 30000) {
      const t0 = Date.now();
      while (Date.now() - t0 < timeout) {
        if (await page.eval(expression).catch(() => false)) return true;
        await sleep(150);
      }
      throw new Error(`Timed out waiting for: ${expression}`);
    },
    async screenshot(file, { format = "png", quality } = {}) {
      const { data } = await send("Page.captureScreenshot", {
        format,
        quality,
        captureBeyondViewport: false,
      });
      const { writeFile } = await import("node:fs/promises");
      await writeFile(file, Buffer.from(data, "base64"));
    },
    sleep,
    async close() {
      try {
        send("Browser.close").catch(() => {});
      } catch {
        /* already closed */
      }
      ws.close();
      proc.kill();
      await sleep(300);
      await rm(userDir, { recursive: true, force: true }).catch(() => {});
    },
  };
  return page;
}
