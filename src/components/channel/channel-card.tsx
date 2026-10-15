import { MessageCircle } from "lucide-react";
import { IconTile } from "@/components/icon-tile";
import { WHATSAPP_GROUP_URL } from "@/lib/support";

/** Profile: the MuteBites WhatsApp group, always findable after the Home card. Ported from College Bites' channel card. */
export function ChannelCard() {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-[1.5rem] border bg-card px-5 py-4 shadow-card">
      <IconTile>
        <MessageCircle className="size-5 text-success" aria-hidden="true" />
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">Offers and updates</p>
        <p className="font-semibold">WhatsApp group</p>
      </div>
      <a
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-semibold text-brand-soft-foreground outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring/80"
      >
        Join
      </a>
    </div>
  );
}
