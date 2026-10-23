// Orbit model pipeline: assets-src/headphones.glb → public/models/halo-one{,-mobile}.glb
//
//   pnpm optimize:model
//
// Steps (each one is logged with the running file size):
//  1. Drop what the product doesn't need: the 3.5mm cable + jack (Halo One is
//     wireless) and Blender area-light empties.
//  2. Split meshes that contain BOTH ear cups into _L / _R halves, so each side
//     can explode along its own axis.
//  3. Name parts by role (CupCap_L, Cushion_R, …) and give them role materials
//     (Shell, Cushion, Headband, Metal, Trim) that the app swaps for colourways.
//  4. Bake transforms: every part's vertices are re-centred on the part, and the
//     node's translation becomes the part centre (handy for labels + explode).
//  5. Keep only the normal map from the 4K atlas (detail: stitching, grille,
//     buttons); colour/roughness come from our own PBR values.
//  6. dedup → prune → weld → resize textures → WebP → Draco.
import { stat, mkdir } from "node:fs/promises";
import path from "node:path";
import { NodeIO, PropertyType } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  draco,
  flatten,
  prune,
  weld,
  textureCompress,
  clearNodeTransform,
  transformMesh,
  getBounds,
} from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import sharp from "sharp";

const SRC = "assets-src/headphones.glb";
const OUT_DIR = "public/models";
/** Final model height in scene units (≈ metres would be 0.25; 1 unit is easier to frame). */
const TARGET_HEIGHT = 1;

/**
 * Source mesh name → role. `split: true` means the mesh holds both cups and is
 * cut in half by the sign of x. Identified with scripts/inspect-model.mjs.
 */
const PARTS = {
  "Headphones.003_low_Headphones_0": { name: "CupCap", material: "Shell", split: true },
  "Headphones.006_low_Headphones_0": { name: "CupRim", material: "Shell", split: true },
  "Headphones.004_low_Headphones_0": { name: "Housing", material: "Trim", split: true },
  Headphones_low_Headphones_0: { name: "Cushion", material: "Cushion", split: true },
  "Headphones.013_low_Headphones_0": { name: "Grille", material: "Trim", split: true },
  "Headphones.002_low_Headphones_0": { name: "Yoke", material: "Shell", split: true },
  "Headphones.011_low_Headphones_0": { name: "Hinge", material: "Metal", split: true },
  "Headphones.010_low_Headphones_0": { name: "Slider", material: "Metal", split: true },
  "Headphones.005_low_Headphones_0": { name: "SliderBlock", material: "Shell", split: true },
  "Headphones.001_low_Headphones_0": { name: "HeadbandShell", material: "Shell" },
  "Headphones.012_low_Headphones_0": { name: "HeadbandPad", material: "Headband" },
  "Headphones.007_low_Headphones_0": { name: "ButtonPlus", material: "Trim" },
  "Headphones.008_low_Headphones_0": { name: "Buttons", material: "Trim" },
  "Headphones.009_low_Headphones_0": { name: "Port", material: "Trim" },
};
const DROP = [
  "Headphones.014_low_Headphones_0", // coiled cable
  "Headphones.015_low_Headphones_0", // jack
  "Headphones.016_low_Headphones_0",
  "Headphones.017_low_Headphones_0",
];

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

async function sizeOf(io, doc) {
  return (await io.writeBinary(doc)).byteLength;
}

/** Copy the triangles whose centroid lies on one side of x=0 into a compact new primitive. */
function splitPrimitive(doc, prim, worldMatrix, keep) {
  const pos = prim.getAttribute("POSITION").getArray();
  const idx = prim.getIndices().getArray();
  const m = worldMatrix;
  const worldX = (i) => m[0] * pos[i * 3] + m[4] * pos[i * 3 + 1] + m[8] * pos[i * 3 + 2] + m[12];

  const remap = new Map();
  const newIdx = [];
  for (let t = 0; t < idx.length; t += 3) {
    const cx = (worldX(idx[t]) + worldX(idx[t + 1]) + worldX(idx[t + 2])) / 3;
    if (!keep(cx)) continue;
    for (let k = 0; k < 3; k++) {
      const v = idx[t + k];
      if (!remap.has(v)) remap.set(v, remap.size);
      newIdx.push(remap.get(v));
    }
  }
  const out = doc.createPrimitive().setMode(prim.getMode()).setMaterial(prim.getMaterial());
  const order = [...remap.keys()];
  for (const semantic of prim.listSemantics()) {
    const acc = prim.getAttribute(semantic);
    const size = acc.getElementSize();
    const src = acc.getArray();
    const dst = new src.constructor(order.length * size);
    order.forEach((oldI, newI) => {
      for (let c = 0; c < size; c++) dst[newI * size + c] = src[oldI * size + c];
    });
    out.setAttribute(
      semantic,
      doc.createAccessor().setType(acc.getType()).setArray(dst).setNormalized(acc.getNormalized()),
    );
  }
  out.setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(newIdx)));
  return out;
}

async function run() {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

  const srcBytes = (await stat(SRC)).size;
  console.log(`source            ${mb(srcBytes)}  (${SRC})`);
  const doc = await io.read(SRC);
  const root = doc.getRoot();
  const scene = root.listScenes()[0];

  // 1. Drop cable/jack + light empties.
  for (const node of root.listNodes()) {
    const name = node.getName();
    if (DROP.includes(name) || name.startsWith("Area.") || name === "Empty") node.dispose();
  }

  // Flatten the Sketchfab hierarchy so every mesh node hangs off the scene.
  await doc.transform(flatten());

  // 2–4. Split, rename, bake.
  const roleMaterials = {};
  const normalTexture = root.listMaterials()[0].getNormalTexture();
  const materialFor = (role) => {
    if (!roleMaterials[role]) {
      roleMaterials[role] = doc
        .createMaterial(role)
        .setBaseColorFactor([0.5, 0.5, 0.5, 1])
        .setRoughnessFactor(0.5)
        .setMetallicFactor(role === "Metal" ? 1 : 0)
        .setNormalTexture(normalTexture);
    }
    return roleMaterials[role];
  };

  for (const node of root.listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const part = PARTS[node.getName()];
    if (!part) throw new Error(`Unmapped mesh node: ${node.getName()}`);
    const world = node.getWorldMatrix();

    const sides = part.split
      ? [
          ["_L", (x) => x < 0],
          ["_R", (x) => x >= 0],
        ]
      : [["", () => true]];

    for (const [suffix, keep] of sides) {
      const newMesh = doc.createMesh(part.name + suffix);
      for (const prim of mesh.listPrimitives()) {
        const p = splitPrimitive(doc, prim, world, keep);
        p.setMaterial(materialFor(part.material));
        newMesh.addPrimitive(p);
      }
      const child = doc
        .createNode(part.name + suffix)
        .setMesh(newMesh)
        .setMatrix(node.getMatrix());
      scene.addChild(child);
      clearNodeTransform(child); // bake the source transform into vertices
    }
    node.dispose();
  }

  // Strip attributes we don't use: extra UV sets and tangents (three.js derives
  // tangents per pixel when they're missing, which also handles mirrored UVs).
  for (const prim of root.listMeshes().flatMap((m) => m.listPrimitives())) {
    for (const sem of ["TEXCOORD_1", "TEXCOORD_2", "TEXCOORD_3", "TANGENT"]) {
      prim.getAttribute(sem)?.dispose();
    }
  }
  for (const mat of root.listMaterials())
    if (!Object.values(roleMaterials).includes(mat)) mat.dispose();

  // Centre on the origin and scale to TARGET_HEIGHT; then move each node's
  // origin to its part centre.
  const b = getBounds(scene);
  const s = TARGET_HEIGHT / (b.max[1] - b.min[1]);
  const c = [0, 1, 2].map((i) => (b.min[i] + b.max[i]) / 2);
  // prettier-ignore
  const fit = [s,0,0,0, 0,s,0,0, 0,0,s,0, -c[0]*s,-c[1]*s,-c[2]*s,1];
  for (const node of scene.listChildren()) {
    const mesh = node.getMesh();
    transformMesh(mesh, fit);
    const nb = getBounds(node);
    const pc = [0, 1, 2].map((i) => (nb.min[i] + nb.max[i]) / 2);
    // prettier-ignore
    transformMesh(mesh, [1,0,0,0, 0,1,0,0, 0,0,1,0, -pc[0],-pc[1],-pc[2],1]);
    node.setTranslation(pc);
  }
  for (const n of root.listNodes()) if (!n.getMesh() && !n.listChildren().length) n.dispose();

  console.log(`after cleanup     ${mb(await sizeOf(io, doc))}`);
  // Keep role materials distinct even though their factors match (the app replaces them).
  await doc.transform(
    dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.MESH, PropertyType.TEXTURE] }),
    prune(),
    weld(),
  );
  console.log(`dedup/prune/weld  ${mb(await sizeOf(io, doc))}`);

  await mkdir(OUT_DIR, { recursive: true });
  const variants = [
    { file: "halo-one.glb", size: 2048 },
    { file: "halo-one-mobile.glb", size: 1024 },
  ];
  for (const v of variants) {
    const copy = await io.readBinary(await io.writeBinary(doc));
    await copy.transform(
      textureCompress({
        encoder: sharp,
        targetFormat: "webp",
        resize: [v.size, v.size],
        quality: 88,
      }),
    );
    console.log(`  ${v.file}: textures ${v.size}px webp  ${mb(await sizeOf(io, copy))}`);
    await copy.transform(
      draco({ method: "edgebreaker", quantizePosition: 14, quantizeNormal: 10 }),
    );
    const out = path.join(OUT_DIR, v.file);
    await io.write(out, copy);
    const outBytes = (await stat(out)).size;
    console.log(
      `  ${v.file}: + draco          ${mb(outBytes)}  (${((1 - outBytes / srcBytes) * 100).toFixed(1)}% smaller than source)`,
    );
  }

  const nodes = scene.listChildren().map((n) => n.getName());
  const tris = root
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((t, p) => t + p.getIndices().getCount() / 3, 0);
  console.log(`parts: ${nodes.length}  triangles: ${tris}  scale: ×${s.toFixed(3)}`);
  console.log(nodes.join(", "));
  void kb;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
