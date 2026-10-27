import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase-server";
import { OMS_COOKIE, verifyOmsToken } from "@/lib/omsAuth";

// Admin-only product writes. The OMS used to write straight to Supabase with the anon key;
// that needed an open RLS write policy, which let anyone edit prices.

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyOmsToken(cookieStore.get(OMS_COOKIE)?.value);
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

type ProductFields = {
  name: string;
  category: string;
  description: string | null;
  price_paise: number;
  available: boolean;
  image_url: string | null;
  hsn_code: string | null;
  gst_rate: number;
  ingredients: string | null;
  allergens: string | null;
  net_quantity: string | null;
  best_before: string | null;
  storage: string | null;
  manufacturer_name: string | null;
  manufacturer_address: string | null;
  manufacturer_fssai: string | null;
};

function parseProduct(body: Record<string, unknown>): ProductFields | string {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const price_paise = body.price_paise;
  const gst_rate = body.gst_rate ?? 0;
  if (!name) return "Name required.";
  if (!category) return "Category required.";
  if (typeof price_paise !== "number" || !Number.isInteger(price_paise) || price_paise <= 0) return "Valid price required.";
  if (typeof gst_rate !== "number" || !(gst_rate >= 0 && gst_rate <= 40)) return "GST % must be between 0 and 40.";
  const optional = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    name,
    category,
    description: optional(body.description),
    price_paise,
    available: body.available !== false,
    image_url: optional(body.image_url),
    hsn_code: optional(body.hsn_code),
    gst_rate,
    ingredients: optional(body.ingredients),
    allergens: optional(body.allergens),
    net_quantity: optional(body.net_quantity),
    best_before: optional(body.best_before),
    storage: optional(body.storage),
    manufacturer_name: optional(body.manufacturer_name),
    manufacturer_address: optional(body.manufacturer_address),
    manufacturer_fssai: optional(body.manufacturer_fssai),
  };
}

// Create a product.
export async function POST(req: NextRequest) {
  if (!(await isAuthorized())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const fields = parseProduct(body);
  if (typeof fields === "string") return badRequest(fields);

  const { data, error } = await createServerSupabase().from("products").insert(fields).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data });
}

// Update one product ({ id, ...fields } or { id, available }), or rename a category ({ category, newCategory }).
export async function PATCH(req: NextRequest) {
  if (!(await isAuthorized())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const supabase = createServerSupabase();

  if (typeof body.category === "string" && typeof body.newCategory === "string") {
    const newCategory = body.newCategory.trim();
    if (!newCategory) return badRequest("Category required.");
    const { error } = await supabase.from("products").update({ category: newCategory }).eq("category", body.category);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (typeof body.id !== "string") return badRequest("Missing id");

  // Availability toggle sends only { id, available }.
  if (Object.keys(body).length === 2 && typeof body.available === "boolean") {
    const { error } = await supabase.from("products").update({ available: body.available }).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const fields = parseProduct(body);
  if (typeof fields === "string") return badRequest(fields);
  const { error } = await supabase.from("products").update(fields).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Delete one product ({ id }) or a whole category ({ category }).
export async function DELETE(req: NextRequest) {
  if (!(await isAuthorized())) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const supabase = createServerSupabase();

  let q = supabase.from("products").delete();
  if (typeof body.id === "string") q = q.eq("id", body.id);
  else if (typeof body.category === "string") q = q.eq("category", body.category);
  else return badRequest("Missing id or category");

  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
