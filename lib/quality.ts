// Quality tiers: pick an initial tier from device hints, then let drei's
// <PerformanceMonitor> adjust at runtime (Scene.tsx).
//
//   fallback → no WebGL: pre-rendered stills (no WebGL, software GPU, reduced motion, very weak devices)
//   low      → DPR ≤ 1.5, no postprocessing, 1k textures, small HDRI, 256px contact shadow
//   high     → DPR ≤ 2, bloom + vignette + SMAA, 2k textures, 512px HDRI + shadow

export type Tier = "fallback" | "low" | "high";

export type TierInput = {
  webgl: boolean;
  reducedMotion: boolean;
  /** window.devicePixelRatio */
  dpr: number;
  /** navigator.hardwareConcurrency (0 if unknown) */
  cores: number;
  /** navigator.deviceMemory in GB (Chromium only) */
  memory?: number;
  /** Unmasked renderer string, e.g. "ANGLE (Apple, Apple M2, OpenGL 4.1)" */
  gpu?: string;
  /** Touch-first / small screen device */
  mobile: boolean;
  /** navigator.connection.saveData */
  saveData?: boolean;
};

const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;
// Old or entry-level mobile/integrated GPUs that struggle with PBR + postprocessing.
const WEAK_GPU =
  /mali-[4t]|mali-g(31|51|52|57)|adreno \(tm\) [2-5]\d\d|adreno [2-5]\d\d|powervr|sgx|intel.*hd graphics( [2-5]\d{2,3})?\b|gma/i;

export function selectTier(i: TierInput): Tier {
  // Hard requirements for the 3D version.
  if (!i.webgl || i.reducedMotion) return "fallback";
  const gpu = i.gpu ?? "";
  if (SOFTWARE_GPU.test(gpu)) return "fallback";

  // Very constrained devices get the stills; they'd be < 30fps anyway.
  const weakGpu = WEAK_GPU.test(gpu);
  if (i.memory !== undefined && i.memory <= 2 && i.cores > 0 && i.cores <= 4) return "fallback";
  if (weakGpu && i.mobile && i.cores > 0 && i.cores <= 4) return "fallback";

  // Mobile, data saver, weak GPU or few cores → low.
  if (i.mobile || i.saveData || weakGpu) return "low";
  if (i.cores > 0 && i.cores <= 4) return "low";
  // A 3× screen on a laptop-class device is fine on high (DPR is capped at 2 anyway).
  return "high";
}

export type TierSettings = {
  /** [min, max] device pixel ratio */
  dpr: [number, number];
  effects: boolean;
  hdri: string;
  shadowResolution: number;
  model: "high" | "low";
};

export const TIER_SETTINGS: Record<Exclude<Tier, "fallback">, TierSettings> = {
  low: {
    dpr: [1, 1.5],
    effects: false,
    hdri: "/hdri/studio-low.hdr",
    shadowResolution: 256,
    model: "low",
  },
  high: {
    dpr: [1, 2],
    effects: true,
    hdri: "/hdri/studio-high.hdr",
    shadowResolution: 512,
    model: "high",
  },
};

/** Allow ?tier=high|low|fallback to force a tier (demos, screenshots, debugging). */
export function tierOverride(search: string): Tier | null {
  const t = new URLSearchParams(search).get("tier");
  return t === "high" || t === "low" || t === "fallback" ? t : null;
}

/** Collect the hints in the browser. */
export function readTierInput(): TierInput {
  let webgl = false;
  let gpu: string | undefined;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (gl) {
      webgl = true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      gpu = ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    webgl = false;
  }
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return {
    webgl,
    gpu,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    dpr: window.devicePixelRatio || 1,
    cores: nav.hardwareConcurrency || 0,
    memory: nav.deviceMemory,
    mobile:
      window.matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 820,
    saveData: nav.connection?.saveData,
  };
}
