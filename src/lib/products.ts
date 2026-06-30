export type Product = {
  id: number;
  name: string;
  category: string;
  badge?: string;
  price: string;
  priceNum: number;
  image: string;
  bgColor: string;
  desc: string;
  longDesc: string;
  details: string[];
  leadTime: string;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Wild Botanicals",
    category: "Sodas",
    badge: "BEST SELLER",
    price: "₹180",
    priceNum: 180,
    image: "/p1.png",
    bgColor: "bg-[#FFDDC1]",
    desc: "Hibiscus and wild ginger. Slow-fermented over 72 hours. Each bottle carries its own character.",
    longDesc:
      "Wild Botanicals is our most expressive soda. Hibiscus from a single cooperative in Rajasthan meets wild ginger sourced locally — both fermented together over a minimum of 72 hours. The result is a drink that is tart, floral, and gently effervescent. Each batch is slightly different. That's the point.",
    details: [
      "Hibiscus · Wild ginger · Raw cane sugar · Live cultures",
      "No artificial flavours, preservatives, or carbonation",
      "Naturally fermented — alive at time of delivery",
      "Best consumed within 3 days · Keep refrigerated",
    ],
    leadTime: "5–6 days · Delivery Wed & Sat",
  },
  {
    id: 2,
    name: "Wild Starter",
    category: "Starters",
    price: "₹450",
    priceNum: 450,
    image: "/p2.png",
    bgColor: "bg-[#D1E8E2]",
    desc: "A living, naturally leavened sourdough culture. Built on a century-old strain. Ready to bake.",
    longDesc:
      "This is the culture that started everything. Maintained continuously for decades, it carries history in every bubble. The Wild Starter is an active, 100% hydration sourdough culture — ready to leaven bread the day it arrives. No commercial yeast. No shortcuts. Just time, flour, and water.",
    details: [
      "100% hydration · Whole wheat flour · Live wild yeast",
      "Ships active — feed within 24 hours of delivery",
      "Instructions included · Works for all sourdough breads",
      "Store in the Iron Tin for best results",
    ],
    leadTime: "2–3 days · Delivery Wed & Sat",
  },
  {
    id: 3,
    name: "Golden Fizz",
    category: "Sodas",
    price: "₹180",
    priceNum: 180,
    image: "/p3.png",
    bgColor: "bg-[#FCEEA7]",
    desc: "Turmeric, green cardamom, raw cane. Probiotic. Fermented. Alive in every sip.",
    longDesc:
      "Golden Fizz began as an experiment with anti-inflammatory ingredients and ended up becoming one of our most requested drinks. Turmeric and green cardamom are fermented with raw cane sugar — the result is warming, spiced, and gently fizzy. A drink for morning or evening, with no sugar crash.",
    details: [
      "Turmeric · Green cardamom · Raw cane sugar · Live cultures",
      "No artificial colours or flavours",
      "Probiotic — naturally fermented",
      "Best consumed within 3 days · Keep refrigerated",
    ],
    leadTime: "5–6 days · Delivery Wed & Sat",
  },
  {
    id: 4,
    name: "The Iron Tin",
    category: "Storage",
    badge: "NEW",
    price: "₹850",
    priceNum: 850,
    image: "/p4.png",
    bgColor: "bg-[#E2D4E0]",
    desc: "Designed to keep your starter alive. Airtight. Measured. Built for the long ferment.",
    longDesc:
      "The Iron Tin was designed specifically for sourdough starters. It is airtight without being vacuum-sealed — allowing the culture to breathe slowly without drying out. Etched measurement lines let you track starter growth without extra tools. Made from food-grade cold-rolled steel with a matte finish.",
    details: [
      "Food-grade cold-rolled steel · Matte finish",
      "Airtight lid with silicone seal",
      "Etched measurement lines — 100ml to 500ml",
      "Compatible with all hydration levels",
    ],
    leadTime: "Ships next delivery day · Wed & Sat",
  },
  {
    id: 5,
    name: "Sampler Kit",
    category: "Bundles",
    badge: "LIMITED",
    price: "₹1,200",
    priceNum: 1200,
    image: "/p5.png",
    bgColor: "bg-[#FFDDC1]",
    desc: "Everything to begin. Two sodas, one starter, one tin. A complete introduction to living food.",
    longDesc:
      "The Sampler Kit is for someone who wants to understand what WWY is before committing to a single product. It includes one bottle of Wild Botanicals, one Golden Fizz, one Wild Starter, and one Iron Tin — everything you need to start fermenting at home and understand our range. Limited to 10 kits per order window.",
    details: [
      "1× Wild Botanicals · 1× Golden Fizz",
      "1× Wild Starter (active) · 1× Iron Tin",
      "Bundled at ₹300 off individual pricing",
      "Ships on the later of the two delivery dates",
    ],
    leadTime: "5–6 days · Delivery Wed & Sat",
  },
  {
    id: 6,
    name: "Sourdough Loaf",
    category: "Breads",
    badge: "MADE TO ORDER",
    price: "₹280",
    priceNum: 280,
    image: "/p2.png",
    bgColor: "bg-[#F5EDD7]",
    desc: "Open crumb. Thick crust. Slow-fermented with our century-old wild culture. Baked when you order.",
    longDesc:
      "Our Sourdough Loaf is leavened entirely with our wild culture — no commercial yeast, no shortcuts. A minimum 18-hour cold ferment gives the crumb its character and the crust its depth. Each loaf is scored by hand and baked on a stone. It tastes different every bake, because wild yeast is different every time.",
    details: [
      "Stone-milled whole wheat flour · Wild culture · Water · Salt",
      "18-hour cold ferment · No commercial yeast",
      "Hand-scored · Stone-baked",
      "Best eaten within 2 days · Freeze well",
    ],
    leadTime: "Baked to order · Delivery Wed & Sat",
  },
  {
    id: 7,
    name: "Multigrain Bread",
    category: "Breads",
    price: "₹220",
    priceNum: 220,
    image: "/p1.png",
    bgColor: "bg-[#E8E0D0]",
    desc: "Seeds, grains, and wild leavening. Dense, nutritious, and fermented for flavour — not just function.",
    longDesc:
      "The Multigrain Bread is our everyday loaf. Sunflower seeds, flax, and rolled oats are soaked overnight before being folded into a whole wheat dough leavened with our wild culture. The result is dense without being heavy — each slice carries the complexity of a long ferment and the texture of whole grain.",
    details: [
      "Whole wheat flour · Sunflower seeds · Flax · Rolled oats",
      "Wild culture leaven · Overnight grain soak",
      "No preservatives · No commercial yeast",
      "Best eaten within 3 days · Slices well from frozen",
    ],
    leadTime: "Baked to order · Delivery Wed & Sat",
  },
];

export function getProduct(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}
