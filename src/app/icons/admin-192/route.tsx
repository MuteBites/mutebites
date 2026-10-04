import { appIconResponse } from "@/lib/app-icon";

// The admin app's install icon (src/lib/web-manifest.ts → /admin.webmanifest):
// the same mark with an "Admin" pill, so it's distinct on a home screen.
export const contentType = "image/png";

export function GET() {
  return appIconResponse({ width: 192, height: 192, borderRadius: 40, markScale: 0.66, label: "Admin" });
}
