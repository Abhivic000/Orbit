"use client";

import { useEffect } from "react";
import { useConfig } from "@/lib/configState";
import { readTierInput, selectTier, tierOverride, type Tier } from "@/lib/quality";
import { rig } from "@/lib/rig";
import { useScene } from "@/lib/sceneState";
import type { ColourwayId, HeadbandMaterialId } from "@/lib/product";

declare global {
  interface Window {
    /** Test/capture hook used by scripts/render-stills.mjs. */
    __orbitConfig?: (c: ColourwayId, m?: HeadbandMaterialId) => void;
  }
}

/**
 * Decides the quality tier once on load (device hints → lib/quality.ts) and
 * mirrors it to <html data-tier>, which CSS uses to swap in the stills.
 * ?tier=high|low|fallback forces a tier; ?still=1 is the capture mode used to
 * render those stills from the real scene.
 */
export function QualityGate() {
  useEffect(() => {
    const root = document.documentElement;
    const params = new URLSearchParams(window.location.search);
    const decide = (): Tier => tierOverride(window.location.search) ?? selectTier(readTierInput());

    if (params.get("still") === "1") {
      rig.still = true;
      root.dataset.still = "";
    }
    window.__orbitConfig = (c, m) =>
      useConfig.getState().setConfig({ colourway: c, material: m ?? "knit" });

    useScene.getState().setTier(decide());
    const unsub = useScene.subscribe((s) => {
      if (s.tier !== "pending") root.dataset.tier = s.tier;
    });
    root.dataset.tier = useScene.getState().tier;

    // Turning reduced motion on/off mid-visit switches version.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => useScene.getState().setTier(decide());
    mq.addEventListener("change", onChange);
    return () => {
      unsub();
      mq.removeEventListener("change", onChange);
    };
  }, []);
  return null;
}

/**
 * Runs before first paint (inline in <head>): reduced-motion visitors get the
 * static version immediately, with no flash of the pinned 3D layout.
 */
export const EARLY_TIER_SCRIPT = `try{var q=new URLSearchParams(location.search).get("tier");if(q==="fallback"||(!q&&matchMedia("(prefers-reduced-motion: reduce)").matches))document.documentElement.dataset.tier="fallback"}catch(e){}`;
