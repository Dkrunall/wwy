// Shipping fee rules — shared between client (cart preview) and server (order creation).
// Free from Colaba and Cuffe Parade to Kandivali; a flat standard fee for the rest of Mumbai.
import { isFreeDeliveryPincode } from "@/lib/pincodes";

export const STANDARD_SHIPPING_FEE_PAISE = 6500; // ₹65

export const DELIVERY_CHARGE_TEXT = `Free delivery from Colaba and Cuffe Parade to Kandivali. ₹${STANDARD_SHIPPING_FEE_PAISE / 100} for the rest of Mumbai.`;

export function calculateShippingFee(pincode?: string | null): number {
  return isFreeDeliveryPincode(pincode) ? 0 : STANDARD_SHIPPING_FEE_PAISE;
}
