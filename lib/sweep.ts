// The studio "sweep" (backdrop paper) colour.
//
// The CSS variable --sweep is the source of truth for the DOM. The canvas
// copies `sweep` into scene.background every frame, so both stay in sync
// without React re-renders. Tweens (colourway change) mutate r/g/b and write
// the CSS variable on each step.
//
// Deliberately a plain object, not a THREE.Color: this module is imported by
// DOM components, and importing anything from three here would pull the
// three.js core (~100 KB gzipped) into the first-load bundle.

/** sRGB components, 0–1. */
export const sweep = { r: 0xdc / 255, g: 0xe0 / 255, b: 0xe5 / 255 };

export function parseHex(hex: string) {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export function toHex({ r, g, b }: { r: number; g: number; b: number }) {
  const c = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Read --sweep from CSS into the shared colour (call once on mount). */
export function syncSweepFromCss() {
  if (typeof window === "undefined") return;
  const value = getComputedStyle(document.documentElement).getPropertyValue("--sweep").trim();
  if (value.startsWith("#")) Object.assign(sweep, parseHex(value));
}

/** Write the shared colour back to the CSS variable. */
export function writeSweepToCss() {
  document.documentElement.style.setProperty("--sweep", toHex(sweep));
}
