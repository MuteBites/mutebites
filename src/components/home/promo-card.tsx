import { Banknote, Clock, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { KaapiMotif } from "@/components/theme/kaapi-motif";

/**
 * Home's promo card, shown while ordering is open (when it's closed, the
 * "Ordering is closed" banner takes this spot): the lit plum hero with the
 * pitch on the left — hot food at Main Gate, pay when you collect — the
 * real delivery time an order placed now gets (deliveryWindow(), passed
 * in from the server so it can't disagree with the ticket), and the
 * mascot's ivory tile floating on the right with a warm glow behind it.
 * The float is in the reduced-motion-safe block (`animate-float`).
 */
export function PromoCard({ slot }: { slot: { lead: string; time: string } }) {
  return (
    <section
      aria-labelledby="promo-heading"
      className="surface-hero glow-hero relative mt-6 overflow-hidden rounded-[1.75rem] bg-hero p-5 pr-28 text-hero-foreground"
    >
      <KaapiMotif className="right-20 -bottom-6 size-24" />
      {/* Warm light behind the mascot. */}
      <span
        aria-hidden="true"
        className="absolute top-1/2 -right-6 size-40 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--promo-light),transparent)]"
      />
      <h2 id="promo-heading" className="relative font-heading text-title font-bold">
        Hot food, at Main Gate
      </h2>
      <p className="relative mt-1 text-sm text-hero-foreground/85">Order here, pay when you collect.</p>
      <p className="relative mt-3 flex items-center gap-1.5 text-sm font-semibold">
        <Clock className="size-4 shrink-0 text-hero-accent" aria-hidden="true" />
        <span>
          Order now · {slot.lead.toLowerCase()} <span className="text-hero-accent">{slot.time}</span>
        </span>
      </p>
      <ul className="relative mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
        <li className="inline-flex items-center gap-1 rounded-full bg-hero-foreground/10 px-2.5 py-1">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          Free delivery
        </li>
        <li className="inline-flex items-center gap-1 rounded-full bg-hero-foreground/10 px-2.5 py-1">
          <Banknote className="size-3.5 shrink-0" aria-hidden="true" />
          Cash or UPI
        </li>
      </ul>
      <div aria-hidden="true" className="absolute top-1/2 right-4 -translate-y-1/2">
        <div className="animate-float">
          <BrandLogo className="size-20 rotate-6 rounded-3xl shadow-raised ring-2 ring-hero-foreground/15" />
        </div>
      </div>
    </section>
  );
}
