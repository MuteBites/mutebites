import type { CSSProperties } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import "./login.css";

/*
 * Real dishes floating in the sky, framed like photo prints. Sized by the
 * sky's HEIGHT (aspect 4/5), so on a short phone they shrink with it. Each
 * drifts on its own clock (--drift) after popping in (--card-delay).
 * Literal paths: renaming one of these photos means updating it here.
 */
const CARDS = [
  {
    src: "/MuteBites/Bheemasena/Chicken dum biryani.jpg",
    className: "left-[14%] top-[6%] h-[42%] -rotate-8",
    style: { "--card-delay": "0.45s", "--drift": "7s" },
  },
  {
    src: "/MuteBites/MuteBites Chinese/Chicken noodles.jpg",
    className: "right-[10%] top-[10%] h-[38%] rotate-7",
    style: { "--card-delay": "0.6s", "--drift": "8.5s" },
  },
  {
    src: "/MuteBites/Bheemasena/Paneer 65.jpg",
    className: "left-[45%] top-[2%] h-[28%] rotate-3",
    style: { "--card-delay": "0.75s", "--drift": "6s" },
  },
] as const;

/* Coffee beans in the air around the tumbler. */
const BEANS = [
  "left-[5%] top-[50%] size-6 -rotate-30",
  "right-[6%] top-[56%] size-5 rotate-25",
  "left-[30%] top-[42%] size-4 rotate-60",
  "right-[28%] top-[40%] size-4 -rotate-12",
] as const;

/**
 * Desi Kaapi's sign-in scene — College Bites' Kaapi scene as is: a sky over
 * a wooden table, a tumbler of filter coffee in its davara with steam
 * rising, coffee beans drifting, and three MuteBites dishes floating as
 * photo prints. Fills its parent (absolute inset-0); shown only under Kaapi
 * by the caller (only-kaapi), so the photos load lazily and never for Plum.
 * Styles and motion in ./login.css. Decorative.
 */
export function KaapiLoginScene() {
  return (
    <div aria-hidden="true" className="login-sky absolute inset-0 isolate overflow-hidden">
      {/* The app column, so the scene and dishes frame the sheet below at
          any screen width while the sky and table run edge to edge. No
          transform here: that would make it its own layer, and the table
          (painted after it) would cover the tumbler and dishes. */}
      <div className="absolute inset-0 mx-auto w-full max-w-md">
        <div className="login-glow absolute left-1/2 aspect-[2/1] w-[130%]" />
        {BEANS.map((b) => (
          <svg key={b} viewBox="0 0 20 28" className={cn("login-bean absolute", b)}>
            <ellipse cx="10" cy="14" rx="9" ry="13" fill="var(--bean)" />
            <path d="M10 2c-4 6 4 18 0 24" stroke="var(--bean-line)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        ))}
        <svg viewBox="0 0 120 120" className="login-tumbler absolute left-1/2 z-10 w-[40%]">
          <g fill="none" stroke="var(--steam)" strokeWidth="4" strokeLinecap="round">
            <path className="motif-steam" d="M46 34c-8-8 8-13 0-24" />
            <path className="motif-steam [animation-delay:-1.1s]" d="M60 30c-8-8 8-13 0-24" />
            <path className="motif-steam [animation-delay:-2.2s]" d="M74 34c-8-8 8-13 0-24" />
          </g>
          <path d="M38 44h44l-6 46H44z" fill="var(--art)" />
          <path d="M40 56h40" stroke="var(--art-light)" strokeWidth="3" />
          <path d="M14 90h92c-3 16-20 24-46 24s-43-8-46-24z" fill="var(--art)" />
          <path d="M20 94h80" stroke="var(--art-light)" strokeWidth="2.5" opacity="0.7" />
        </svg>
        {CARDS.map((card) => (
          <div
            key={card.src}
            className={cn("login-card absolute z-20 aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-secondary", card.className)}
            style={card.style as CSSProperties}
          >
            <Image src={card.src} alt="" fill sizes="160px" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="login-table absolute inset-x-0 bottom-0" />
    </div>
  );
}
