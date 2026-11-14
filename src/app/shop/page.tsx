import { getShopProducts } from "@/lib/shopProducts";
import { cutoffDayName, formatHour, DEFAULT_CUTOFF_HOUR_IST } from "@/lib/schedule";
import { BAKE_MENU, bakeDaysLabel, isOnUpcomingMenu, upcomingBakes } from "@/lib/menu";
import ShopClient from "./ShopClient";

export const revalidate = 60;

export default async function ShopPage() {
  const all = await getShopProducts();
  const priceOf = new Map(all.map((p) => [p.name, p.price]));
  const next = upcomingBakes(4);

  // The next four bakes (two a week, so two weeks), each with its own menu.
  const bakes = next.map((b) => ({
    date: b.label,
    orderBy: `${formatHour(DEFAULT_CUTOFF_HOUR_IST)}, ${cutoffDayName(new Date(b.iso + "T00:00:00Z").getUTCDay())}`,
    items: (BAKE_MENU[b.iso] ?? []).map((name) => ({ name, price: priceOf.get(name) ?? "" })),
  }));

  const products = all.filter((p) => isOnUpcomingMenu(p.name, next));
  const bakeDays = Object.fromEntries(
    products.flatMap((p) => {
      const label = bakeDaysLabel(p.name, next);
      return label ? [[p.name, label]] : [];
    })
  );
  return <ShopClient products={products} bakes={bakes} bakeDays={bakeDays} />;
}
