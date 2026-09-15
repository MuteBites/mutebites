import { CartBar } from "@/components/cart/cart-bar";
import { HomeHeader } from "@/components/home/home-header";
import { OrderingPausedBanner } from "@/components/home/ordering-paused-banner";
import { RestaurantList } from "@/components/home/restaurant-list";
import { TabBar } from "@/components/nav/tab-bar";
import { getRestaurants } from "@/lib/data/restaurants";
import { getOrderingEnabled } from "@/lib/data/settings";
import { requireProfile } from "@/lib/profile";

export default async function Home() {
  const profile = await requireProfile();
  const [restaurants, orderingEnabled] = await Promise.all([getRestaurants(), getOrderingEnabled()]);

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <HomeHeader fullName={profile.full_name} email={profile.email} phone={profile.phone} />
      {!orderingEnabled && <OrderingPausedBanner />}
      <RestaurantList restaurants={restaurants} orderingEnabled={orderingEnabled} />
      <CartBar profilePhone={profile.phone} orderingEnabled={orderingEnabled} hasTabBar />
      <TabBar />
    </main>
  );
}
