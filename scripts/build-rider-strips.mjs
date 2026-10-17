// Turns the Flow green-screen loops (docs/art/plum-promo/new/loop-*.mp4,
// extracted to PNG frames with ffmpeg first) into transparent WebP frame
// strips for the Plum promo rider. Per pose: finds the most seamless loop
// window, samples it at 12 fps, keys out the green with despill, crops every
// frame to one shared box (so nothing jitters), and writes a horizontal strip.
// Run: node scripts/build-rider-strips.mjs <framesDir> <outDir>
import fs from "node:fs";
import sharp from "sharp";

const [, , FRAMES, OUT] = process.argv;
const POSES = ["left", "right", "approach", "arrive"];
const STEP = 2;                         // every 2nd frame: 24 fps in -> 12 fps strip
const MIN_L = 30, MAX_L = 40;           // loop length 1.25–1.7 s at 24 fps (the motion is cyclic)
const FRAME_H = 160;                    // strip frame height (px): the rider shows at most ~60 px wide

const thumb = async (f) => (await sharp(f).resize(64, 36).greyscale().raw().toBuffer());
const diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };

// Green key with despill: alpha from how much green beats red/blue.
function key(data, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const m = Math.max(r, b), excess = g - m;
    let a = excess <= 18 ? 255 : excess >= 70 ? 0 : Math.round(255 * (1 - (excess - 18) / 52));
    const gg = g > m ? m + (g - m) * 0.15 : g; // despill
    out[j] = r; out[j + 1] = Math.round(gg); out[j + 2] = b; out[j + 3] = a;
  }
  return out;
}

const meta = {};
for (const pose of POSES) {
  const dir = `${FRAMES}/${pose}`;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort().map((f) => `${dir}/${f}`);
  const th = await Promise.all(files.map(thumb));
  // Most seamless window: frame a matches frame a+L best.
  let best = { d: 1e9, a: 0, L: 48 };
  for (let L = MIN_L; L <= MAX_L; L++) for (let a = 12; a + L < files.length - 6; a++) {
    const d = diff(th[a], th[a + L]); if (d < best.d) best = { d, a, L };
  }
  const pick = []; for (let k = best.a; k < best.a + best.L; k += STEP) pick.push(files[k]);
  // Key every picked frame, find the shared box.
  const keyed = [];
  let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0, W = 0, H = 0;
  for (const f of pick) {
    const { data, info } = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    W = info.width; H = info.height;
    const k = key(data, W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (k[(y * W + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    keyed.push(k);
  }
  const pad = 6; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const scale = FRAME_H / ch, fw = Math.round(cw * scale);
  const tiles = [];
  for (const k of keyed) {
    tiles.push(await sharp(k, { raw: { width: W, height: H, channels: 4 } }).extract({ left: x0, top: y0, width: cw, height: ch }).resize(fw, FRAME_H).png().toBuffer());
  }
  const strip = sharp({ create: { width: fw * tiles.length, height: FRAME_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(tiles.map((input, i) => ({ input, left: i * fw, top: 0 })));
  const file = `${OUT}/rider-${pose}.webp`;
  await strip.webp({ quality: 72, alphaQuality: 78, effort: 6 }).toFile(file);
  // Source px per strip px is the same for every pose only if ch matches; record real size.
  meta[pose] = { frames: tiles.length, frameW: fw, frameH: FRAME_H, srcBoxH: ch, srcBoxW: cw, loopFrom: best.a, loopLen: best.L, seamDiff: +best.d.toFixed(2), bytes: fs.statSync(file).size };
  console.log(pose, JSON.stringify(meta[pose]));
}
fs.writeFileSync(`${OUT}/rider-strips.json`, JSON.stringify(meta, null, 2));
