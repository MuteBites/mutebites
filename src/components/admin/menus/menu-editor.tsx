"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUpDown, ArrowUp, Check, ChevronRight, Pencil, Plus } from "lucide-react";
import { adminPill } from "@/components/admin/styles";
import { VegMark } from "@/components/veg-mark";
import { reorderMenu } from "@/lib/admin/menu-actions";
import type { AdminMenu, AdminMenuDish } from "@/lib/data/admin-menus";
import { formatRupees } from "@/lib/format";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { DishFormDialog, type DishDialogState } from "./dish-form-dialog";
import { SectionDialog, type SectionDialogState } from "./section-dialog";

/**
 * One restaurant's menu, editable: sections as cards with their dishes in
 * menu order. Tap a dish to edit it, "Add dish" under a section, the
 * pencil to rename a section. "Reorder" swaps prices for up / down arrows
 * on sections and dishes (fits at 320px).
 */
export function MenuEditor({
  menu,
  lockedSectionIds,
  photoDishNames,
}: {
  menu: AdminMenu;
  /** Sections the biryani offer matches by name — no rename / delete. */
  lockedSectionIds: string[];
  photoDishNames: string[];
}) {
  const [dishDialog, setDishDialog] = useState<DishDialogState>(null);
  const [sectionDialog, setSectionDialog] = useState<SectionDialogState>(null);
  const [reordering, setReordering] = useState(false);
  const [moving, startMoving] = useTransition();
  const { restaurant, sections, loose } = menu;
  const sectionOptions = sections.map(({ id, name }) => ({ id, name }));

  function move(kind: "sections" | "dishes", ids: string[], index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    startMoving(async () => {
      const result = await reorderMenu(kind, next);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={adminPill} onClick={() => setSectionDialog({ mode: "add" })}>
          <Plus className="size-4" aria-hidden="true" />
          Add section
        </button>
        {sections.length > 0 && (
          <button
            type="button"
            className={cn(adminPill, reordering && "border-transparent bg-ink text-ink-foreground hover:bg-ink")}
            aria-pressed={reordering}
            onClick={() => setReordering((v) => !v)}
          >
            {reordering ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <ArrowUpDown className="size-4" aria-hidden="true" />
            )}
            {reordering ? "Done" : "Reorder"}
          </button>
        )}
      </div>

      {sections.length === 0 && (
        <div className="rounded-[1.5rem] border border-dashed bg-card px-5 py-8 text-center shadow-card">
          <p className="font-semibold">No sections yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a section first (e.g. Biryani, Starters), then add dishes to it.
          </p>
        </div>
      )}

      {sections.map((section, si) => {
        const locked = lockedSectionIds.includes(section.id);
        const headingId = `section-${section.id}`;
        return (
          <section
            key={section.id}
            aria-labelledby={headingId}
            className="overflow-hidden rounded-[1.5rem] border bg-card shadow-card"
          >
            <div className="flex items-center gap-2 px-5 pt-4 pb-2">
              <h2 id={headingId} className="min-w-0 flex-1 font-heading text-title font-bold">
                {section.name}
              </h2>
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-sm font-semibold text-secondary-foreground tabular-nums">
                {section.dishes.length}
              </span>
              {reordering ? (
                <MoveButtons
                  label={section.name}
                  disabled={moving}
                  first={si === 0}
                  last={si === sections.length - 1}
                  onMove={(by) => move("sections", sections.map((s) => s.id), si, by)}
                />
              ) : (
                <button
                  type="button"
                  aria-label={`Edit section ${section.name}`}
                  onClick={() =>
                    setSectionDialog({
                      mode: "edit",
                      section: { id: section.id, name: section.name, dishCount: section.dishes.length, locked },
                    })
                  }
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            {section.dishes.length === 0 ? (
              <p className="px-5 pb-2 text-sm text-muted-foreground">No dishes yet.</p>
            ) : (
              <ul className="divide-y">
                {section.dishes.map((dish, di) => (
                  <DishRow
                    key={dish.id}
                    dish={dish}
                    reordering={reordering}
                    moving={moving}
                    first={di === 0}
                    last={di === section.dishes.length - 1}
                    onEdit={() => setDishDialog({ mode: "edit", dish })}
                    onMove={(by) => move("dishes", section.dishes.map((d) => d.id), di, by)}
                  />
                ))}
              </ul>
            )}

            {!reordering && (
              <div className="border-t px-3 py-2">
                <button
                  type="button"
                  onClick={() => setDishDialog({ mode: "add", sectionId: section.id })}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-primary outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add dish to {section.name}
                </button>
              </div>
            )}
          </section>
        );
      })}

      {loose.length > 0 && (
        <section aria-labelledby="section-loose" className="overflow-hidden rounded-[1.5rem] border bg-card shadow-card">
          <div className="px-5 pt-4 pb-2">
            <h2 id="section-loose" className="font-heading text-title font-bold">
              Not in a section
            </h2>
            <p className="text-sm text-muted-foreground">Tap one to give it a section.</p>
          </div>
          <ul className="divide-y">
            {loose.map((dish) => (
              <DishRow
                key={dish.id}
                dish={dish}
                reordering={false}
                moving={false}
                first
                last
                onEdit={() => setDishDialog({ mode: "edit", dish })}
                onMove={() => {}}
              />
            ))}
          </ul>
        </section>
      )}

      <DishFormDialog
        state={dishDialog}
        onClose={() => setDishDialog(null)}
        restaurantId={restaurant.id}
        sections={sectionOptions}
        photoDishNames={photoDishNames}
      />
      <SectionDialog state={sectionDialog} onClose={() => setSectionDialog(null)} restaurantId={restaurant.id} />
    </>
  );
}

function DishRow({
  dish,
  reordering,
  moving,
  first,
  last,
  onEdit,
  onMove,
}: {
  dish: AdminMenuDish;
  reordering: boolean;
  moving: boolean;
  first: boolean;
  last: boolean;
  onEdit: () => void;
  onMove: (by: -1 | 1) => void;
}) {
  const body = (
    <>
      <VegMark isVeg={dish.isVeg} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className={cn("block leading-snug font-medium", !dish.isAvailable && "text-muted-foreground line-through")}>
          {dish.name}
        </span>
        {(dish.note || !dish.isAvailable) && (
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {!dish.isAvailable && (
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                Sold out
              </span>
            )}
            {dish.note}
          </span>
        )}
      </span>
    </>
  );

  if (reordering) {
    return (
      <li className="flex items-center gap-3 px-5 py-2">
        {body}
        <MoveButtons label={dish.name} disabled={moving} first={first} last={last} onMove={onMove} />
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${dish.name}`}
        className="flex w-full items-start gap-3 px-5 py-3 text-left outline-none hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:ring-inset"
      >
        {body}
        <span className="shrink-0 font-semibold text-primary tabular-nums">{formatRupees(dish.price)}</span>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </li>
  );
}

function MoveButtons({
  label,
  disabled,
  first,
  last,
  onMove,
}: {
  label: string;
  disabled: boolean;
  first: boolean;
  last: boolean;
  onMove: (by: -1 | 1) => void;
}) {
  const cls =
    "flex size-10 items-center justify-center rounded-full border bg-card shadow-card outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-40";
  return (
    <span className="flex shrink-0 gap-1.5">
      <button type="button" aria-label={`Move ${label} up`} disabled={disabled || first} onClick={() => onMove(-1)} className={cls}>
        <ArrowUp className="size-4" aria-hidden="true" />
      </button>
      <button type="button" aria-label={`Move ${label} down`} disabled={disabled || last} onClick={() => onMove(1)} className={cls}>
        <ArrowDown className="size-4" aria-hidden="true" />
      </button>
    </span>
  );
}
