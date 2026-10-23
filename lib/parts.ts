// Exploded-view choreography, callouts and configurator hotspots.
// Positions are in model units (the optimized model is 1 unit tall, centred on
// the origin; cups face ±x). Part names match the nodes in halo-one.glb.

type Dir = readonly [number, number, number];

export type ExplodePart = {
  /** Order in the stagger (0 moves first). */
  order: number;
  /** Unit direction in model space; L parts mirror x automatically. */
  dir: Dir;
  distance: number;
};

const OUT: Dir = [1, 0, 0];
const IN: Dir = [-1, 0, 0];
const UP: Dir = [0, 1, 0];

/**
 * Keyed by part name without the _L/_R suffix. Each cup separates along its own
 * axis (x): outer layers move out, the cushion moves in towards the head, the
 * headband lifts away. The driver stays almost in place — it's the reveal.
 */
export const EXPLODE: Record<string, ExplodePart> = {
  CupCap: { order: 0, dir: OUT, distance: 0.5 },
  CupRim: { order: 1, dir: OUT, distance: 0.36 },
  ButtonPlus: { order: 1, dir: OUT, distance: 0.36 },
  Buttons: { order: 1, dir: OUT, distance: 0.36 },
  Port: { order: 1, dir: OUT, distance: 0.36 },
  Battery: { order: 2, dir: OUT, distance: 0.25 },
  Housing: { order: 3, dir: OUT, distance: 0.15 },
  Driver: { order: 4, dir: OUT, distance: 0.03 },
  Grille: { order: 5, dir: IN, distance: 0.06 },
  Cushion: { order: 6, dir: IN, distance: 0.13 },
  HeadbandShell: { order: 7, dir: UP, distance: 0.3 },
  HeadbandPad: { order: 7, dir: UP, distance: 0.22 },
  SliderBlock: { order: 8, dir: UP, distance: 0.16 },
  Slider: { order: 8, dir: UP, distance: 0.1 },
  Hinge: { order: 9, dir: UP, distance: 0.05 },
  Yoke: { order: 9, dir: UP, distance: 0.05 },
};

export const EXPLODE_COUNT = 10;

export function explodeFor(name: string): (ExplodePart & { dir: Dir }) | null {
  const base = name.replace(/_[LR]$/, "");
  const part = EXPLODE[base];
  if (!part) return null;
  const mirror = name.endsWith("_L") || (!name.endsWith("_R") && name === "Port") ? -1 : 1;
  return { ...part, dir: [part.dir[0] * mirror, part.dir[1], part.dir[2]] };
}

/** Procedural internals the source model doesn't have (see Internals.tsx). */
export const DRIVER = { x: 0.33, y: -0.25, radius: 0.1 };
export const BATTERY = { x: 0.37, y: -0.22, size: [0.05, 0.2, 0.12] as const };

/** Exploded-view callouts (DOM labels with leader lines). */
export type Callout = {
  id: string;
  part: string;
  title: string;
  detail: string;
  /** Where the label sits relative to its anchor, in px. Mostly vertical, so
   *  labels stay inside the model's half of the screen and off the copy. */
  offset: [number, number];
};

export const CALLOUTS: Callout[] = [
  {
    id: "cap",
    part: "CupCap_R",
    title: "Aluminium cup",
    detail: "Bead-blasted, 0.8 mm",
    offset: [-70, -150],
  },
  {
    id: "battery",
    part: "Battery",
    title: "Battery",
    detail: "40 h with ANC on",
    offset: [40, 130],
  },
  {
    id: "driver",
    part: "Driver_L",
    title: "40 mm driver",
    detail: "Bio-cellulose cone",
    offset: [-50, -135],
  },
  {
    id: "cushion",
    part: "Cushion_L",
    title: "Memory foam",
    detail: "Protein-leather wrap",
    offset: [-70, 140],
  },
  {
    id: "headband",
    part: "HeadbandPad",
    title: "Headband",
    detail: "Knit or leather",
    offset: [100, -60],
  },
];

/** Configurator hotspots. `camera` is where the camera flies to (model space). */
export type Hotspot = {
  id: string;
  title: string;
  body: string;
  anchor: [number, number, number];
  camera: [number, number, number];
};

export const HOTSPOTS: Hotspot[] = [
  {
    id: "cushions",
    title: "Memory-foam cushions",
    body: "Slow-recovery foam wrapped in protein leather. Swappable in seconds.",
    anchor: [-0.24, -0.2, 0.1],
    camera: [-1.6, 0.1, 1.9],
  },
  {
    id: "controls",
    title: "Physical controls",
    body: "Volume and play/pause you can find without looking.",
    anchor: [0.34, -0.42, 0.14],
    camera: [1.5, -0.3, 2.1],
  },
  {
    id: "port",
    title: "USB-C, fast charge",
    body: "10 minutes of charge gives 5 hours of playback.",
    anchor: [-0.33, -0.44, 0.13],
    camera: [-1.3, -0.4, 2.2],
  },
  {
    id: "slider",
    title: "Steel slider",
    body: "Stainless arms with 12 detents per side for a repeatable fit.",
    anchor: [0.4, 0.09, 0.03],
    camera: [1.7, 0.5, 1.8],
  },
  {
    id: "headband",
    title: "Headband",
    body: "Knit fabric breathes; leather wipes clean. Your choice.",
    anchor: [0, 0.48, 0.02],
    camera: [0.2, 1.2, 2.4],
  },
];
