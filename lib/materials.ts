import gsap from "gsap";
import {
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  type Texture,
} from "three";
import { getColourway, type ColourwayId, type HeadbandMaterialId } from "./product";
import { createKnitNormalMap, createLeatherNormalMap } from "./proceduralTextures";

// All product materials are created ONCE and then mutated.
//
// Creating a new material per click would force a shader compile (a visible
// stutter). Changing `.color` or swapping one normal map for another is just a
// uniform/texture update — no recompile. We also keep `sheen > 0` on both
// headband variants so the USE_SHEEN shader define never flips.

export type HaloMaterials = {
  shell: MeshPhysicalMaterial;
  accent: MeshPhysicalMaterial; // ear cushions
  trim: MeshStandardMaterial; // housing, grille, buttons
  metal: MeshStandardMaterial;
  headband: MeshPhysicalMaterial;
  driver: MeshStandardMaterial;
};

let instance: HaloMaterials | null = null;
let knit: Texture | null = null;
let leather: Texture | null = null;

/** Build the shared materials (idempotent). `detailNormal` is the atlas normal map from the GLB. */
export function getMaterials(detailNormal: Texture | null): HaloMaterials {
  if (instance) return instance;
  const n = detailNormal ?? undefined;

  const shell = new MeshPhysicalMaterial({
    name: "Shell",
    color: "#2B2D31",
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.35,
    normalMap: n,
  });
  const accent = new MeshPhysicalMaterial({
    name: "Cushion",
    color: "#1C1E22",
    roughness: 0.62,
    sheen: 0.35,
    sheenRoughness: 0.45,
    sheenColor: new Color("#ffffff"),
    normalMap: n,
  });
  const trim = new MeshStandardMaterial({
    name: "Trim",
    color: "#1C1E22",
    roughness: 0.55,
    normalMap: n,
  });
  const metal = new MeshStandardMaterial({
    name: "Metal",
    color: "#C9CCD1",
    roughness: 0.25,
    metalness: 1,
    normalMap: n,
  });
  const headband = new MeshPhysicalMaterial({
    name: "Headband",
    color: "#1C1E22",
    roughness: 0.9,
    sheen: 1,
    sheenRoughness: 0.8,
    sheenColor: new Color("#8a8f98"),
  });
  const driver = new MeshStandardMaterial({ name: "Driver", color: "#15171a", roughness: 0.7 });

  // The source asset is authored double-sided (thin shells, open cones).
  for (const mat of [shell, accent, trim, metal, headband, driver]) mat.side = DoubleSide;

  instance = { shell, accent, trim, metal, headband, driver };
  return instance;
}

/** Disposal hook for HMR / unmount. */
export function disposeMaterials() {
  if (!instance) return;
  Object.values(instance).forEach((m) => m.dispose());
  knit?.dispose();
  leather?.dispose();
  instance = null;
  knit = leather = null;
}

const tmp = { shell: new Color(), accent: new Color() };

/**
 * Tween the product colours to a colourway (mutating the existing materials).
 * `onUpdate` lets callers request a frame when the canvas renders on demand.
 */
export function applyColourway(id: ColourwayId, duration = 0.6, onUpdate?: () => void) {
  const m = instance;
  if (!m) return;
  const cw = getColourway(id);
  // Color.set() converts the sRGB hex to linear working space for us.
  tmp.shell.set(cw.product);
  tmp.accent.set(cw.accent);
  // Light colourways read better slightly glossier.
  const light = id === "glacier";
  const targets = [
    [m.shell.color, tmp.shell],
    [m.accent.color, tmp.accent],
    [m.trim.color, tmp.accent],
    [m.headband.color, tmp.accent],
  ] as const;
  for (const [color, to] of targets) {
    gsap.to(color, {
      r: to.r,
      g: to.g,
      b: to.b,
      duration,
      ease: "power2.inOut",
      overwrite: true,
      onUpdate,
    });
  }
  gsap.to(m.shell, { roughness: light ? 0.42 : 0.5, duration, overwrite: true });
}

/** Comfort beat: lift the cushion sheen (0 → 1). */
export function setCushionSheen(amount: number) {
  if (instance) instance.accent.sheen = 0.35 + amount * 0.65;
}

/** Swap headband material: roughness + normal map (no new material, no recompile). */
export function applyHeadband(id: HeadbandMaterialId) {
  const m = instance;
  if (!m) return;
  knit ??= createKnitNormalMap();
  leather ??= createLeatherNormalMap();
  if (id === "knit") {
    m.headband.normalMap = knit;
    m.headband.normalScale = new Vector2(0.9, 0.9);
    m.headband.roughness = 0.92;
    m.headband.sheen = 1;
    // > 0 keeps the USE_CLEARCOAT define stable (switching never recompiles).
    m.headband.clearcoat = 0.0001;
  } else {
    m.headband.normalMap = leather;
    m.headband.normalScale = new Vector2(0.35, 0.35);
    m.headband.roughness = 0.42;
    m.headband.sheen = 0.15;
    m.headband.clearcoat = 0.25;
  }
  // The tiling maps sit on the atlas UVs, where the headband island is small.
  m.headband.normalMap.repeat.set(70, 70);
}
