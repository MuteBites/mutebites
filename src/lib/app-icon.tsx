import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Doesn't depend on request data, so read once at module scope (same
// pattern Next.js recommends for custom ImageResponse fonts).
const logoData = await readFile(join(process.cwd(), "public/mutebites-logo.png"));
// The file is actually JPEG-encoded despite its .png extension.
const LOGO_SRC = `data:image/jpeg;base64,${logoData.toString("base64")}`;

/**
 * Shared MuteBites app-icon mark (the real logo, full-bleed) — used by
 * every generated icon route (app/icons/*, app/apple-icon.tsx) so the
 * source image only ever needs updating in one place. The logo already
 * has its brand circle inset from the canvas edge, so it's safe to use
 * full-bleed even for the maskable icon (no extra padding needed).
 */
export function appIconResponse({
  width,
  height,
  borderRadius = 0,
}: {
  width: number;
  height: number;
  /** 0 (default) for full-bleed icons — maskable/apple-touch icons where the OS applies its own mask. */
  borderRadius?: number;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          overflow: "hidden",
          borderRadius,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_SRC}
          alt=""
          width={width}
          height={height}
          style={{ objectFit: "cover" }}
        />
      </div>
    ),
    { width, height },
  );
}
