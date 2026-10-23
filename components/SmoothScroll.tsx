"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Lenis smooths wheel input into eased scrolling. It shares GSAP's clock:
 *   - gsap.ticker drives lenis.raf (one rAF loop for both libraries)
 *   - every Lenis scroll step calls ScrollTrigger.update
 * Native scroll position is still the source of truth, so keyboard (Space,
 * Page Down), touch and scrollbar dragging all keep working.
 * Off for prefers-reduced-motion: plain native scrolling.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.12 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);
  return null;
}
