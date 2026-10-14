import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { SITE_URL } from "@/lib/site";

/*
 * The link-preview card for every page (WhatsApp, Instagram, Google):
 * the mascot, the name and what MuteBites is on ivory, with real dishes
 * on the right. Built once at build time — nothing here depends on the
 * request. Served at /opengraph-image, which src/proxy.ts lets through
 * signed out (link-preview bots never sign in).
 *
 * Drawn with ImageResponse (always a PNG), then re-encoded as a JPEG: a
 * photo-heavy PNG card runs to ~1 MB, too big for WhatsApp to preview
 * reliably; the JPEG is ~100 KB.
 */

export const alt = "MuteBites — food delivery for VIT-AP students, pickup at Main Gate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

const PLUM = "#552C4A";
const IVORY = "#f5eae1";
const AMBER = "#A25E1D";

const dataUri = (data: Buffer, type: string) => `data:${type};base64,${data.toString("base64")}`;

export default async function OpengraphImage() {
  // Literal paths (not a helper taking a path) so the build only bundles
  // these five files. Renaming one of these photos means updating it here.
  const [markData, biryaniData, noodlesData, juiceData, lollipopData] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/mark.png")),
    readFile(join(process.cwd(), "public/MuteBites/A1 biryani/A1 Mixed Biryani-v2.jpg")),
    readFile(join(process.cwd(), "public/MuteBites/MuteBites Chinese/Chicken noodles.jpg")),
    readFile(join(process.cwd(), "public/MuteBites/Bismillah fruit juice/Pomegranate juice.jpg")),
    readFile(join(process.cwd(), "public/MuteBites/MuteBites Chinese/Chicken lollipop 4P.jpg")),
  ]);
  const mark = dataUri(markData, "image/png");
  const biryani = dataUri(biryaniData, "image/jpeg");
  const noodles = dataUri(noodlesData, "image/jpeg");
  const juice = dataUri(juiceData, "image/jpeg");
  const lollipop = dataUri(lollipopData, "image/jpeg");

  const photo = (src: string, height: number) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={280} height={height} style={{ objectFit: "cover", borderRadius: 32 }} />
  );

  const card = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: IVORY, color: PLUM }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px", width: 580 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} alt="" width={150} height={120} />
          <div style={{ marginTop: 28, fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>MuteBites</div>
          <div style={{ marginTop: 8, fontSize: 36 }}>Good food. Campus mood.</div>
          <div style={{ marginTop: 24, fontSize: 28, lineHeight: 1.35, maxWidth: 560 }}>
            Food delivery for VIT-AP students. Pickup at Main Gate, cash on delivery.
          </div>
          <div
            style={{
              marginTop: 32,
              display: "flex",
              alignSelf: "flex-start",
              background: AMBER,
              color: "#fff8f0",
              fontSize: 26,
              fontWeight: 700,
              padding: "12px 28px",
              borderRadius: 999,
            }}
          >
            {new URL(SITE_URL).host}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, padding: "0 40px 0 0", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: -120 }}>
            {photo(biryani, 360)}
            {photo(juice, 360)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 120 }}>
            {photo(noodles, 360)}
            {photo(lollipop, 360)}
          </div>
        </div>
      </div>
    ),
    size,
  );

  const png = Buffer.from(await card.arrayBuffer());
  const jpeg = await sharp(png).jpeg({ quality: 82, mozjpeg: true, progressive: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": contentType } });
}
