import { getShopProducts } from "@/lib/shopProducts";
import { BAKE_MENU, bakeDaysLabel, isOnUpcomingMenu, upcomingBakes } from "@/lib/menu";
import { cutoffDayName, formatHour, DEFAULT_CUTOFF_HOUR_IST } from "@/lib/schedule";
import type { Product } from "@/lib/products";

export type Bake = { iso: string; label: string; orderBy: string; items: string[] };
export type MenuData = { products: Product[]; bakes: Bake[]; bakeDays: Record<string, string> };

// Everything the menu pages need: the products on the next two weeks of bakes, the bakes themselves,
// and "Baked for ..." labels for items that are not on every bake. Server only.
export async function getMenuData(): Promise<MenuData> {
  const next = upcomingBakes(4);
  const all = await getShopProducts();
  const products = all.filter((p) => isOnUpcomingMenu(p.name, next));
  const bakes = next.map((b) => ({
    iso: b.iso,
    label: b.label,
    orderBy: `${formatHour(DEFAULT_CUTOFF_HOUR_IST)}, ${cutoffDayName(new Date(b.iso + "T00:00:00Z").getUTCDay())}`,
    items: BAKE_MENU[b.iso] ?? products.map((p) => p.name),
  }));
  const bakeDays = Object.fromEntries(
    products.flatMap((p) => {
      const label = bakeDaysLabel(p.name, next);
      return label ? [[p.name, label]] : [];
    })
  );
  return { products, bakes, bakeDays };
}
