import { ImageResponse } from "next/og";

const BRAND_ORANGE = "#f26419";

/**
 * Shared MuteBites app-icon mark ("M" on a brand-orange square) — used by
 * every generated icon route (app/icons/*, app/apple-icon.tsx) so the mark
 * and brand color only ever need updating in one place.
 */
export function appIconResponse({
  width,
  height,
  fontSize,
  borderRadius = 0,
}: {
  width: number;
  height: number;
  fontSize: number;
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
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_ORANGE,
          borderRadius,
        }}
      >
        <span style={{ fontSize, fontWeight: 800, color: "#fff" }}>M</span>
      </div>
    ),
    { width, height },
  );
}
