"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createSection, deleteSection, renameSection } from "@/lib/admin/menu-actions";
import { MENU_LIMITS } from "@/lib/admin/menu-limits";
import { toast } from "@/lib/toast/store";
import { Field, fieldInput } from "./fields";

export type SectionDialogState =
  | { mode: "add" }
  | { mode: "edit"; section: { id: string; name: string; dishCount: number; locked: boolean } }
  | null;

/** Add a menu section, or rename / delete (only when empty) one. */
export function SectionDialog({
  state,
  onClose,
  restaurantId,
}: {
  state: SectionDialogState;
  onClose: () => void;
  restaurantId: string;
}) {
  const key = state ? (state.mode === "edit" ? state.section.id : "add") : "closed";
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {state && <SectionForm key={key} state={state} onClose={onClose} restaurantId={restaurantId} />}
      </DialogContent>
    </Dialog>
  );
}

function SectionForm({
  state,
  onClose,
  restaurantId,
}: {
  state: NonNullable<SectionDialogState>;
  onClose: () => void;
  restaurantId: string;
}) {
  const section = state.mode === "edit" ? state.section : null;
  const [name, setName] = useState(section?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startSaving(async () => {
      const result = section ? await renameSection(section.id, name) : await createSection(restaurantId, name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(section ? "Section renamed." : `${name.trim()} added.`);
      onClose();
    });
  }

  function remove() {
    if (!section) return;
    startSaving(async () => {
      const result = await deleteSection(section.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(`${section.name} deleted.`);
      onClose();
    });
  }

  return (
    <>
      <DialogTitle>{section ? "Edit section" : "Add a section"}</DialogTitle>
      <DialogDescription className="mt-1">
        {section?.locked
          ? "The biryani offer finds its dishes by this section's name, so it stays as it is."
          : "Sections group the menu, e.g. Veg Starters, Biryani, Desserts."}
      </DialogDescription>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <Field id="s-name" label="Section name">
          <input
            id="s-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MENU_LIMITS.section}
            required
            disabled={section?.locked}
            autoComplete="off"
            className={fieldInput}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        {!section?.locked && (
          <Button type="submit" disabled={saving} className="h-12 text-base font-semibold">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {section ? "Save" : "Add section"}
          </Button>
        )}

        {section && !section.locked && (
          <Button
            type="button"
            variant="ghost"
            className="h-10 text-destructive"
            disabled={saving || section.dishCount > 0}
            onClick={remove}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {section.dishCount > 0 ? "Empty the section to delete it" : "Delete section"}
          </Button>
        )}
      </form>
    </>
  );
}
