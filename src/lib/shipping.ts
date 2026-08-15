// Shipping fee rules — shared between client (cart preview) and server (order creation).
// Free shipping at/above the threshold; a flat standard fee below it.
// Based on cart subtotal BEFORE any loyalty discount is applied.

export const FREE_SHIPPING_THRESHOLD_PAISE = 59900; // ₹599
export const STANDARD_SHIPPING_FEE_PAISE = 6500; // ₹65

export function calculateShippingFee(subtotalPaise: number): number {
  return subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : STANDARD_SHIPPING_FEE_PAISE;
}
