// Builds the startup splash's art (src/components/splash/) from the sources
// in docs/art/splash/new/:
//   cloche.webp  the closed cloche on its tray (cloche-closed.png, trimmed)
//   pop.webp     the mascot waving in the open cloche: frames 14–36 of the
//                Veo clip (splash-pop.mp4, the fade-in from black skipped),
//                every 2nd frame -> 12 frames at 12 fps, green keyed out with
//                despill, one shared crop, one horizontal strip
//   steam.webp   the steam curl (steam.png)
//   mark-sm.webp the mascot mark, small, for the light splash and the
//                tile the full splash lands as (public/brand/mark.webp)
// and writes src/components/splash/scene.ts with each image's size and where
// the cloche sits inside the pop frame, so the two line up on the burst.
// Run: node scripts/build-splash.mjs   (needs ffmpeg on PATH)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const SRC = "docs/art/splash/new";
const OUT = "public/brand/splash/v2";
const FIRST = 14, LAST = 36, STEP = 2;
const POP_H = 240;      // strip frame height: the splash shows it ~170–200 css px tall
const CLOCHE_W = 520;
const STEAM_H = 260;

fs.mkdirSync(OUT, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "splash-"));
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${SRC}/splash-pop.mp4`,
  "-vf", `select='between(n\\,${FIRST}\\,${LAST})*not(mod(n-${FIRST}\\,${STEP}))',crop=iw*0.94:ih*0.94:0:0`,
  "-fps_mode", "passthrough", `${tmp}/%04d.png`]);
const files = fs.readdirSync(tmp).filter((f) => f.endsWith(".png")).sort().map((f) => `${tmp}/${f}`);

// Green key with despill: alpha from how much green beats red / blue.
function key(data) {
  const out = Buffer.alloc((data.length / 3) * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const m = Math.max(r, b), excess = g - m;
    const a = excess <= 18 ? 255 : excess >= 70 ? 0 : Math.round(255 * (1 - (excess - 18) / 52));
    out[j] = r; out[j + 1] = Math.round(g > m ? m + (g - m) * 0.15 : g); out[j + 2] = b; out[j + 3] = a;
  }
  return out;
}

let W = 0, H = 0, x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0;
const keyed = [];
for (const f of files) {
  const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  W = info.width; H = info.height;
  const k = key(data);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (k[(y * W + x) * 4 + 3] > 60) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  keyed.push(k);
}
const pad = 6;
x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
const fw = Math.round((cw * POP_H) / ch);
const tiles = [];
for (const k of keyed) {
  tiles.push(await sharp(k, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: x0, top: y0, width: cw, height: ch }).resize(fw, POP_H).png().toBuffer());
}
await sharp({ create: { width: fw * tiles.length, height: POP_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite(tiles.map((input, i) => ({ input, left: i * fw, top: 0 })))
  .webp({ quality: 66, alphaQuality: 75, effort: 6 }).toFile(`${OUT}/pop.webp`);

// The tray's width in the pop frame: the widest opaque row in the lower third.
const last = await sharp(tiles[0]).raw().toBuffer({ resolveWithObject: true });
let trayW = 0, trayL = 0, trayBottom = 0;
for (let y = Math.floor(POP_H * 0.6); y < POP_H; y++) {
  let l = -1, r = -1;
  for (let x = 0; x < fw; x++) if (last.data[(y * fw + x) * 4 + 3] > 120) { if (l < 0) l = x; r = x; }
  if (l >= 0) { trayBottom = y; if (r - l > trayW) { trayW = r - l; trayL = l; } }
}

// Closed cloche, trimmed to its pixels.
const cloche = sharp(`${SRC}/cloche-closed.png`).trim({ threshold: 10 }).resize({ width: CLOCHE_W });
const cl = await cloche.clone().webp({ quality: 80, alphaQuality: 85, effort: 6 }).toFile(`${OUT}/cloche.webp`);
const steam = await sharp(`${SRC}/steam.png`).trim({ threshold: 10 }).resize({ height: STEAM_H })
  .webp({ quality: 78, alphaQuality: 80, effort: 6 }).toFile(`${OUT}/steam.webp`);

// The light splash (old phones / slow connections) only needs the mascot
// mark, small: the same art as BrandLogo's tile, ~8 KB instead of 45.
const mark = await sharp("public/brand/mark.webp").resize({ width: 220 })
  .webp({ quality: 78, alphaQuality: 80, effort: 6 }).toFile(`${OUT}/mark-sm.webp`);

const scene = {
  pop: { src: "/brand/splash/v2/pop.webp", frames: tiles.length, w: fw, h: POP_H, fps: 12,
    // The tray inside the pop frame, as fractions — the closed cloche is
    // placed so its tray lands exactly here.
    tray: { left: +(trayL / fw).toFixed(4), width: +(trayW / fw).toFixed(4), bottom: +((trayBottom + 1) / POP_H).toFixed(4) } },
  cloche: { src: "/brand/splash/v2/cloche.webp", w: cl.width, h: cl.height },
  steam: { src: "/brand/splash/v2/steam.webp", w: steam.width, h: steam.height },
  mark: { src: "/brand/splash/v2/mark-sm.webp", w: mark.width, h: mark.height },
};
fs.writeFileSync("src/components/splash/scene.ts",
  `// Generated by scripts/build-splash.mjs — don't edit by hand.\nexport const SCENE = ${JSON.stringify(scene, null, 2)} as const;\n`);
for (const f of ["pop", "cloche", "steam", "mark-sm"]) console.log(f, fs.statSync(`${OUT}/${f}.webp`).size, "bytes");
console.log(JSON.stringify(scene));
fs.rmSync(tmp, { recursive: true, force: true });
