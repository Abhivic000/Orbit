"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useScene } from "@/lib/sceneState";

// three.js + R3F are only downloaded once this component decides to mount
// the scene, so they never block the hero text (our LCP element).
const Scene = dynamic(() => import("./Scene"), { ssr: false });

/**
 * Wait until the hero text is final before mounting WebGL:
 *   1. web fonts loaded — the Bricolage swap repaints the headline, and that
 *      repaint is what LCP records; if three.js is evaluating at that moment
 *      the paint (and LCP) waits behind it,
 *   2. the window `load` event,
 *   3. two rAFs (that frame is on screen) + an idle moment.
 */
function useAfterHeroPaint() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let idle = 0;
    let raf = 0;
    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });
    Promise.all([document.fonts.ready, loaded]).then(() => {
      if (cancelled) return;
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => {
          if ("requestIdleCallback" in window) {
            idle = window.requestIdleCallback(() => setReady(true), { timeout: 1200 });
          } else {
            idle = globalThis.setTimeout(() => setReady(true), 50) as unknown as number;
          }
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      clearTimeout(idle);
    };
  }, []);
  return ready;
}

export function CanvasRoot() {
  const ready = useAfterHeroPaint();
  const tier = useScene((s) => s.tier);
  // No WebGL at all on the fallback tier: the page shows pre-rendered stills.
  const on = ready && (tier === "low" || tier === "high");
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" data-3d-only>
      {on && <Scene />}
      <div className="studio-vignette pointer-events-none absolute inset-0" />
    </div>
  );
}
