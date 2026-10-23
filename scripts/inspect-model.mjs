// Dev utility: software-renders each mesh of a glTF highlighted in red (front/side/3-4 views)
// so parts can be identified without a 3D viewer. Usage: node scripts/inspect-model.mjs <in.glb> <out.png> [meshIndex...]
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import sharp from "sharp";
import draco3d from "draco3dgltf";
const [file, out, ...onlyArgs] = process.argv.slice(2);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "draco3d.decoder": await draco3d.createDecoderModule() });
const doc = await io.read(file);
const meshes = [];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const W = node.getWorldMatrix();
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute("POSITION").getArray();
    const idx = prim.getIndices()?.getArray();
    const P = [];
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i],
        y = pos[i + 1],
        z = pos[i + 2];
      P.push([
        W[0] * x + W[4] * y + W[8] * z + W[12],
        W[1] * x + W[5] * y + W[9] * z + W[13],
        W[2] * x + W[6] * y + W[10] * z + W[14],
      ]);
    }
    meshes.push({ name: node.getName(), P, idx: idx ? Array.from(idx) : P.map((_, i) => i) });
  }
}
const views = {
  back: (p) => [-p[0], p[1], -p[2]],
  front: (p) => [p[0], p[1], p[2]],
  side: (p) => [-p[2], p[1], p[0]],
  top: (p) => [p[0], -p[2], p[1]],
  persp: (p) => {
    const a = 0.6;
    const x = p[0] * Math.cos(a) + p[2] * Math.sin(a),
      z = -p[0] * Math.sin(a) + p[2] * Math.cos(a);
    const b = 0.35;
    return [x, p[1] * Math.cos(b) - z * Math.sin(b), p[1] * Math.sin(b) + z * Math.cos(b)];
  },
};
let mn = [1e9, 1e9],
  mx = [-1e9, -1e9];
const T = Number(process.env.TILE || 320);
const EX = (process.env.EXCLUDE || "").split(",").filter(Boolean).map(Number);
for (const i of [...EX].sort((a, b) => b - a)) meshes.splice(i, 1);
function render(view, highlight) {
  const zb = new Float32Array(T * T).fill(-1e9),
    px = Buffer.alloc(T * T * 3, 245);
  const all = meshes.flatMap((m) => m.P.map(view));
  mn = [Math.min(...all.map((p) => p[0])), Math.min(...all.map((p) => p[1]))];
  mx = [Math.max(...all.map((p) => p[0])), Math.max(...all.map((p) => p[1]))];
  const s = (T - 20) / Math.max(mx[0] - mn[0], mx[1] - mn[1]);
  meshes.forEach((m, mi) => {
    const V = m.P.map(view).map((p) => [
      10 + (p[0] - mn[0]) * s,
      T - 10 - (p[1] - mn[1]) * s,
      p[2],
    ]);
    const hl = highlight === null ? null : highlight.includes(mi);
    for (let t = 0; t < m.idx.length; t += 3) {
      const a = V[m.idx[t]],
        b = V[m.idx[t + 1]],
        c = V[m.idx[t + 2]];
      const ux = b[0] - a[0],
        uy = b[1] - a[1],
        uz = b[2] - a[2],
        vx = c[0] - a[0],
        vy = c[1] - a[1],
        vz = c[2] - a[2];
      let nz = ux * vy - uy * vx;
      const nl = Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, nz) || 1;
      const shade = Math.abs(nz / nl);
      const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))),
        x1 = Math.min(T - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
      const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))),
        y1 = Math.min(T - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
      const area = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      if (Math.abs(area) < 1e-9) continue;
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const w0 = ((b[0] - x) * (c[1] - y) - (b[1] - y) * (c[0] - x)) / area,
            w1 = ((c[0] - x) * (a[1] - y) - (c[1] - y) * (a[0] - x)) / area,
            w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const z = w0 * a[2] + w1 * b[2] + w2 * c[2];
          const k = y * T + x;
          if (z <= zb[k]) continue;
          zb[k] = z;
          let col;
          const l = 0.35 + 0.65 * shade;
          if (hl === null) {
            const h = ((mi * 137.5) % 360) / 60;
            const f = h - Math.floor(h);
            const q = [
              [1, f, 0],
              [1 - f, 1, 0],
              [0, 1, f],
              [0, 1 - f, 1],
              [f, 0, 1],
              [1, 0, 1 - f],
            ][Math.floor(h) % 6];
            col = q.map((v) => (0.3 + 0.7 * v) * l * 255);
          } else col = hl ? [230 * l, 40 * l, 40 * l] : [200 * l, 200 * l, 205 * l];
          px[k * 3] = col[0];
          px[k * 3 + 1] = col[1];
          px[k * 3 + 2] = col[2];
        }
    }
  });
  return px;
}
const only = onlyArgs.length ? onlyArgs.map(Number) : null;
const tiles = [];
const list = only ? [only] : meshes.map((_, i) => [i]);
for (const hl of list)
  for (const v of (process.env.VIEWS || "front,side,persp").split(","))
    tiles.push({ px: render(views[v], hl), label: hl.join(",") + " " + v });
const cols = 6,
  rows = Math.ceil(tiles.length / cols);
const comp = tiles.map((t, i) => ({
  input: t.px,
  raw: { width: T, height: T, channels: 3 },
  left: (i % cols) * T,
  top: Math.floor(i / cols) * T,
}));
await sharp({ create: { width: cols * T, height: rows * T, channels: 3, background: "#fff" } })
  .composite(comp)
  .png()
  .toFile(out);
meshes.forEach((m, i) => console.log(i, m.name, m.idx.length / 3));
