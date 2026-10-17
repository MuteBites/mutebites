"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createRestaurant, updateRestaurant } from "@/lib/admin/menu-actions";
import { MENU_LIMITS } from "@/lib/admin/menu-limits";
import { formatStoredMobile } from "@/lib/phone";
import { SUPPORT_PHONE } from "@/lib/support";
import { toast } from "@/lib/toast/store";
import { getRestaurantCoverPhoto, menuPhotoUrl } from "@/lib/data/dish-photos";
import { Field, fieldInput } from "./fields";
import { PhotoPicker } from "./photo-picker";

type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  cuisineTags: string[];
  phone: string;
  coverPath: string | null;
};

/**
 * Add a restaurant (no `restaurant`) or edit one's details. A new one
 * starts switched off — the admin turns it on from the dashboard once its
 * menu is ready — and opens straight in the menu editor.
 */
export function RestaurantFormDialog({
  restaurant,
  hasPhotos = false,
  trigger,
}: {
  restaurant?: Restaurant;
  /** It has developer-added photos, matched by name, so renaming hides them. */
  hasPhotos?: boolean;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(restaurant?.name ?? "");
  const [description, setDescription] = useState(restaurant?.description ?? "");
  const [tags, setTags] = useState(restaurant?.cuisineTags.join(", ") ?? "");
  const [phone, setPhone] = useState(
    restaurant && restaurant.phone !== SUPPORT_PHONE ? restaurant.phone.replace(/^\+91/, "") : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const renaming = !!restaurant && name.trim() !== restaurant.name;

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setName(restaurant?.name ?? "");
      setDescription(restaurant?.description ?? "");
      setTags(restaurant?.cuisineTags.join(", ") ?? "");
      setPhone(restaurant && restaurant.phone !== SUPPORT_PHONE ? restaurant.phone.replace(/^\+91/, "") : "");
      setError(null);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = {
      name,
      description,
      cuisineTags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      phone,
    };
    startSaving(async () => {
      const result = restaurant ? await updateRestaurant(restaurant.id, input) : await createRestaurant(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (restaurant) {
        toast.success("Saved.");
      } else {
        toast.success(`${name.trim()} added. Now add its menu.`);
        router.push(`/admin/menus/${result.id}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogTitle>{restaurant ? "Restaurant details" : "Add a restaurant"}</DialogTitle>
        <DialogDescription className="mt-1">
          {restaurant
            ? "Students see the name, description and cuisine tags."
            : "It starts switched off. Add its menu, then turn it on from the dashboard."}
        </DialogDescription>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          {restaurant && (
            <PhotoPicker
              kind="cover"
              id={restaurant.id}
              label="Cover photo"
              src={restaurant.coverPath ? menuPhotoUrl(restaurant.coverPath) : getRestaurantCoverPhoto(restaurant.name)}
              uploaded={!!restaurant.coverPath}
            />
          )}
          <Field
            id="r-name"
            label="Name"
            hint={
              renaming && hasPhotos
                ? "Its developer-added photos are matched by name, so renaming hides them (uploaded ones stay). Re-upload them here, or ask the developer."
                : undefined
            }
          >
            <input
              id="r-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MENU_LIMITS.name}
              required
              autoComplete="off"
              className={fieldInput}
            />
          </Field>
          <Field id="r-desc" label="Description (optional)">
            <Textarea
              id="r-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MENU_LIMITS.description}
              rows={2}
              className="min-h-20 rounded-xl bg-card px-3.5 py-2.5 text-base md:text-base"
            />
          </Field>
          <Field id="r-tags" label="Cuisine tags" hint="Separate with commas, e.g. Biryani, Starters">
            <input
              id="r-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              autoComplete="off"
              className={fieldInput}
            />
          </Field>
          <Field
            id="r-phone"
            label="Restaurant phone (optional)"
            hint={`Leave empty to use the MuteBites number, ${formatStoredMobile(SUPPORT_PHONE)}.`}
          >
            <input
              id="r-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="off"
              placeholder="10-digit mobile number"
              className={fieldInput}
            />
          </Field>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={saving} className="mt-1 h-12 text-base font-semibold">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {restaurant ? "Save" : "Add restaurant"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
