/**
 * Generates PWA icons from the brand mark SVG into /public.
 * Run: npx tsx scripts/generate-pwa-icons.ts
 *
 * Produces:
 *   public/icon-192.png          (any)
 *   public/icon-512.png          (any)
 *   public/icon-maskable-512.png (maskable — extra safe-zone padding)
 *   public/icon.png              (notification icon used by sw.js, 192px)
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const MARK = path.join(process.cwd(), "public/brand/mentorforge-mark.svg");
const OUT = path.join(process.cwd(), "public");
const BG = { r: 250, g: 248, b: 244, alpha: 1 }; // brand cream #FAF8F4

async function render(size: number, coverage: number, file: string) {
  const inner = Math.round(size * coverage);
  const markPng = await sharp(MARK, { density: 384 })
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const pad = Math.round((size - inner) / 2);
  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: markPng, top: pad, left: pad }])
    .png()
    .toFile(path.join(OUT, file));

  console.log(`wrote public/${file} (${size}px, mark ${Math.round(coverage * 100)}%)`);
}

async function main() {
  if (!fs.existsSync(MARK)) throw new Error(`Missing ${MARK}`);
  await render(192, 0.72, "icon-192.png");
  await render(512, 0.72, "icon-512.png");
  await render(512, 0.6, "icon-maskable-512.png"); // more padding for mask safe-zone
  await render(192, 0.72, "icon.png"); // notification icon for sw.js
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
