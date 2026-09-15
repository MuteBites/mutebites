import { CartBar } from "@/components/cart/cart-bar";
import { HomeHeader } from "@/components/home/home-header";
import { RestaurantList } from "@/components/home/restaurant-list";
import { TabBar } from "@/components/nav/tab-bar";
import { getRestaurants } from "@/lib/data/restaurants";
import { requireProfile } from "@/lib/profile";

export default async function Home() {
  const profile = await requireProfile();
  const restaurants = await getRestaurants();

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <HomeHeader fullName={profile.full_name} email={profile.email} phone={profile.phone} />
      <RestaurantList restaurants={restaurants} />
      <CartBar profilePhone={profile.phone} hasTabBar />
      <TabBar />
    </main>
  );
}
