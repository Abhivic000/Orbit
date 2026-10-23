"use client";

import { useScene } from "@/lib/sceneState";

/**
 * Real loading progress (drei's useProgress, bridged out of the canvas into
 * our store so this DOM component doesn't pull three.js into the page bundle).
 * The hero copy is already readable while this runs.
 */
export function LoadingIndicator() {
  const { progress, done } = useScene((s) => s.loading);
  const tier = useScene((s) => s.tier);
  if (done || tier === "fallback") return null;
  const pct = Math.round(progress);
  return (
    <div className="mt-8 flex max-w-xs items-center gap-3 text-sm text-ink-soft" data-3d-only>
      <div
        role="progressbar"
        aria-label="Loading 3D model"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-1 flex-1 overflow-hidden rounded-full bg-ink/10"
      >
        <div
          className="h-full bg-ink/60 transition-[width] duration-300"
          style={{ width: `${Math.max(4, pct)}%` }}
        />
      </div>
      <span className="tabular-nums">{pct}%</span>
    </div>
  );
}
