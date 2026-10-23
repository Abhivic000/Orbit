import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
} from "three";

// Tiny tiling normal maps generated in JS: zero bytes downloaded.
// Each is a height field → normals via finite differences.

type HeightFn = (u: number, v: number) => number;

function normalMapFromHeight(size: number, height: HeightFn, strength: number): DataTexture {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) h[y * size + x] = height(x / size, y / size);

  const data = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]!;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/** Interlocking knit loops: offset rows of soft "V" bumps. */
export function createKnitNormalMap(size = 128) {
  const loops = 8;
  return normalMapFromHeight(
    size,
    (u, v) => {
      const row = Math.floor(v * loops);
      const fu = (u * loops + (row % 2) * 0.5) % 1;
      const fv = (v * loops) % 1;
      const loop = Math.sin(fu * Math.PI) * Math.sin(fv * Math.PI);
      const rib = 0.35 * Math.abs(Math.sin((fu - fv * 0.5) * Math.PI * 2));
      return loop * 0.8 + rib;
    },
    3,
  );
}

/** Leather grain: layered value noise with soft creases. */
export function createLeatherNormalMap(size = 128) {
  // Deterministic hash so the texture is identical on every load.
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const noise = (u: number, v: number, f: number) => {
    const x = u * f;
    const y = v * f;
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const s = (t: number) => t * t * (3 - 2 * t);
    const w = (a: number, b: number) => hash(((a % f) + f) % f, ((b % f) + f) % f);
    const top = w(xi, yi) + (w(xi + 1, yi) - w(xi, yi)) * s(xf);
    const bot = w(xi, yi + 1) + (w(xi + 1, yi + 1) - w(xi, yi + 1)) * s(xf);
    return top + (bot - top) * s(yf);
  };
  return normalMapFromHeight(
    size,
    (u, v) =>
      noise(u, v, 16) * 0.6 +
      noise(u, v, 32) * 0.3 +
      Math.pow(1 - Math.abs(noise(u, v, 8) * 2 - 1), 6) * 0.4,
    2.2,
  );
}
