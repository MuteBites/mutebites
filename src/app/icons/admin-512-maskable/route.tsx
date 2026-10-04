import { appIconResponse } from "@/lib/app-icon";

// Maskable admin icon: kept inside the ~80% safe circle Android may crop to.
export const contentType = "image/png";

export function GET() {
  return appIconResponse({ width: 512, height: 512, markScale: 0.46, label: "Admin" });
}
