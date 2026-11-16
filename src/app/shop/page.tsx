import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getMenuData } from "@/lib/menuData";
import { createServerSupabase } from "@/lib/supabase-server";
import ShopClient from "./ShopClient";

export const revalidate = 60;

export default async function ShopPage() {
  const { data: vacation } = await createServerSupabase().from("settings").select("value").eq("key", "vacation_mode").maybeSingle();
  if (vacation?.value === "true") redirect("/coming-soon");

  const menu = await getMenuData();
  return (
    <Suspense>
      <ShopClient {...menu} />
    </Suspense>
  );
}
