import { getShopProducts } from "@/lib/shopProducts";
import { bakeDaysLabel, everydayNames, isOnUpcomingMenu, upcomingBakes } from "@/lib/menu";
import ShopClient from "./ShopClient";

export const revalidate = 60;

export default async function ShopPage() {
  const all = await getShopProducts();
  const next = upcomingBakes(4);
  const everyday = everydayNames(next);


  const products = all.filter((p) => isOnUpcomingMenu(p.name, next));
  const bakeDays = Object.fromEntries(
    products.flatMap((p) => {
      const label = bakeDaysLabel(p.name, next);
      return label ? [[p.name, label]] : [];
    })
  );
  return <ShopClient products={products} bakeDays={bakeDays} everyday={everyday} />;
}
