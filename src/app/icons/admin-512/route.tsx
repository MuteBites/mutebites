import { appIconResponse } from "@/lib/app-icon";

// The admin app's install icon (src/lib/web-manifest.ts → /admin.webmanifest):
// the same mark with an "Admin" pill, so it's distinct on a home screen.
export const contentType = "image/png";

export function GET() {
  return appIconResponse({ width: 512, height: 512, borderRadius: 108, markScale: 0.66, label: "Admin" });
}
