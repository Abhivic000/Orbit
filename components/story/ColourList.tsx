"use client";

import { useConfig } from "@/lib/configState";
import { COLOURWAYS } from "@/lib/product";

/**
 * The active colourway follows scroll in this section (StoryTimeline sets it),
 * and the buttons are the keyboard / screen-reader equivalent.
 */
export function ColourList() {
  const colourway = useConfig((s) => s.colourway);
  const setColourway = useConfig((s) => s.setColourway);
  return (
    <ul data-reveal className="mt-6 grid max-w-md grid-cols-2 gap-2" aria-label="Colourways">
      {COLOURWAYS.map((c) => {
        const active = c.id === colourway;
        return (
          <li key={c.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => setColourway(c.id)}
              className={`flex w-full items-center gap-3 rounded-full border px-3 py-2 text-left text-sm transition ${
                active ? "border-ink bg-white/70 font-semibold" : "border-ink/15 hover:bg-white/40"
              }`}
            >
              <span
                className="size-5 rounded-full border border-black/10"
                style={{ background: c.product }}
              />
              {c.name}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
