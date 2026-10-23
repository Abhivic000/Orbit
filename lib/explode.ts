// Pure maths for the exploded view (unit-tested; no three.js imports).

/** Delay between consecutive parts, as a fraction of the explode range. ≈ 40 ms of a 1 s beat. */
export const EXPLODE_STAGGER = 0.04;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** power2.inOut, matching the GSAP ease used for camera moves. */
export function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Local progress (0→1) of part `index` out of `count`, given the global explode
 * value. Part 0 starts first; each next part starts `stagger` later, and all
 * finish together at explode = 1 — so scrubbing backwards reverses exactly.
 */
export function partProgress(
  explode: number,
  index: number,
  count: number,
  stagger = EXPLODE_STAGGER,
) {
  const span = 1 - stagger * Math.max(0, count - 1);
  if (span <= 0) throw new Error("stagger too large for part count");
  return easeInOutQuad(clamp01((explode - index * stagger) / span));
}

/** offset = direction × distance × progress */
export function partOffset(
  explode: number,
  index: number,
  count: number,
  dir: readonly [number, number, number],
  distance: number,
): [number, number, number] {
  const p = partProgress(explode, index, count) * distance;
  return [dir[0] * p, dir[1] * p, dir[2] * p];
}
