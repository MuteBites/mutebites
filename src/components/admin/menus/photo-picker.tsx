"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, ImageOff, Loader2 } from "lucide-react";
import { setDishPhoto, setRestaurantCover } from "@/lib/admin/menu-actions";
import { isUploadedPhoto } from "@/lib/data/dish-photos";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024; // the bucket's limit

/** Longest side, in px, the browser shrinks a photo to before uploading. */
const MAX_SIDE = { dish: 900, cover: 1600 } as const;

/**
 * Shrinks a picked photo in the browser (canvas) to WebP — or JPEG where
 * the browser can't encode WebP (Safari) — so uploads stay ~100–300 KB.
 */
async function shrink(file: File, maxSide: number): Promise<{ blob: Blob; ext: "webp" | "jpg" }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await encode("image/webp", 0.82);
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp" };
  const jpeg = await encode("image/jpeg", 0.85);
  if (!jpeg) throw new Error("encode");
  return { blob: jpeg, ext: "jpg" };
}

/**
 * The photo box in the dish and restaurant dialogs: shows the photo
 * students see (uploaded, else the developer's name-matched file), with
 * Add / Change and — for an uploaded one — Remove. Saves on its own,
 * straight away, separate from the dialog's Save.
 */
export function PhotoPicker({
  kind,
  id,
  src,
  uploaded,
  label,
}: {
  kind: "dish" | "cover";
  id: string;
  /** What students see now, or undefined for the placeholder. */
  src: string | undefined;
  /** Whether `src` is an admin upload (only those can be removed here). */
  uploaded: boolean;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ src: string | undefined; uploaded: boolean } | null>(null);
  const [busy, startBusy] = useTransition();
  const shown = preview ?? { src, uploaded };

  function save(path: string | null) {
    return kind === "dish" ? setDishPhoto(id, path) : setRestaurantCover(id, path);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // picking the same file again still fires
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("That isn't a photo.");
      return;
    }
    startBusy(async () => {
      let shrunk: Awaited<ReturnType<typeof shrink>>;
      try {
        shrunk = await shrink(file, MAX_SIDE[kind]);
      } catch {
        toast.error("Couldn't read that photo. Try a JPG or PNG.");
        return;
      }
      if (shrunk.blob.size > MAX_BYTES) {
        toast.error("That photo is too big even after shrinking. Try another.");
        return;
      }
      const path = `${kind === "dish" ? "dishes" : "covers"}/${id}-${Date.now()}.${shrunk.ext}`;
      const bucket = createClient().storage.from("menu-photos");
      const { error } = await bucket.upload(path, shrunk.blob, {
        contentType: shrunk.ext === "webp" ? "image/webp" : "image/jpeg",
        cacheControl: "31536000", // every upload has a new name
        upsert: false,
      });
      if (error) {
        toast.error("Upload failed. Check your connection and try again.");
        return;
      }
      const result = await save(path);
      if (!result.ok) {
        await bucket.remove([path]);
        toast.error(result.error);
        return;
      }
      setPreview({ src: URL.createObjectURL(shrunk.blob), uploaded: true });
      toast.success("Photo saved. Students see it now.");
    });
  }

  function remove() {
    startBusy(async () => {
      const result = await save(null);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      // The developer's name-matched file (if any) shows again after the refresh.
      setPreview({ src: undefined, uploaded: false });
      toast.success("Photo removed.");
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-label text-muted-foreground">{label}</p>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "relative shrink-0 overflow-hidden rounded-2xl bg-stripes",
            kind === "dish" ? "size-20" : "h-20 w-32",
          )}
        >
          {shown.src && (
            <Image
              src={shown.src}
              alt=""
              fill
              sizes="128px"
              unoptimized={isUploadedPhoto(shown.src) || shown.src.startsWith("blob:")}
              className="object-cover"
            />
          )}
          {!shown.src && (
            <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ImageOff className="size-5" aria-hidden="true" />
              <span className="sr-only">No photo</span>
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-card/75">
              <Loader2 className="size-5 animate-spin text-foreground" aria-hidden="true" />
            </span>
          )}
        </span>
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex h-10 items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold shadow-card outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-50"
          >
            <Camera className="size-4" aria-hidden="true" />
            {shown.src ? "Change photo" : "Add photo"}
          </button>
          {shown.uploaded && (
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="h-8 rounded-full px-2 text-sm font-semibold text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-50"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={onPick} />
    </div>
  );
}
