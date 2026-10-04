import { ADMIN_MANIFEST, manifestResponse } from "@/lib/web-manifest";

export const dynamic = "force-static";

export function GET() {
  return manifestResponse(ADMIN_MANIFEST);
}
