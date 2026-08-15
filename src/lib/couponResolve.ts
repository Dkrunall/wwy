import { createServerSupabase } from "./supabase-server";
import { Coupon, computeCouponDiscount, isCouponExpired } from "./coupons";

interface ResolveResult {
  coupon: Coupon | null;
  discountPaise: number;
  error?: string;
}

// Server-side only: validates a requested code, or — when no code is given —
// picks the best eligible auto-apply coupon (new-user 10%, min-order
// threshold, etc.) for this customer/cart. Never trust a client-computed
// discount; this is the source of truth used at order-creation time.
export async function resolveCoupon(
  supabase: ReturnType<typeof createServerSupabase>,
  customerId: string | null,
  subtotalPaise: number,
  requestedCode?: string,
  skipAutoApply?: boolean
): Promise<ResolveResult> {
  let paidOrders = 0;
  if (customerId) {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", customerId)
      .eq("payment_status", "paid");
    paidOrders = count ?? 0;
  }
  const isNewCustomer = paidOrders === 0;

  const ineligibleReason = (c: Coupon): string | null => {
    if (!c.active) return "This coupon is no longer active.";
    if (isCouponExpired(c)) return "This coupon has expired.";
    if (c.usage_limit != null && c.used_count >= c.usage_limit) return "This coupon has been fully redeemed.";
    if (c.new_customer_only && !isNewCustomer) return "This coupon is for new customers only.";
    if (subtotalPaise < c.min_order_paise) {
      return `Add ₹${Math.ceil((c.min_order_paise - subtotalPaise) / 100)} more to use this coupon.`;
    }
    return null;
  };

  if (requestedCode && requestedCode.trim()) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", requestedCode.trim())
      .maybeSingle();
    if (!coupon) return { coupon: null, discountPaise: 0, error: "Coupon code not found." };
    const reason = ineligibleReason(coupon);
    if (reason) return { coupon: null, discountPaise: 0, error: reason };
    return { coupon, discountPaise: computeCouponDiscount(coupon, subtotalPaise) };
  }

  if (skipAutoApply) return { coupon: null, discountPaise: 0 };

  const { data: autoCoupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("auto_apply", true)
    .eq("active", true);

  const eligible = (autoCoupons || []).filter((c: Coupon) => !ineligibleReason(c));
  if (eligible.length === 0) return { coupon: null, discountPaise: 0 };

  let best = eligible[0];
  let bestAmt = computeCouponDiscount(best, subtotalPaise);
  for (const c of eligible.slice(1)) {
    const amt = computeCouponDiscount(c, subtotalPaise);
    if (amt > bestAmt) { best = c; bestAmt = amt; }
  }
  return { coupon: best, discountPaise: bestAmt };
}

export async function redeemCoupon(
  supabase: ReturnType<typeof createServerSupabase>,
  coupon: Coupon
): Promise<void> {
  await supabase.from("coupons").update({ used_count: coupon.used_count + 1 }).eq("id", coupon.id);
}
