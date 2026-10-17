import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { OffersCard } from "@/components/admin/offers-card";
import { getAdminRestaurants } from "@/lib/data/admin";
import { getOffers } from "@/lib/data/offers";

export const metadata: Metadata = { title: "Offers · MuteBites Admin" };

/**
 * Switch discount offers on and off (app_settings.offer_*), and 10% / 20%
 * per restaurant (offer_restaurant_exclusions). While any is on, students
 * at a restaurant it covers get an "Apply discount" bar in the cart and pick one per order; place_order() re-checks the
 * offer is on and computes the discount. Ported from College Bites.
 */
export default async function AdminOffersPage() {
  const [{ active, restaurantName, excluded }, restaurants] = await Promise.all([getOffers(), getAdminRestaurants()]);
  const where = restaurantName || "the offer restaurant";

  return (
    <>
      <div>
        <BackToDashboardLink />
        <h1 className="mt-4 font-heading text-headline font-bold">Offers</h1>
        <p className="mt-1 text-muted-foreground">
          {active.length === 0
            ? "No offers on. Turn one on and students see an “Apply discount” bar in their cart."
            : `${active.length} of 3 on. Students pick one per order in their cart.`}
        </p>
      </div>

      <OffersCard
        active={active}
        restaurantName={where}
        restaurants={restaurants.map(({ id, name }) => ({ id, name }))}
        excluded={excluded}
      />

      <p className="text-sm text-muted-foreground">
        Changes apply straight away. Orders already placed keep their discount.
      </p>
    </>
  );
}
