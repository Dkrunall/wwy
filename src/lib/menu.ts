import { getAvailableDeliverySlots, deliveryDateISO } from "@/lib/dateUtils";

// What is baked for each delivery date (YYYY-MM-DD, IST). Names must match the products table.
// Prices, ingredients and allergens live in the products table (see supabase-november-menu.sql).
// A date that is not listed here has no menu set, and every available product can be ordered for it.
export const BAKE_MENU: Record<string, string[]> = {
  "2026-11-04": ["Classic Sourdough", "Sourdough Ladi Pav", "Sourdough Burger Buns", "Podi & Cheese Sourdough"],
  "2026-11-07": ["Classic Sourdough", "Sourdough Ladi Pav", "Sourdough Burger Buns", "Plain Croissant", "Roasted Garlic & Chilli Flakes Sourdough", "Pista & Cranberry Babka"],
  "2026-11-11": ["Classic Sourdough", "Sourdough Ladi Pav", "Sourdough Burger Buns", "Chakli Masala Sourdough"],
  "2026-11-14": ["Classic Sourdough", "Sourdough Ladi Pav", "Sourdough Burger Buns", "Plain Croissant", "Chimichurri & Mushroom Sourdough", "Besan Laddoo Babka"],
  "2026-11-18": ["Classic Sourdough", "Sourdough Ladi Pav", "Sourdough Burger Buns", "Chana Masala Sourdough"],
  "2026-11-21": ["Classic Sourdough", "Sourdough Ladi Pav", "Sourdough Burger Buns", "Plain Croissant", "Lasun Chutney & Cheese Sourdough", "Cinnamon Maple Focaccia"],
  "2026-11-25": ["Classic Sourdough", "Sourdough Ladi Pav", "Sourdough Burger Buns", "Zhunka Bhakri Sourdough"],
  "2026-11-28": ["Classic Sourdough", "Sourdough Ladi Pav", "Sourdough Burger Buns", "Plain Croissant", "Mysore Paneer Masala Sourdough", "Pain au Chocolat"],
};

// The next four bakes: two a week, so two weeks of menu.
export function upcomingBakes(count = 4): { iso: string; label: string }[] {
  return getAvailableDeliverySlots(count).map((d) => ({
    iso: deliveryDateISO(d),
    label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }),
  }));
}

// True when every item can be ordered for that delivery date.
export function bakeHasAll(iso: string, names: string[]): boolean {
  const menu = BAKE_MENU[iso];
  return !menu || names.every((n) => menu.includes(n));
}

// Hide products that are on none of the upcoming bakes (only once a menu is set for them).
export function isOnUpcomingMenu(name: string, bakes = upcomingBakes()): boolean {
  const set = bakes.filter((b) => BAKE_MENU[b.iso]);
  return set.length === 0 || set.some((b) => BAKE_MENU[b.iso].includes(name));
}

// "Wed 18 Nov, Sat 21 Nov" for an item baked only on some upcoming days; null if it is on every one.
export function bakeDaysLabel(name: string, bakes = upcomingBakes()): string | null {
  const days = bakes.filter((b) => bakeHasAll(b.iso, [name]));
  return days.length === bakes.length ? null : days.map((b) => b.label).join(", ") || null;
}
