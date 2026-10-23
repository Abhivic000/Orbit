"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useConfig } from "@/lib/configState";
import { SIDE_BY_SIDE_QUERY, STACKED_QUERY } from "@/lib/layout";
import { COLOURWAYS } from "@/lib/product";
import { rig } from "@/lib/rig";
import { useScene } from "@/lib/sceneState";
import { buildStoryTimeline, measureSections } from "@/lib/timeline";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Wires the master timeline to scroll. Everything is created inside useGSAP
 * (and gsap.matchMedia), so it is reverted automatically when the page
 * unmounts or the breakpoint changes — important with client-side navigation.
 */
export function StoryTimeline() {
  // Only the 3D tiers get the scrubbed story; the fallback is a static page.
  const tier = useScene((s) => s.tier);
  const animated = tier === "low" || tier === "high";
  useGSAP(
    () => {
      if (!animated) return;
      const mm = gsap.matchMedia();
      mm.add(
        {
          // Same rule as the CSS `side:` variant (lib/layout.ts), so the
          // camera framing switches exactly when the DOM layout does.
          side: SIDE_BY_SIDE_QUERY,
          stacked: STACKED_QUERY,
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { stacked, reduce } = ctx.conditions as { stacked: boolean; reduce: boolean };
          // Reduced motion gets the static fallback: no scrubbed animation at all.
          if (reduce) return;

          const story = document.getElementById("story");
          const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
          if (!story || !els.length) return;

          const sections = measureSections(els, window.innerHeight, window.scrollY);
          const tl = buildStoryTimeline({ sections, mobile: stacked });

          // scrub: true → timeline progress == scroll progress, both directions.
          // (Lenis already smooths the wheel and the Rig damps the camera, so a
          // numeric scrub lag would be a third layer of smoothing.)
          ScrollTrigger.create({
            trigger: story,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            animation: tl,
          });

          // Which section are we in? (Discrete → store.)
          for (const s of sections) {
            ScrollTrigger.create({
              trigger: s.el,
              start: "top center",
              end: "bottom center",
              onToggle: (self) => self.isActive && useScene.getState().setSection(s.id),
            });
          }

          // Colours beat: cycle colourways while pinned; backdrop follows.
          const colours = sections.find((s) => s.id === "colours");
          if (colours) {
            ScrollTrigger.create({
              trigger: colours.el,
              start: "top top",
              end: "bottom bottom",
              onToggle: (self) => useScene.getState().setStoryTint(self.isActive),
              onUpdate: (self) => {
                if (rig.still) return; // capture mode sets colourways explicitly
                const i = Math.min(
                  COLOURWAYS.length - 1,
                  Math.floor(self.progress * COLOURWAYS.length),
                );
                const id = COLOURWAYS[i]!.id;
                if (useConfig.getState().colourway !== id) useConfig.getState().setColourway(id);
              },
            });
          }

          return () => useScene.getState().setStoryTint(false);
        },
      );
    },
    { dependencies: [animated], revertOnUpdate: true },
  );
  return null;
}
