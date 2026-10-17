"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Construction, Loader2, Skull, type LucideIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconTile } from "@/components/icon-tile";
import { setSiteMode } from "@/lib/dev/actions";
import { formatOrderTimestamp } from "@/lib/date";
import type { SiteMode } from "@/lib/site-status/offline-page";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

const MAX_MESSAGE = 300;

const CONFIRM: Record<SiteMode, { title: string; body: string; action: string }> = {
  killed: {
    title: "Kill the whole site?",
    body: "Every page and every action stops for everyone but developers — students and admins get a bare “This site can’t be reached” error until you switch it off. Nothing is deleted.",
    action: "Kill site",
  },
  maintenance: {
    title: "Turn on maintenance mode?",
    body: "Everyone but developers sees the “We’re cooking up something new” screen, with your message, until you switch it off. No one can order meanwhile.",
    action: "Start maintenance",
  },
  live: {
    title: "Bring the site back?",
    body: "Everything works normally again straight away. Open pages pick it up within 30 seconds.",
    action: "Bring it back",
  },
};

/**
 * The two developer switches. They're one three-way state underneath
 * (site_status.mode), so turning one on turns the other off; turning
 * either off sets the site live. Every change confirms first.
 */
export function SiteSwitches({
  mode,
  message,
  updatedAt,
}: {
  mode: SiteMode;
  message: string | null;
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(message ?? "");
  const [target, setTarget] = useState<SiteMode | null>(null);
  const [pending, startTransition] = useTransition();

  function save(next: SiteMode, onDone?: () => void) {
    startTransition(async () => {
      const result = await setSiteMode(next, next === "maintenance" ? draft : null);
      if (result.ok) {
        toast.success(
          next === "live" ? "The site is back." : next === "killed" ? "The site is killed." : "Maintenance mode is on.",
        );
        onDone?.();
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const status =
    mode === "live" ? "The site is live" : mode === "killed" ? "The site is killed" : "Maintenance mode is on";

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "flex items-center gap-3 rounded-3xl px-5 py-4",
          mode === "live" ? "bg-success-soft text-success" : "bg-destructive text-destructive-foreground",
        )}
        role="status"
      >
        <span className="size-2.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold">{status}</p>
          {updatedAt && <p className="text-sm opacity-90">Changed {formatOrderTimestamp(updatedAt)}</p>}
        </div>
      </div>

      <SwitchCard
        id="kill"
        icon={Skull}
        title="Kill switch"
        body="Stops the entire website for everyone but developers, with a plain server-error screen."
        checked={mode === "killed"}
        disabled={pending}
        onToggle={() => setTarget(mode === "killed" ? "live" : "killed")}
      />

      <SwitchCard
        id="maintenance"
        icon={Construction}
        title="Maintenance mode"
        body="Shows a friendly “we’re updating MuteBites” screen instead, with your note below."
        checked={mode === "maintenance"}
        disabled={pending}
        onToggle={() => setTarget(mode === "maintenance" ? "live" : "maintenance")}
      >
        <label htmlFor="site-message" className="text-label text-muted-foreground">
          Message on the maintenance screen (optional)
        </label>
        <Textarea
          id="site-message"
          className="mt-1.5"
          rows={3}
          maxLength={MAX_MESSAGE}
          placeholder="Adding new restaurants — back by 8 PM."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {draft.length}/{MAX_MESSAGE}
          </p>
          {mode === "maintenance" && draft.trim() !== (message ?? "") && (
            <Button size="sm" disabled={pending} onClick={() => save("maintenance")}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Update message
            </Button>
          )}
        </div>
      </SwitchCard>

      <p className="text-sm text-muted-foreground">
        /dev, /login and /auth stay reachable while the site is down, so you can always sign in and switch it back.
      </p>

      <AlertDialog open={target !== null} onOpenChange={(next) => !next && !pending && setTarget(null)}>
        <AlertDialogContent>
          {target && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{CONFIRM[target].title}</AlertDialogTitle>
                <AlertDialogDescription>{CONFIRM[target].body}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending}
                  onClick={() => save(target, () => setTarget(null))}
                  variant={target === "live" ? "success" : "danger"}
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  {CONFIRM[target].action}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SwitchCard({
  id,
  icon: Icon,
  title,
  body,
  checked,
  disabled,
  onToggle,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <IconTile>
          <Icon className="size-5" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="font-heading text-title font-bold">
            {title}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-title`}
          disabled={disabled}
          onClick={onToggle}
          className={cn(
            "relative mt-1 inline-flex h-8 w-14 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-60",
            checked ? "surface-primary glow-amber bg-primary" : "bg-secondary",
          )}
        >
          <span
            className={cn(
              "size-6 rounded-full bg-white shadow transition-transform",
              checked ? "translate-x-7" : "translate-x-1",
            )}
          />
        </button>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}
