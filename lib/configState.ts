import { create } from "zustand";
import {
  COLOURWAYS,
  DEFAULT_COLOURWAY,
  DEFAULT_MATERIAL,
  HEADBAND_MATERIALS,
  type ColourwayId,
  type HeadbandMaterialId,
} from "./product";

// Discrete configuration (colourway, headband material, selected hotspot, bag)
// lives here — the "shared config bean". Per-frame values never go through this
// store; they live on the mutable `rig` object instead.

export type Config = { colourway: ColourwayId; material: HeadbandMaterialId };

const isColourway = (v: string | null): v is ColourwayId => COLOURWAYS.some((c) => c.id === v);
const isMaterial = (v: string | null): v is HeadbandMaterialId =>
  HEADBAND_MATERIALS.some((m) => m.id === v);

/** `?c=moss&m=leather` → Config. Unknown or missing values fall back to defaults. */
export function parseConfig(search: string): Config {
  const params = new URLSearchParams(search);
  const c = params.get("c")?.toLowerCase() ?? null;
  const m = params.get("m")?.toLowerCase() ?? null;
  return {
    colourway: isColourway(c) ? c : DEFAULT_COLOURWAY,
    material: isMaterial(m) ? m : DEFAULT_MATERIAL,
  };
}

/** Config → query string, keeping any unrelated params already in `base`. */
export function serializeConfig(config: Config, base = ""): string {
  const params = new URLSearchParams(base);
  params.set("c", config.colourway);
  params.set("m", config.material);
  return `?${params.toString()}`;
}

type ConfigStore = Config & {
  hotspot: string | null;
  bagCount: number;
  /** Increments on every "Add to bag" so the scene can play its spin. */
  bagPulse: number;
  setColourway: (c: ColourwayId) => void;
  setMaterial: (m: HeadbandMaterialId) => void;
  setConfig: (c: Config) => void;
  setHotspot: (id: string | null) => void;
  addToBag: () => void;
};

export const useConfig = create<ConfigStore>()((set) => ({
  colourway: DEFAULT_COLOURWAY,
  material: DEFAULT_MATERIAL,
  hotspot: null,
  bagCount: 0,
  bagPulse: 0,
  setColourway: (colourway) => set({ colourway }),
  setMaterial: (material) => set({ material }),
  setConfig: (c) => set(c),
  setHotspot: (hotspot) => set({ hotspot }),
  addToBag: () => set((s) => ({ bagCount: s.bagCount + 1, bagPulse: s.bagPulse + 1 })),
}));
