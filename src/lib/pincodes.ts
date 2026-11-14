// Delivery area. We deliver within Mumbai only (pincodes 400001 to 400104).
// Delivery is free from Colaba and Cuffe Parade up to Kandivali: the island city and the
// western suburbs up to Kandivali. The rest of Mumbai (eastern suburbs, Borivali, Dahisar) pays
// STANDARD_SHIPPING_FEE_PAISE. Edit FREE_DELIVERY_PINCODES to change the free area.

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

export const FREE_DELIVERY_PINCODES = new Set<string>([
  // Island city: Colaba, Cuffe Parade, Fort, Marine Lines, Girgaon, Malabar Hill, Byculla, Parel,
  // Worli, Dadar, Mahim, Matunga, Sion, Wadala, Prabhadevi and nearby (Kurla 400024 is excluded).
  ...range(400001, 400039).filter((p) => p !== "400024"),
  // Western suburbs: Juhu, Bandra, Khar, Santacruz, Vile Parle, Andheri, Versova, Jogeshwari,
  // Goregaon, Aarey, Malad, Kandivali.
  ...range(400049, 400065),
  "400067", // Kandivali West
  "400069", // Andheri East
  "400093", // Andheri East (Chakala)
  "400095", // Malad West (Malvani)
  "400096", // SEEPZ, Andheri East
  "400097", // Malad East
  "400098", // Kalina, Santacruz East
  "400099", // Andheri East (Airport)
  "400101", // Kandivali East
  "400102", // Jogeshwari West
  "400104", // Goregaon West
]);

export function isMumbaiPincode(pincode?: string | null): boolean {
  const p = pincode?.trim() ?? "";
  return /^\d{6}$/.test(p) && Number(p) >= 400001 && Number(p) <= 400104;
}

export function isFreeDeliveryPincode(pincode?: string | null): boolean {
  return FREE_DELIVERY_PINCODES.has(pincode?.trim() ?? "");
}
