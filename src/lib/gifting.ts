// Gifting tiers (P3-3). DRAFT contents: confirm with the kitchen before launch.
// Set `priceRupees` (MRP incl. all taxes) on each tier to show a price; while it is null the page says
// "Price on enquiry". Keep contents to SKUs that exist in the shop.

export type GiftTier = {
  name: string;
  tagline: string;
  contents: string[];
  priceRupees: number | null;
};

export const GIFT_TIERS: GiftTier[] = [
  {
    name: "The Loaf",
    tagline: "A single, perfect loaf.",
    contents: ["1 Sourdough Classic Heritage", "Kraft paper bag with a handwritten note"],
    priceRupees: null,
  },
  {
    name: "The Breakfast",
    tagline: "Everything for a slow morning.",
    contents: ["1 Sourdough Classic Heritage", "2 Croissants", "Be-Sides cookies"],
    priceRupees: null,
  },
  {
    name: "The Table",
    tagline: "Bread for sharing.",
    contents: ["1 Savoury Sourdough", "1 Sweet Sourdough", "Sourdough Buns", "Crackers"],
    priceRupees: null,
  },
  {
    name: "The Celebration",
    tagline: "A full hamper for the occasion.",
    contents: ["Savoury and Sweet Sourdough", "Croissants", "Biscotti, cookies and macaroons", "Gift box with a handwritten note"],
    priceRupees: null,
  },
];

export const GIFTING_MIN_ORDER = "Minimum 5 hampers for corporate orders";
export const GIFTING_LEAD_TIME = "Order at least 5 days before your delivery date. Larger orders need more notice.";
