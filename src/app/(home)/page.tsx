import { ViewTransition } from "react";
import { CartBar } from "@/components/cart/cart-bar";
import { HomeHeader } from "@/components/home/home-header";
import { OrderingPausedBanner } from "@/components/home/ordering-paused-banner";
import { RestaurantList } from "@/components/home/restaurant-list";
import { SignInWelcomeToast } from "@/components/home/sign-in-welcome-toast";
import { YourUsualChip } from "@/components/home/your-usual-chip";
import { getRestaurantMenuStats, getRestaurants, getSearchableDishes } from "@/lib/data/restaurants";
import { getOrderingState } from "@/lib/data/settings";
import { getDishOrderCounts, getTrendingDishes } from "@/lib/data/trending";
import { getUsualCart } from "@/lib/data/usual";
import { getRatePromptOrder } from "@/lib/data/orders";
import { RatePrompt } from "@/components/home/rate-prompt";
import { getTimeOfDayIST } from "@/lib/date";
import { getTodaysBatches } from "@/lib/data/delivery";
import { promoDelivery } from "@/lib/delivery";
import { NAV_TRANSITION, REVEAL_ENTER } from "@/lib/nav-transition";
import { requireProfile } from "@/lib/profile";
import { initialsOf } from "@/components/taste/avatar";
import { FinishProfileNudge } from "@/components/taste/finish-profile-nudge";
import { TasteSheetHost } from "@/components/taste/taste-sheet";
import { getLikedDishes } from "@/lib/data/favorites";
import { getTasteProfile, hasPlacedOrder } from "@/lib/data/taste";
import { getOffers } from "@/lib/data/offers";
import { getSpecialPriceOn } from "@/lib/data/special-price";
import { CollabOfferBanner } from "@/components/home/collab-offer-banner";
import { SPECIAL_PRICE } from "@/lib/partners";
import { DEALS } from "@/lib/deals";
import { answeredCount, cravingOrder, heartCravings } from "@/lib/taste/options";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { signedIn } = await searchParams;
  // Kicked off up front rather than after requireProfile() resolves —
  // none of these need the profile, so there's no reason to make them
  // wait behind that lookup instead of running alongside it.
  const profilePromise = requireProfile();
  const restaurantsPromise = getRestaurants();
  const menuStatsPromise = getRestaurantMenuStats();
  const dishesPromise = getSearchableDishes();
  const orderingPromise = getOrderingState();
  const trendingDishesPromise = getTrendingDishes();
  const dishOrderCountsPromise = getDishOrderCounts();
  const deliveryPromise = getTodaysBatches();

  const profile = await profilePromise;
  const [
    restaurants,
    menuStats,
    dishes,
    ordering,
    usual,
    trendingDishes,
    ratePrompt,
    dishOrderCounts,
    taste,
    placedOrder,
    liked,
    offers,
  ] = await Promise.all([
    restaurantsPromise,
    menuStatsPromise,
    dishesPromise,
    orderingPromise,
    getUsualCart(profile.id),
    trendingDishesPromise,
    getRatePromptOrder(profile.id),
    dishOrderCountsPromise,
    getTasteProfile(profile.id),
    hasPlacedOrder(profile.id),
    getLikedDishes(profile.id),
    getOffers(),
  ]);
  // Spice Magic's today-only ₹170 offer, while it's on (28 Nov 2026).
  const specialOn = await getSpecialPriceOn();
  const spiceMagic = restaurants.find((r) => r.name === SPECIAL_PRICE.restaurant && r.is_active);
  const fromHearts = heartCravings(liked);
  const initials = initialsOf(profile.full_name);
  const timeOfDay = getTimeOfDayIST();
  const orderingEnabled = ordering.open;

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <SignInWelcomeToast justSignedIn={signedIn === "1"} />
      {ratePrompt && <RatePrompt order={ratePrompt} />}
      <TasteSheetHost taste={taste} initials={initials} fromHearts={fromHearts} />
      {placedOrder && answeredCount(taste) < 3 && <FinishProfileNudge taste={taste} />}
      <ViewTransition {...NAV_TRANSITION}>
        <ViewTransition {...REVEAL_ENTER}>
          <HomeHeader fullName={profile.full_name} timeOfDay={timeOfDay} avatar={taste.avatar} />
          {usual && orderingEnabled && <YourUsualChip usual={usual} />}
          {!orderingEnabled && <OrderingPausedBanner ordering={ordering} />}
          {specialOn && spiceMagic && (
            <CollabOfferBanner
              restaurantId={spiceMagic.id}
              restaurantName={spiceMagic.name}
              title={SPECIAL_PRICE.title}
              deals={DEALS.filter((d) => d.restaurant === spiceMagic.name && offers.deals.on.includes(d.key))
                .sort((a, b) => a.min - b.min)
                .map((d) => d.title)}
            />
          )}
          <RestaurantList
            // A restaurant the admin just added (no dishes yet) stays hidden.
            restaurants={restaurants.filter((r) => dishes.some((d) => d.restaurantId === r.id))}
            orderingEnabled={orderingEnabled}
            closedChip={ordering.short}
            closedLine={ordering.headline}
            menuStats={menuStats}
            dishes={dishes}
            dishOrderCounts={dishOrderCounts}
            trendingDishes={trendingDishes}
            slot={promoDelivery(
              restaurants.filter((r) => r.is_active).map((r) => r.id),
              await deliveryPromise,
            )}
            cravings={cravingOrder(taste, fromHearts)}
          />
        </ViewTransition>
      </ViewTransition>
      <CartBar profilePhone={profile.phone} orderingEnabled={orderingEnabled} closedNote={ordering.headline} spiceLevel={taste.spiceLevel} offers={offers} hasTabBar />
    </main>
  );
}
