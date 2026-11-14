import { products as staticProducts, type Product } from "@/lib/products";
import { createServerSupabase } from "@/lib/supabase-server";

type DbProduct = {
  id: string;
  name: string;
  category: string;
  description: string | null;
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
      .select("id,name,category,description,price_paise,available,image_url,ingredients,allergens,net_quantity,best_before,storage,manufacturer_name,manufacturer_address,manufacturer_fssai");
    if (error || !data) return staticProducts;

    const rows = data as DbProduct[];
    const byName = new Map(rows.map((row) => [row.name, row]));
    const known = new Set(staticProducts.map((p) => p.name));
    // Products added in the OMS that have no copy or photo in lib/products.ts yet.
    const extra: Product[] = rows
      .filter((row) => row.available && !known.has(row.name))
      .map((row, i) => ({
        id: 1000 + i,
        dbId: row.id,
        name: row.name,
        category: row.category,
        price: `₹${(row.price_paise / 100).toLocaleString("en-IN")}`,
        priceNum: row.price_paise / 100,
        image: row.image_url || "/product_img/6-top-shot.jpg",
        bgColor: "bg-[#F5EDD7]",
        desc: row.description ?? "",
        longDesc: row.description ?? "",
        details: [],
        leadTime: "",
        declarations: {
          ingredients: row.ingredients ?? undefined,
          allergens: row.allergens ?? undefined,
          netQuantity: row.net_quantity ?? undefined,
          bestBefore: row.best_before ?? undefined,
          storage: row.storage ?? undefined,
          manufacturer: row.manufacturer_name
            ? { name: row.manufacturer_name, address: row.manufacturer_address ?? "", fssai: row.manufacturer_fssai ?? "" }
            : undefined,
        },
      }));
    const listed = staticProducts.flatMap((p) => {
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
          dbId: row.id,
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
    return [...listed, ...extra];
  } catch {
    return staticProducts;
  }
}
