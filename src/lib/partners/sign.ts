import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { VERIFY_TTL_MS, type PartnerOrderPayload } from "@/lib/partners";

/**
 * Signs a partner order into a verify token: base64url(JSON) + "." + an
 * HMAC of it. Nothing is stored; the link carries the order and the
 * signature proves MuteBites wrote it. The key is derived from the
 * service-role key (a server-only secret already set on Vercel); with no
 * key there's no verify link, and the order still goes through.
 */
function key(): Buffer | null {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  return createHmac("sha256", secret).update("mutebites:partner-verify:v1").digest();
}

function mac(k: Buffer, body: string) {
  return createHmac("sha256", k).update(body).digest().subarray(0, 18).toString("base64url");
}

export function signPartnerOrder(payload: PartnerOrderPayload): string | null {
  const k = key();
  if (!k) return null;
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${mac(k, body)}`;
}

export type VerifyResult =
  | { status: "valid"; order: PartnerOrderPayload }
  | { status: "expired"; order: PartnerOrderPayload }
  | { status: "invalid" };

export function verifyPartnerOrder(token: string): VerifyResult {
  const k = key();
  const [body, sig, extra] = token.split(".");
  if (!k || !body || !sig || extra !== undefined) return { status: "invalid" };
  const want = Buffer.from(mac(k, body));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return { status: "invalid" };
  try {
    const order = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PartnerOrderPayload;
    if (order.v !== 1 || !Array.isArray(order.i)) return { status: "invalid" };
    return Date.now() - order.s > VERIFY_TTL_MS ? { status: "expired", order } : { status: "valid", order };
  } catch {
    return { status: "invalid" };
  }
}
