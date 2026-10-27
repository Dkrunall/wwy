import { getShopProducts } from "@/lib/shopProducts";
import ShopClient from "./ShopClient";

export const revalidate = 60;

export default async function ShopPage() {
  return <ShopClient products={await getShopProducts()} />;
}
