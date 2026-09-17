import { MessageCircle, Phone } from "lucide-react";
import { whatsAppLink } from "@/lib/phone";
import { SUPPORT_PHONE } from "@/lib/support";

/** "Need help?" card with Call + WhatsApp buttons — same idea as order-tracking's "Call MuteBites" card, but platform-wide rather than tied to one order's restaurant. */
export function SupportCard() {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4">
      <div>
        <p className="text-sm text-muted-foreground">Need help?</p>
        <p className="font-semibold">Contact MuteBites</p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={`tel:${SUPPORT_PHONE}`}
          aria-label="Call MuteBites support"
          className="flex size-11 items-center justify-center rounded-xl bg-ink text-ink-foreground outline-none hover:bg-ink/90 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Phone className="size-4" />
        </a>
        <a
          href={whatsAppLink(SUPPORT_PHONE, "Hi MuteBites, I need help with my order.")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message MuteBites on WhatsApp"
          className="flex size-11 items-center justify-center rounded-xl bg-success text-white outline-none hover:bg-success/90 focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <MessageCircle className="size-4" />
        </a>
      </div>
    </div>
  );
}
