"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import type { Restaurant } from "@/lib/data/types";
import { RestaurantCard } from "./restaurant-card";

export function RestaurantList({
  restaurants,
  orderingEnabled,
}: {
  restaurants: Restaurant[];
  orderingEnabled: boolean;
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const visible = q
    ? restaurants.filter((r) =>
        [r.name, r.description ?? "", ...r.cuisine_tags].some((text) =>
          text.toLowerCase().includes(q),
        ),
      )
    : restaurants;

  return (
    <>
      <label className="relative mt-6 block">
        <span className="sr-only">Search restaurants</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search biryani, juices…"
          className="h-14 w-full rounded-2xl bg-secondary pr-12 pl-13 text-lg outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-4 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-border text-foreground outline-none hover:bg-ink hover:text-ink-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <X className="size-4" />
          </button>
        )}
      </label>

      <p className="mt-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-brand-soft px-4 py-2 text-sm text-brand-soft-foreground">
        <span aria-hidden="true">📍</span>
        <span>
          Handover at <strong className="font-semibold text-foreground">VIT-AP Main Gate</strong>
        </span>
      </p>

      <div className="mt-8 flex items-baseline justify-between">
        <h2 className="text-label text-muted-foreground">
          Partner restaurants
        </h2>
        <span className="text-muted-foreground">
          {q ? `${visible.length} of ${restaurants.length}` : `${restaurants.length} near campus`}
        </span>
      </div>

      {visible.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-5">
          {visible.map((r, i) => (
            <li
              key={r.id}
              className="animate-slide-up-in"
              style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}
            >
              <RestaurantCard restaurant={r} orderingEnabled={orderingEnabled} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 text-center">
          <p className="font-heading text-xl font-bold">No match for “{query.trim()}”</p>
          <p className="mt-1 text-muted-foreground">Try a dish type like biryani or juice.</p>
        </div>
      )}
    </>
  );
}
