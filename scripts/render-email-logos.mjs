import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const SVG_PATH = resolve(REPO, "public/brand/kiribe-logo.svg");
const OUT_DIR = resolve(REPO, "public/brand");

const raw = readFileSync(SVG_PATH, "utf8");

async function renderWordmark({ fill, outName, width }) {
  const recolored = raw.replace(/currentColor/g, fill);
  const buf = await sharp(Buffer.from(recolored), { density: 400 })
    .resize({ width, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  const outPath = `${OUT_DIR}/${outName}`;
  writeFileSync(outPath, buf);
  const meta = await sharp(buf).metadata();
  console.log(`${outName}: ${meta.width}x${meta.height}, ${buf.length} bytes`);
}

// White for the transactional email masthead (rendered on the burgundy hero).
await renderWordmark({ fill: "#ffffff", outName: "kiribe-wordmark-white.png", width: 640 });
// Burgundy (--color-burgundy #6b1d2a) for signatures on white/cream backgrounds.
// This is the on-brand wordmark for mail signatures, letterheads, and any UI
// where the wordmark sits on a light surface.
await renderWordmark({ fill: "#6b1d2a", outName: "kiribe-wordmark-dark.png", width: 640 });
