// Coupon domain types + pure math — safe to import from client or server code.
// Server-side resolution/validation lives in couponResolve.ts (needs the DB).

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number; // percent (0-100) if discount_type === "percent", else paise
  min_order_paise: number;
  auto_apply: boolean;
  new_customer_only: boolean;
  active: boolean;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  created_at?: string;
}

export function computeCouponDiscount(coupon: Pick<Coupon, "discount_type" | "discount_value">, subtotalPaise: number): number {
  const raw = coupon.discount_type === "percent"
    ? Math.round((subtotalPaise * coupon.discount_value) / 100)
    : coupon.discount_value;
  return Math.max(0, Math.min(raw, subtotalPaise));
}

export function isCouponExpired(coupon: Pick<Coupon, "expires_at">): boolean {
  return !!coupon.expires_at && new Date(coupon.expires_at) < new Date();
}

// Given what actually got charged on a paid order, split the combined
// (loyalty + coupon) discount back into a loyalty-only percent for display —
// the coupon amount is already known (stored on the order), so whatever's
// left of subtotal-vs-goods is the loyalty portion.
export function deriveLoyaltyDiscount(
  itemsSubtotalPaise: number,
  totalPaise: number,
  shippingFeePaise: number,
  couponDiscountPaise: number
): { discountPercent: number; loyaltyDiscountPaise: number } {
  const goodsTotal = totalPaise - shippingFeePaise;
  const loyaltyDiscountPaise = Math.max(0, itemsSubtotalPaise - goodsTotal - couponDiscountPaise);
  const discountPercent = itemsSubtotalPaise > 0 && loyaltyDiscountPaise > 0
    ? Math.round((loyaltyDiscountPaise / itemsSubtotalPaise) * 100)
    : 0;
  return { discountPercent, loyaltyDiscountPaise };
}
