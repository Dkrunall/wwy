import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionCustomer = {
  id: string;
  name: string;
  flat_number: string;
  pincode: string | null;
};

// Identify the customer from the Supabase Auth session the browser sends as
// "Authorization: Bearer <access token>". The token is verified by Supabase; the customer row is
// looked up by the verified email, so nothing the browser sends in the body can pick the customer.
export async function getSessionCustomer(req: NextRequest, admin: SupabaseClient): Promise<SessionCustomer | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const { data, error } = await admin.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) return null;

  const { data: customer } = await admin
    .from("customers")
    .select("id, name, flat_number, pincode")
    .eq("email", email)
    .maybeSingle();
  return (customer as SessionCustomer | null) ?? null;
}
