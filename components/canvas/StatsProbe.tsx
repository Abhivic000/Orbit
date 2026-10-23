"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __orbit?: { stats: () => { calls: number; triangles: number; fps: number; dpr: number } };
  }
}

/**
 * Exposes per-frame renderer stats on window.__orbit for headless budget checks
 * (scripts/measure.mjs). gl.info normally resets on every gl.render() call,
 * which would hide extra passes (ContactShadows, postprocessing), so we turn
 * auto-reset off and reset once per frame ourselves.
 */
export function StatsProbe() {
  const get = useThree((s) => s.get);
  const last = useRef({ calls: 0, triangles: 0, fps: 0 });
  const frames = useRef<number[]>([]);

  useEffect(() => {
    const { gl } = get();
    const info = gl.info;
    info.autoReset = false;
    window.__orbit = {
      stats: () => ({ ...last.current, dpr: gl.getPixelRatio() }),
    };
    return () => {
      info.autoReset = true;
      delete window.__orbit;
    };
  }, [get]);

  // Negative priority: runs before every other useFrame (ContactShadows renders
  // its pass from one), so the totals read here cover the whole previous frame —
  // shadow pass + main render + postprocessing. (Only positive priorities take
  // over rendering in R3F; negative ones just run earlier.)
  useFrame(({ gl }) => {
    const now = performance.now();
    const f = frames.current;
    f.push(now);
    while (f.length && now - f[0]! > 1000) f.shift();
    last.current = {
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      fps: f.length,
    };
    gl.info.reset();
  }, -1000);
  return null;
}
