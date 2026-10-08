// Row shapes mirroring supabase/migrations. Only columns the UI reads.

export type Restaurant = {
  id: string;
  name: string;
  phone: string;
  description: string | null;
  cuisine_tags: string[];
  is_active: boolean;
};

export type DishCategory = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
};

export type Dish = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  price: number;
  is_veg: boolean;
  note: string | null;
  is_available: boolean;
  sort_order: number;
};

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type MenuSection = {
  /** null = dishes with no category, shown last as "More". */
  category: DishCategory | null;
  dishes: Dish[];
  /** Extras offered on this section's dishes (category_addons); empty for most restaurants. */
  addons: AddonOption[];
};

/** A paid extra on a dish (addons table) — e.g. Waffle Pops' "Ice cream". */
export type AddonOption = { id: string; name: string; price: number };
