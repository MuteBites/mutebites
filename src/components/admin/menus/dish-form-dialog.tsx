"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createDish, deleteDish, updateDish } from "@/lib/admin/menu-actions";
import { MENU_LIMITS } from "@/lib/admin/menu-limits";
import type { AdminMenuDish } from "@/lib/data/admin-menus";
import { getDishPhoto, menuPhotoUrl } from "@/lib/data/dish-photos";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { Choice, Field, fieldInput } from "./fields";
import { PhotoPicker } from "./photo-picker";

export type DishDialogState = { mode: "add"; sectionId: string } | { mode: "edit"; dish: AdminMenuDish } | null;

/**
 * Add a dish to a section, or edit / delete one. Name, price, veg or not,
 * section, an optional note ("Thursday only") and whether it's on sale.
 */
export function DishFormDialog({
  state,
  onClose,
  restaurantId,
  restaurantName,
  sections,
  photoDishNames,
}: {
  state: DishDialogState;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  sections: { id: string; name: string }[];
  /** Dishes that have a photo — matched by name, so renaming hides it. */
  photoDishNames: string[];
}) {
  // Remount per dish / section so the fields start from it.
  const key = state ? (state.mode === "edit" ? state.dish.id : `add-${state.sectionId}`) : "closed";
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        {state && (
          <DishForm
            key={key}
            state={state}
            onClose={onClose}
            restaurantId={restaurantId}
            restaurantName={restaurantName}
            sections={sections}
            photoDishNames={photoDishNames}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DishForm({
  state,
  onClose,
  restaurantId,
  restaurantName,
  sections,
  photoDishNames,
}: {
  state: NonNullable<DishDialogState>;
  onClose: () => void;
  restaurantId: string;
  restaurantName: string;
  sections: { id: string; name: string }[];
  photoDishNames: string[];
}) {
  const dish = state.mode === "edit" ? state.dish : null;
  const [name, setName] = useState(dish?.name ?? "");
  const [price, setPrice] = useState(dish ? String(dish.price) : "");
  const [diet, setDiet] = useState<"veg" | "nonveg">(dish && !dish.isVeg ? "nonveg" : "veg");
  const [sectionId, setSectionId] = useState(dish?.categoryId ?? (state.mode === "add" ? state.sectionId : ""));
  const [note, setNote] = useState(dish?.note ?? "");
  const [sale, setSale] = useState<"on" | "off">(dish && !dish.isAvailable ? "off" : "on");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSaving] = useTransition();
  // An uploaded photo follows the dish; a developer's file is matched by name.
  const renaming = !!dish && !dish.photoPath && name.trim() !== dish.name && photoDishNames.includes(dish.name);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      name,
      price: Number(price.replace(/[₹,\s]/g, "")),
      isVeg: diet === "veg",
      note,
      categoryId: sectionId,
      isAvailable: sale === "on",
    };
    startSaving(async () => {
      const result = dish ? await updateDish(dish.id, input) : await createDish(restaurantId, input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(dish ? "Dish saved." : `${name.trim()} added.`);
      onClose();
    });
  }

  function remove() {
    if (!dish) return;
    startSaving(async () => {
      const result = await deleteDish(dish.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(`${dish.name} deleted.`);
      onClose();
    });
  }

  return (
    <>
      <DialogTitle>{dish ? "Edit dish" : "Add a dish"}</DialogTitle>
      <DialogDescription className="mt-1">Changes show on the student menu straight away.</DialogDescription>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        {dish ? (
          <PhotoPicker
            kind="dish"
            id={dish.id}
            label="Photo"
            src={dish.photoPath ? menuPhotoUrl(dish.photoPath) : getDishPhoto(restaurantName, dish.name)}
            uploaded={!!dish.photoPath}
          />
        ) : (
          <p className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            Add the dish first, then tap it to add a photo.
          </p>
        )}
        <Field
          id="d-name"
          label="Name"
          hint={renaming ? "Its photo was added by the developer and is matched by name, so renaming hides it. Upload one above to keep a photo." : undefined}
        >
          <input
            id="d-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MENU_LIMITS.name}
            required
            autoComplete="off"
            className={fieldInput}
          />
        </Field>
        <Field id="d-price" label="Price (₹)">
          <input
            id="d-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            required
            autoComplete="off"
            placeholder="e.g. 180"
            className={cn(fieldInput, "tabular-nums")}
          />
        </Field>
        <Choice
          label="Type"
          value={diet}
          onChange={setDiet}
          options={[
            { value: "veg", label: "Veg" },
            { value: "nonveg", label: "Non-veg" },
          ]}
        />
        <Field id="d-section" label="Section">
          <select
            id="d-section"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className={cn(fieldInput, "appearance-none")}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="d-note" label="Note (optional)" hint="Shown under the dish, e.g. “Thursday only”">
          <input
            id="d-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={MENU_LIMITS.note}
            autoComplete="off"
            className={fieldInput}
          />
        </Field>
        <Choice
          label="Availability"
          value={sale}
          onChange={setSale}
          options={[
            { value: "on", label: "On sale" },
            { value: "off", label: "Sold out" },
          ]}
        />

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={saving} className="mt-1 h-12 text-base font-semibold">
          {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {dish ? "Save dish" : "Add dish"}
        </Button>

        {dish &&
          (confirmDelete ? (
            <div className="rounded-2xl bg-destructive/10 p-4">
              <p className="text-sm font-semibold text-destructive">Delete {dish.name} for good?</p>
              <p className="mt-0.5 text-sm text-foreground">
                Past orders keep it. To hide it for a while, mark it sold out instead.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="h-10" onClick={() => setConfirmDelete(false)}>
                  Keep it
                </Button>
                <Button type="button" variant="danger" className="h-10" disabled={saving} onClick={remove}>
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="h-10 text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete dish
            </Button>
          ))}
      </form>
    </>
  );
}
