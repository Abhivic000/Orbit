"use client";

import gsap from "gsap";
import { useEffect } from "react";
import { useConfig } from "@/lib/configState";
import { frame } from "@/lib/frame";
import { getColourway } from "@/lib/product";
import { useScene } from "@/lib/sceneState";
import { parseHex, sweep, syncSweepFromCss, writeSweepToCss } from "@/lib/sweep";

const DEFAULT_SWEEP = "#DCE0E5";

/**
 * The photographer re-papers the set: the backdrop tint follows the colourway
 * in the configurator and during the story's Colours beat, with a 600 ms
 * transition. DOM-only, so it also works in the image fallback.
 */
export function SweepSync() {
  useEffect(() => {
    syncSweepFromCss();

    const update = (duration: number) => {
      const { colourway } = useConfig.getState();
      const { mode, storyTint } = useScene.getState();
      const tinted = mode === "configure" || storyTint;
      const to = parseHex(tinted ? getColourway(colourway).sweep : DEFAULT_SWEEP);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.to(sweep, {
        ...to,
        duration: reduce ? 0 : duration,
        ease: "power2.inOut",
        overwrite: true,
        onUpdate: () => {
          writeSweepToCss();
          frame.invalidate();
        },
      });
    };

    update(0);
    const unsubConfig = useConfig.subscribe((s, p) => s.colourway !== p.colourway && update(0.6));
    const unsubScene = useScene.subscribe(
      (s, p) => (s.mode !== p.mode || s.storyTint !== p.storyTint) && update(0.6),
    );
    return () => {
      unsubConfig();
      unsubScene();
    };
  }, []);
  return null;
}
