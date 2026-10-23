"use client";

import { Html } from "@react-three/drei";
import { useConfig } from "@/lib/configState";
import { HOTSPOTS } from "@/lib/parts";

/**
 * Clickable hotspots on the model (DOM via drei <Html>, so they stay crisp).
 * These are pointer targets only: keyboard and screen-reader users get the
 * same actions from the hotspot list in the picker, so the 3D buttons are
 * removed from the tab order to avoid duplicate stops.
 */
export function Hotspots() {
  const selected = useConfig((s) => s.hotspot);
  const setHotspot = useConfig((s) => s.setHotspot);

  return (
    <>
      {HOTSPOTS.map((h, i) => {
        const active = selected === h.id;
        return (
          <Html key={h.id} position={h.anchor} center zIndexRange={[20, 10]}>
            <div className="hotspot-root pointer-events-none relative">
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => setHotspot(active ? null : h.id)}
                className={`pointer-events-auto grid size-7 place-items-center rounded-full border text-[11px] font-semibold tabular-nums shadow-sm backdrop-blur transition ${
                  active
                    ? "border-focus bg-focus text-white"
                    : "border-white/70 bg-white/80 text-ink hover:scale-110"
                }`}
              >
                {i + 1}
              </button>
              {active && (
                <div className="pointer-events-none absolute top-9 left-1/2 w-56 -translate-x-1/2 rounded-lg bg-white/95 p-3 text-sm text-ink shadow-lg">
                  <p className="font-semibold">{h.title}</p>
                  <p className="mt-1 text-ink-soft">{h.body}</p>
                </div>
              )}
            </div>
          </Html>
        );
      })}
    </>
  );
}
