// Shipping fee rules — shared between client (cart preview) and server (order creation).
// Free on orders of FREE_DELIVERY_MIN_PAISE or more (cart total before discounts) anywhere we deliver,
// and always free for phone numbers on the existing-customer list; a flat standard fee otherwise.

export const STANDARD_SHIPPING_FEE_PAISE = 6500; // ₹65
export const FREE_DELIVERY_MIN_PAISE = 30000; // ₹300

export const DELIVERY_CHARGE_TEXT = `Free delivery on orders of ₹${FREE_DELIVERY_MIN_PAISE / 100} or more. Otherwise ₹${STANDARD_SHIPPING_FEE_PAISE / 100}.`;

export function calculateShippingFee(subtotalPaise: number, freeDelivery = false): number {
  return freeDelivery || subtotalPaise >= FREE_DELIVERY_MIN_PAISE ? 0 : STANDARD_SHIPPING_FEE_PAISE;
}
