// Delivery area. We deliver within Mumbai only (pincodes 400001 to 400104).

export function isMumbaiPincode(pincode?: string | null): boolean {
  const p = pincode?.trim() ?? "";
  return /^\d{6}$/.test(p) && Number(p) >= 400001 && Number(p) <= 400104;
}
