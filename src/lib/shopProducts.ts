import { products as staticProducts, type Product } from "@/lib/products";
import { createServerSupabase } from "@/lib/supabase-server";

type DbProduct = {
  name: string;
  price_paise: number;
  available: boolean;
  image_url: string | null;
  ingredients: string | null;
  allergens: string | null;
  net_quantity: string | null;
  best_before: string | null;
  storage: string | null;
  manufacturer_name: string | null;
  manufacturer_address: string | null;
  manufacturer_fssai: string | null;
};

// /shop copy and photos live in lib/products.ts; price, availability and the declarations
// come from the products table (the same rows /order sells), so the two never disagree.
// If the database cannot be read, the static list is returned unchanged.
export async function getShopProducts(): Promise<Product[]> {
  try {
    const { data, error } = await createServerSupabase()
      .from("products")
      .select("name,price_paise,available,image_url,ingredients,allergens,net_quantity,best_before,storage,manufacturer_name,manufacturer_address,manufacturer_fssai");
    if (error || !data) return staticProducts;

    const byName = new Map((data as DbProduct[]).map((row) => [row.name, row]));
    return staticProducts.flatMap((p) => {
      const row = byName.get(p.name);
      if (!row) return [p];
      if (!row.available) return [];
      const manufacturer =
        row.manufacturer_name
          ? { name: row.manufacturer_name, address: row.manufacturer_address ?? "", fssai: row.manufacturer_fssai ?? "" }
          : p.declarations?.manufacturer;
      return [
        {
          ...p,
          price: `₹${(row.price_paise / 100).toLocaleString("en-IN")}`,
          priceNum: row.price_paise / 100,
          declarations: {
            ingredients: row.ingredients ?? p.declarations?.ingredients,
            allergens: row.allergens ?? p.declarations?.allergens,
            netQuantity: row.net_quantity ?? p.declarations?.netQuantity,
            bestBefore: row.best_before ?? p.declarations?.bestBefore,
            storage: row.storage ?? p.declarations?.storage,
            manufacturer,
          },
        },
      ];
    });
  } catch {
    return staticProducts;
  }
}
