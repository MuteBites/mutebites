"use client";

import { Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** The developer, credited in the About popup and at the foot of every page. */
export const DEVELOPER = {
  name: "Naga Adithya",
  phone: "+919032563455",
  email: "nagaadithya999@gmail.com",
};

/**
 * The developer's name as a quiet button: a dotted underline (solid on
 * hover) so it reads as tappable; it toggles <DeveloperContact>.
 */
export function DeveloperName({
  open,
  onToggle,
  controls,
}: {
  open: boolean;
  onToggle: () => void;
  controls: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className="rounded-sm font-semibold text-foreground/80 underline decoration-dotted decoration-1 underline-offset-4 outline-none hover:text-foreground hover:decoration-solid focus-visible:ring-2 focus-visible:ring-ring/80"
    >
      {DEVELOPER.name}
    </button>
  );
}

const LINK =
  "dev-contact-item flex items-center gap-1 rounded-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/80";

/**
 * "WhatsApp · Mail" (no call link, by the developer's choice), folding open under the name: the row grows
 * (grid-rows 0fr → 1fr) and its two links rise in one after another.
 */
export function DeveloperContact({ id, open }: { id: string; open: boolean }) {
  const items = [
    { href: `https://wa.me/${DEVELOPER.phone.replace("+", "")}`, icon: MessageCircle, label: "WhatsApp", external: true },
    { href: `mailto:${DEVELOPER.email}`, icon: Mail, label: "Mail", external: false },
  ];
  return (
    <div
      id={id}
      className={cn(
        "grid transition-[grid-template-rows] duration-(--dur-base) ease-out-expo",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden">
        <p className="flex items-center justify-center gap-3 pt-2" data-open={open ? "" : undefined}>
          {items.map(({ href, icon: Icon, label, external }, i) => (
            <span key={label} className="contents">
              {i > 0 && (
                <span aria-hidden="true" className="dev-contact-item" style={{ "--i": i * 2 - 1 } as React.CSSProperties}>
                  ·
                </span>
              )}
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                tabIndex={open ? 0 : -1}
                className={LINK}
                style={{ "--i": i * 2 } as React.CSSProperties}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </a>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
