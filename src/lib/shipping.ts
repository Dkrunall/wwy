// Shipping fee rules — shared between client (cart preview) and server (order creation).
// Free from Colaba and Cuffe Parade to Kandivali on orders of FREE_DELIVERY_MIN_PAISE or more
// (cart total before discounts); a flat standard fee for everything else in Mumbai.
import { isFreeDeliveryPincode } from "@/lib/pincodes";

export const STANDARD_SHIPPING_FEE_PAISE = 6500; // ₹65
export const FREE_DELIVERY_MIN_PAISE = 30000; // ₹300

export const DELIVERY_CHARGE_TEXT = `Free delivery from Colaba and Cuffe Parade to Kandivali on orders of ₹${FREE_DELIVERY_MIN_PAISE / 100} or more. Otherwise ₹${STANDARD_SHIPPING_FEE_PAISE / 100}.`;

export function calculateShippingFee(pincode: string | null | undefined, subtotalPaise: number): number {
  return isFreeDeliveryPincode(pincode) && subtotalPaise >= FREE_DELIVERY_MIN_PAISE ? 0 : STANDARD_SHIPPING_FEE_PAISE;
}
