// Cleans the edge fringe AI image tools leave after background removal (red /
// yellow speckle in the half-transparent edge pixels): drops faint speckle,
// re-colours the remaining edge from its solid neighbours, and makes
// near-solid pixels solid. Used for the Plum promo art (docs/art/plum-promo).
// Run: node scripts/clean-art-fringe.mjs <in.png> <out.png>
import sharp from "sharp";
const [, , src, out] = process.argv;
(async () => {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const a = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) a[i] = data[i * 4 + 3];
  const out8 = Buffer.from(data);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, al = a[i];
    if (al >= 245) { out8[i * 4 + 3] = 255; continue; }       // near-solid → solid
    if (al < 110) { out8[i * 4 + 3] = 0; continue; }          // faint speckle → gone
    // edge pixel: take colour from solid neighbours (radius 3)
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const j = yy * W + xx;
      if (a[j] >= 245) { r += data[j * 4]; g += data[j * 4 + 1]; b += data[j * 4 + 2]; n++; }
    }
    if (n === 0) { out8[i * 4 + 3] = 0; continue; }           // isolated → gone
    out8[i * 4] = r / n; out8[i * 4 + 1] = g / n; out8[i * 4 + 2] = b / n;
    out8[i * 4 + 3] = Math.round(((al - 110) / 135) * 255);   // re-ramp the edge
  }
  await sharp(out8, { raw: { width: W, height: H, channels: 4 } }).png().toFile(out);
  console.log("cleaned", out);
})();
