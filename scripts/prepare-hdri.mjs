// Downsamples a Radiance .hdr (RGBE) environment map for the web.
//
// Usage: node scripts/prepare-hdri.mjs <input.hdr> <outDir> [--preview]
//
// A product on a matte "paper sweep" only needs the HDRI for soft lighting and
// blurry reflections, so 512x256 (high tier) and 256x128 (low tier) are plenty.
// That takes a 1.6 MB Poly Haven 1k file down to ~0.5 MB / ~0.13 MB.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

/** Parse an RGBE file into a Float32Array of linear RGB. */
function readHdr(buf) {
  let pos = 0;
  const line = () => {
    let s = "";
    while (buf[pos] !== 0x0a) s += String.fromCharCode(buf[pos++]);
    pos++;
    return s;
  };
  if (!line().startsWith("#?")) throw new Error("Not a Radiance HDR file");
  for (let l = line(); l !== ""; l = line()) {
    if (l.startsWith("FORMAT") && !l.includes("32-bit_rle_rgbe")) throw new Error(l);
  }
  const m = /-Y (\d+) \+X (\d+)/.exec(line());
  if (!m) throw new Error("Unsupported HDR orientation");
  const height = Number(m[1]);
  const width = Number(m[2]);
  const rgbe = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    const row = rgbe.subarray(y * width * 4, (y + 1) * width * 4);
    const isRle = buf[pos] === 2 && buf[pos + 1] === 2 && (buf[pos + 2] & 0x80) === 0;
    if (!isRle) {
      row.set(buf.subarray(pos, pos + width * 4));
      pos += width * 4;
      continue;
    }
    pos += 4;
    // New-style RLE: each of the 4 channels is run-length encoded separately.
    for (let c = 0; c < 4; c++) {
      let x = 0;
      while (x < width) {
        let count = buf[pos++];
        if (count > 128) {
          count -= 128;
          const v = buf[pos++];
          for (let i = 0; i < count; i++) row[x++ * 4 + c] = v;
        } else {
          for (let i = 0; i < count; i++) row[x++ * 4 + c] = buf[pos++];
        }
      }
    }
  }

  const rgb = new Float32Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    const e = rgbe[i * 4 + 3];
    const f = e === 0 ? 0 : Math.pow(2, e - 136);
    rgb[i * 3] = rgbe[i * 4] * f;
    rgb[i * 3 + 1] = rgbe[i * 4 + 1] * f;
    rgb[i * 3 + 2] = rgbe[i * 4 + 2] * f;
  }
  return { width, height, rgb };
}

/** Box-filter downsample by an integer factor. */
function downsample({ width, height, rgb }, factor) {
  const w = Math.floor(width / factor);
  const h = Math.floor(height / factor);
  const out = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        for (let dy = 0; dy < factor; dy++)
          for (let dx = 0; dx < factor; dx++)
            sum += rgb[((y * factor + dy) * width + x * factor + dx) * 3 + c];
        out[(y * w + x) * 3 + c] = sum / (factor * factor);
      }
    }
  }
  return { width: w, height: h, rgb: out };
}

/** Write a flat (uncompressed) RGBE file. */
function writeHdr({ width, height, rgb }) {
  const header = Buffer.from(
    `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`,
    "ascii",
  );
  const data = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const r = rgb[i * 3];
    const g = rgb[i * 3 + 1];
    const b = rgb[i * 3 + 2];
    const max = Math.max(r, g, b);
    if (max < 1e-32) continue;
    const e = Math.ceil(Math.log2(max));
    const scale = 256 / Math.pow(2, e);
    data[i * 4] = Math.min(255, Math.floor(r * scale));
    data[i * 4 + 1] = Math.min(255, Math.floor(g * scale));
    data[i * 4 + 2] = Math.min(255, Math.floor(b * scale));
    data[i * 4 + 3] = e + 128;
  }
  return Buffer.concat([header, data]);
}

async function preview(img, file) {
  const { default: sharp } = await import("sharp");
  const px = Buffer.alloc(img.width * img.height * 3);
  for (let i = 0; i < img.rgb.length; i++) {
    const v = img.rgb[i] / (1 + img.rgb[i]); // Reinhard
    px[i] = Math.round(Math.pow(v, 1 / 2.2) * 255);
  }
  await sharp(px, { raw: { width: img.width, height: img.height, channels: 3 } })
    .png()
    .toFile(file);
}

const [input, outDir = "public/hdri"] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!input) {
  console.error("Usage: node scripts/prepare-hdri.mjs <input.hdr> [outDir] [--preview]");
  process.exit(1);
}
const src = readHdr(await readFile(input));
await mkdir(outDir, { recursive: true });
for (const [label, targetWidth] of [
  ["high", 512],
  ["low", 256],
]) {
  const img = downsample(src, Math.max(1, Math.round(src.width / targetWidth)));
  const file = path.join(outDir, `studio-${label}.hdr`);
  const bytes = writeHdr(img);
  await writeFile(file, bytes);
  console.log(`${file}  ${img.width}x${img.height}  ${(bytes.length / 1024).toFixed(0)} KB`);
  if (process.argv.includes("--preview"))
    await preview(img, file.replace(/\.hdr$/, ".preview.png"));
}
