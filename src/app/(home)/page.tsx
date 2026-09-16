import { ViewTransition } from "react";
import { CartBar } from "@/components/cart/cart-bar";
import { HomeHeader } from "@/components/home/home-header";
import { OrderingPausedBanner } from "@/components/home/ordering-paused-banner";
import { RestaurantList } from "@/components/home/restaurant-list";
import { ThursdayNudge } from "@/components/home/thursday-nudge";
import { YourUsualChip } from "@/components/home/your-usual-chip";
import { TabBar } from "@/components/nav/tab-bar";
import { getRestaurants, getThursdaySpecial } from "@/lib/data/restaurants";
import { getOrderingEnabled } from "@/lib/data/settings";
import { getTrendingDishes } from "@/lib/data/trending";
import { getUsualCart } from "@/lib/data/usual";
import { getTimeOfDayIST, isThursdayIST } from "@/lib/date";
import { NAV_TRANSITION, REVEAL_ENTER } from "@/lib/nav-transition";
import { requireProfile } from "@/lib/profile";

export default async function Home() {
  const profile = await requireProfile();
  const [restaurants, orderingEnabled, usual, thursdaySpecial, trendingDishes] = await Promise.all([
    getRestaurants(),
    getOrderingEnabled(),
    getUsualCart(profile.id),
    isThursdayIST() ? getThursdaySpecial() : Promise.resolve(null),
    getTrendingDishes(),
  ]);
  const timeOfDay = getTimeOfDayIST();

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <ViewTransition {...NAV_TRANSITION}>
        <ViewTransition {...REVEAL_ENTER}>
          <HomeHeader fullName={profile.full_name} timeOfDay={timeOfDay} trendingDishes={trendingDishes} />
          {usual && orderingEnabled && <YourUsualChip usual={usual} />}
          {thursdaySpecial && <ThursdayNudge special={thursdaySpecial} />}
          {!orderingEnabled && <OrderingPausedBanner />}
          <RestaurantList restaurants={restaurants} orderingEnabled={orderingEnabled} />
        </ViewTransition>
      </ViewTransition>
      <CartBar profilePhone={profile.phone} orderingEnabled={orderingEnabled} hasTabBar />
      <TabBar />
    </main>
  );
}
