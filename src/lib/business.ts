// Legal and contact identity shown in the footer and on the policy pages (P0-3, P0-4).
// Consumer Protection (E-Commerce) Rules 2020 and Legal Metrology require these on the site.
// Fill every empty value before launch. Empty values render as a visible "to be added" marker
// so nothing ships blank by accident; run `listMissingBusinessFields()` to see what is left.

export const BUSINESS = {
  brand: "Wild Wild Yeast",
  legalName: "Brewad LLP",
  registeredAddress: "",
  llpin: "",
  gstin: "",
  fssai: "",
  careEmail: "",
  carePhone: "+91 91523 34334",
  grievanceOfficer: { name: "", email: "", phone: "", hours: "Mon to Sat, 10 AM to 6 PM IST" },
  instagramHandle: "wildwildyeast.wwy",
  instagramUrl: "https://instagram.com/wildwildyeast.wwy",
};

// Policy numbers kept in one place so the pages and checkout agree.
export const POLICY = {
  // How long after delivery a customer can report damage or a wrong item, with a photo.
  reportWindowHours: 24,
  // Typical time for a refund to reach the original payment method after approval.
  refundDays: "5 to 7 working days",
};

export const TO_BE_ADDED = "[to be added before launch]";

export function businessValue(value: string): string {
  return value.trim() || TO_BE_ADDED;
}

export function listMissingBusinessFields(): string[] {
  const missing: string[] = [];
  const need: [string, string][] = [
    ["registeredAddress", BUSINESS.registeredAddress],
    ["llpin", BUSINESS.llpin],
    ["gstin", BUSINESS.gstin],
    ["fssai", BUSINESS.fssai],
    ["careEmail", BUSINESS.careEmail],
    ["grievanceOfficer.name", BUSINESS.grievanceOfficer.name],
    ["grievanceOfficer.email", BUSINESS.grievanceOfficer.email],
    ["grievanceOfficer.phone", BUSINESS.grievanceOfficer.phone],
  ];
  for (const [key, value] of need) if (!value.trim()) missing.push(key);
  return missing;
}
