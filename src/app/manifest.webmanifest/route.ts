import { manifestResponse, STUDENT_MANIFEST } from "@/lib/web-manifest";

export const dynamic = "force-static";

export function GET() {
  return manifestResponse(STUDENT_MANIFEST);
}
