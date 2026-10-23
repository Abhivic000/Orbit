import type { Metadata } from "next";
import { Picker } from "@/components/configure/Picker";
import { FallbackStill } from "@/components/Fallback";
import { SceneMode } from "@/components/SceneMode";

export const metadata: Metadata = {
  title: "Configure — Orbit Halo One",
  description: "Choose a colourway and headband material for Orbit Halo One.",
};

export default function ConfigurePage() {
  return (
    // The canvas sits behind; only the picker takes pointer events, so the
    // model area (left 2/3) can be dragged to orbit.
    <main id="main" className="pointer-events-none relative z-10 grid min-h-dvh side:grid-cols-3">
      <SceneMode mode="configure" />
      {/* 3D: empty — the canvas behind shows through. Fallback: image swap. */}
      <div className="flex items-center px-5 pt-20 side:col-span-2 side:p-12">
        <FallbackStill section="configure" />
      </div>
      <Picker />
    </main>
  );
}
