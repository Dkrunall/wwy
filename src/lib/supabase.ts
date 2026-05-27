import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    _client = createClient(url, anon);
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price_paise: number;
  available: boolean;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  flat_number: string;
  phone: string | null;
  address: string | null;
  pincode: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  customer_id: string | null;
  flat_number: string;
  customer_name: string;
  status: "pending" | "confirmed" | "delivered";
  payment_status: "pending" | "paid" | "failed" | null;
  delivery_status: "placed" | "resting" | "baking" | "out_for_delivery" | "delivered" | null;
  total_paise: number;
  notes: string | null;
  order_number: string | null;
  delivery_date: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  invoice_url: string | null;
  baker_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_paise: number;
};

export type CartItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_paise: number;
};

export type Baker = {
  id: string;
  name: string;
  phone: string;
  pincodes: string[];
  daily_capacity: number;
  is_active: boolean;
  share_token: string;
  created_at: string;
};

export type Setting = {
  key: string;
  value: string;
};
