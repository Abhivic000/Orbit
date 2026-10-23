"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import { CALLOUTS, type Callout } from "@/lib/parts";
import { rig } from "@/lib/rig";

/**
 * One exploded-view label: a dot on the part, a leader line drawn out to the
 * label, then the label fades in. DOM (drei <Html>) so text stays crisp.
 * Progress comes from rig.labels (scroll); we write styles straight to the
 * DOM in useFrame instead of using React state.
 *
 * The useFrame lives here, outside <Html>: Html renders its children in a
 * separate DOM React root where R3F hooks are unavailable. Refs still work
 * across that boundary, so the frame loop drives the DOM through them.
 */
function Label({ callout, index }: { callout: Callout; index: number }) {
  const root = useRef<HTMLDivElement>(null);
  const line = useRef<SVGLineElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const [dx, dy] = callout.offset;
  const length = Math.hypot(dx, dy);
  const last = useRef(-1);

  useFrame(() => {
    // Stagger labels slightly so the lines draw one after another.
    const p = Math.min(1, Math.max(0, rig.labels * 1.6 - index * 0.12));
    if (p === last.current) return;
    last.current = p;
    if (root.current) root.current.style.visibility = p > 0 ? "visible" : "hidden";
    if (line.current)
      line.current.style.strokeDashoffset = `${length * (1 - Math.min(1, p * 1.4))}`;
    if (text.current) {
      const t = Math.max(0, (p - 0.55) / 0.45);
      text.current.style.opacity = `${t}`;
      text.current.style.transform = `translate(${dx}px, ${dy}px) translate(${dx < 0 ? "-100%" : "0"}, -50%) translateY(${(1 - t) * 6}px)`;
    }
  });

  const pad = 4;
  const w = Math.abs(dx) + pad * 2;
  const h = Math.abs(dy) + pad * 2;
  return (
    <Html zIndexRange={[15, 5]} style={{ pointerEvents: "none" }}>
      <div
        ref={root}
        // Stacked (portrait) layouts have no room beside the parts; the same facts
        // are in the section's spec list and its screen-reader list.
        className="callout-root pointer-events-none relative hidden side:block"
        style={{ visibility: "hidden" }}
      >
        <span className="absolute -top-[3px] -left-[3px] size-1.5 rounded-full bg-ink-soft" />
        <svg
          width={w}
          height={h}
          className="absolute overflow-visible"
          style={{ left: Math.min(0, dx) - pad, top: Math.min(0, dy) - pad }}
          aria-hidden="true"
        >
          <line
            ref={line}
            x1={dx < 0 ? w - pad : pad}
            y1={dy < 0 ? h - pad : pad}
            x2={dx < 0 ? pad : w - pad}
            y2={dy < 0 ? pad : h - pad}
            stroke="var(--ink-soft)"
            strokeWidth={1}
            strokeDasharray={length}
            strokeDashoffset={length}
          />
        </svg>
        <div
          ref={text}
          className="callout absolute top-0 left-0 rounded-md bg-sweep/80 px-2 py-1 whitespace-nowrap backdrop-blur-sm"
          style={{ opacity: 0, transform: `translate(${dx}px, ${dy}px)` }}
        >
          <p className="text-sm font-semibold text-ink">{callout.title}</p>
          <p className="text-xs text-ink-soft tabular-nums">{callout.detail}</p>
        </div>
      </div>
    </Html>
  );
}

/** Map of part name → label, passed to <Headphones attach> so labels ride on their parts. */
export function calloutAttachments(): Partial<Record<string, ReactNode>> {
  const out: Partial<Record<string, ReactNode>> = {};
  CALLOUTS.forEach((c, i) => {
    out[c.part] = <Label key={c.id} callout={c} index={i} />;
  });
  return out;
}
