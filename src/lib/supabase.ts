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
  created_at: string;
};

export type Order = {
  id: string;
  customer_id: string;
  flat_number: string;
  customer_name: string;
  status: "pending" | "confirmed" | "delivered";
  total_paise: number;
  notes: string | null;
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
