"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { parseConfig, serializeConfig, useConfig } from "@/lib/configState";
import { frame } from "@/lib/frame";
import { HOTSPOTS } from "@/lib/parts";
import {
  COLOURWAYS,
  HEADBAND_MATERIALS,
  SPECS,
  formatPrice,
  getColourway,
  priceFor,
} from "@/lib/product";
import { rig } from "@/lib/rig";

/** URL ⇄ store: read ?c=&m= once on mount, then mirror changes with replaceState. */
function useUrlSync() {
  useEffect(() => {
    useConfig.getState().setConfig(parseConfig(window.location.search));
    return useConfig.subscribe((s, prev) => {
      if (s.colourway === prev.colourway && s.material === prev.material) return;
      const qs = serializeConfig(
        { colourway: s.colourway, material: s.material },
        window.location.search,
      );
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs}`);
    });
  }, []);
}

function Swatches({ group }: { group: string }) {
  const colourway = useConfig((s) => s.colourway);
  const setColourway = useConfig((s) => s.setColourway);
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">
        Colour <span className="font-normal text-ink-soft">— {getColourway(colourway).name}</span>
      </legend>
      <div className="flex gap-3">
        {COLOURWAYS.map((c) => {
          const checked = c.id === colourway;
          return (
            <label key={c.id} className="group relative cursor-pointer">
              <input
                type="radio"
                name={`colourway-${group}`}
                value={c.id}
                checked={checked}
                onChange={() => setColourway(c.id)}
                className="peer sr-only"
              />
              <span
                className={`block size-11 rounded-full border border-black/10 shadow-inner ring-offset-2 ring-offset-sweep transition peer-focus-visible:ring-2 peer-focus-visible:ring-focus ${
                  checked ? "ring-2 ring-focus" : "group-hover:scale-105"
                }`}
                style={{ background: c.product }}
              />
              <span className="sr-only">{c.name}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function MaterialToggle({ group }: { group: string }) {
  const material = useConfig((s) => s.material);
  const setMaterial = useConfig((s) => s.setMaterial);
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">Headband</legend>
      <div className="grid grid-cols-2 gap-2">
        {HEADBAND_MATERIALS.map((m) => (
          <label key={m.id} className="cursor-pointer">
            <input
              type="radio"
              name={`material-${group}`}
              value={m.id}
              checked={material === m.id}
              onChange={() => setMaterial(m.id)}
              className="peer sr-only"
            />
            <span className="block rounded-lg border border-ink/15 bg-white/50 px-3 py-2.5 text-sm transition peer-checked:border-ink peer-checked:bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-focus">
              {m.name}
              <span className="block text-xs text-ink-soft tabular-nums">
                {m.priceDelta ? `+ ${formatPrice(m.priceDelta)}` : "Included"}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function HotspotList({ group }: { group: string }) {
  const hotspot = useConfig((s) => s.hotspot);
  const setHotspot = useConfig((s) => s.setHotspot);
  const active = HOTSPOTS.find((h) => h.id === hotspot);
  return (
    <section aria-labelledby={`details-heading-${group}`}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id={`details-heading-${group}`} className="text-sm font-semibold">
          Details
        </h2>
        <button
          type="button"
          onClick={() => setHotspot(null)}
          disabled={!hotspot}
          className="text-sm text-ink-soft underline-offset-4 hover:underline disabled:opacity-40"
        >
          Reset view
        </button>
      </div>
      <ol className="space-y-1">
        {HOTSPOTS.map((h, i) => (
          <li key={h.id}>
            <button
              type="button"
              aria-pressed={hotspot === h.id}
              aria-controls={`hotspot-detail-${group}`}
              onClick={() => setHotspot(hotspot === h.id ? null : h.id)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-white/60 aria-pressed:bg-white"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full border border-ink/20 text-xs tabular-nums">
                {i + 1}
              </span>
              {h.title}
            </button>
          </li>
        ))}
      </ol>
      <p
        id={`hotspot-detail-${group}`}
        aria-live="polite"
        className="mt-2 min-h-10 text-sm text-ink-soft"
      >
        {active?.body}
      </p>
    </section>
  );
}

function ShowParts() {
  const [exploded, setExploded] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={exploded}
      onClick={() => {
        const next = !exploded;
        setExploded(next);
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        gsap.to(rig, {
          explode: next ? 1 : 0,
          duration: reduce ? 0 : 1.2,
          ease: "power2.inOut",
          overwrite: true,
          onUpdate: frame.invalidate,
        });
      }}
      data-3d-only
      className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-white/60"
    >
      {exploded ? "Hide parts" : "Show parts"}
    </button>
  );
}

function AddToBag() {
  const material = useConfig((s) => s.material);
  const colourway = useConfig((s) => s.colourway);
  const addToBag = useConfig((s) => s.addToBag);
  const bagCount = useConfig((s) => s.bagCount);
  const [announce, setAnnounce] = useState("");
  const btn = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm text-ink-soft">Price</span>
        <span className="font-display text-2xl font-semibold tabular-nums">
          {formatPrice(priceFor(material))}
        </span>
      </div>
      <button
        ref={btn}
        type="button"
        onClick={() => {
          addToBag();
          const name = `Halo One, ${getColourway(colourway).name}, ${material === "leather" ? "leather" : "knit"} headband`;
          setAnnounce(
            `Added ${name} to bag. Bag has ${bagCount + 1} ${bagCount + 1 === 1 ? "item" : "items"}.`,
          );
          if (btn.current)
            gsap.fromTo(
              btn.current,
              { scale: 0.96 },
              { scale: 1, duration: 0.5, ease: "back.out(3)" },
            );
        }}
        className="w-full rounded-full bg-ink px-6 py-3.5 font-semibold text-white transition hover:bg-black"
      >
        Add to bag
      </button>
      <p role="status" className="mt-2 min-h-5 text-center text-sm text-ink-soft">
        {announce}
      </p>
    </div>
  );
}

function BarPrice() {
  const material = useConfig((s) => s.material);
  return (
    <span className="text-sm font-semibold tabular-nums">{formatPrice(priceFor(material))}</span>
  );
}

function Specs() {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm tabular-nums">
      {SPECS.map((s) => (
        <div key={s.term} className="contents">
          <dt className="text-ink-soft">{s.term}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Announces the configuration for screen readers ("Moss with leather headband"). */
function ConfigAnnouncer() {
  const colourway = useConfig((s) => s.colourway);
  const material = useConfig((s) => s.material);
  const first = useRef(true);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setMsg(
      `${getColourway(colourway).name} with ${material === "leather" ? "leather" : "knit"} headband`,
    );
  }, [colourway, material]);
  return (
    <p aria-live="polite" className="sr-only">
      {msg}
    </p>
  );
}

export function Picker() {
  useUrlSync();
  const [sheetOpen, setSheetOpen] = useState(false);

  const panel = (
    <div className="space-y-7">
      <Swatches group="d" />
      <MaterialToggle group="d" />
      <HotspotList group="d" />
      <div className="flex gap-2">
        <ShowParts />
      </div>
      <AddToBag />
      <details className="text-sm">
        <summary className="cursor-pointer font-semibold">Specs</summary>
        <div className="mt-3">
          <Specs />
        </div>
      </details>
    </div>
  );

  return (
    <>
      <ConfigAnnouncer />
      {/* Side-by-side (wide or landscape): right column; the model fills the left 2/3. */}
      <aside
        aria-label="Configure Halo One"
        className="pointer-events-auto hidden h-dvh w-full overflow-y-auto px-6 pt-24 pb-10 lg:px-8 side:block short:pt-16"
        data-lenis-prevent
      >
        <h1 className="font-display text-[clamp(2rem,min(3.5vw,7svh),3.5rem)] leading-none font-semibold">
          Halo One
        </h1>
        <p className="mt-2 mb-8 text-ink-soft short:mb-5">Make it yours.</p>
        {panel}
      </aside>

      {/* Stacked (portrait phones/tablets): bottom bar with swatches + a "Customise" sheet. */}
      <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 side:hidden">
        <div className="mx-3 mb-3 rounded-2xl bg-white/85 p-4 shadow-lg backdrop-blur sm:mx-auto sm:max-w-xl">
          <div className="mb-3 flex items-baseline justify-between">
            <h1 className="font-display text-2xl leading-none font-semibold">Halo One</h1>
            <BarPrice />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Swatches group="m" />
            <button
              type="button"
              aria-expanded={sheetOpen}
              aria-controls="customise-sheet"
              onClick={() => setSheetOpen((o) => !o)}
              className="shrink-0 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white"
            >
              {sheetOpen ? "Close" : "Customise"}
            </button>
          </div>
          {sheetOpen && (
            <div
              id="customise-sheet"
              className="mt-5 max-h-[55dvh] overflow-y-auto"
              data-lenis-prevent
            >
              <div className="space-y-7">
                <MaterialToggle group="m" />
                <HotspotList group="m" />
                <ShowParts />
                <AddToBag />
                <Specs />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
