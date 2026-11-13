import { getShopProducts } from "@/lib/shopProducts";
import { getAvailableDeliverySlots, deliveryDateISO } from "@/lib/dateUtils";
import { cutoffDayName, formatHour, DEFAULT_CUTOFF_HOUR_IST } from "@/lib/schedule";
import { BAKE_MENU } from "@/lib/menu";
import ShopClient from "./ShopClient";

export const revalidate = 60;

export default async function ShopPage() {
  // Two delivery days a week, so the next four bakes cover two weeks.
  const bakes = getAvailableDeliverySlots(4).map((d) => ({
    date: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
    orderBy: `${formatHour(DEFAULT_CUTOFF_HOUR_IST)}, ${cutoffDayName(d.getUTCDay())}`,
    flavours: BAKE_MENU[deliveryDateISO(d)] ?? [],
  }));
  return <ShopClient products={await getShopProducts()} bakes={bakes} />;
}
