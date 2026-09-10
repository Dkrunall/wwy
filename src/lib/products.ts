export type Product = {
  id: number;
  name: string;
  category: string;
  badge?: string;
  price: string;
  priceNum: number;
  image: string;
  /** Real photography for contexts that render plain (no mix-blend-multiply) — e.g. the homepage grid. Falls back to `image` when absent. */
  photo?: string;
  bgColor: string;
  desc: string;
  longDesc: string;
  details: string[];
  leadTime: string;
  detailImage?: { src: string; alt: string };
};

const SUPABASE_IMG =
  "https://mkddqmwkboegltogftik.supabase.co/storage/v1/object/public/product-images";

export const products: Product[] = [
  {
    id: 1,
    name: "Sourdough Classic Heritage",
    category: "Crafted Bakes",
    badge: "BEST SELLER",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789026023953_5397.png`,
    bgColor: "bg-[#F5EDD7]",
    desc: "Timeless, wholesome and slow-crafted for flavour that lasts.",
    longDesc:
      "Our founding loaf. Leavened entirely with our wild culture and given a long, slow ferment, the Classic Heritage is what everyone orders first — and keeps ordering. An open, airy crumb under a deeply scored, well-baked crust.",
    details: [
      "Wild-fermented with our own sourdough culture",
      "No commercial yeast · No shortcuts",
      "Hand-scored · Baked fresh to order",
      "Best eaten within 2 days · Freezes well",
    ],
    leadTime: "Baked to order · Delivery Wed & Sat",
  },
  {
    id: 2,
    name: "Savoury Sourdough",
    category: "Crafted Bakes",
    badge: "MISSAL · PANEER THECHA & MORE",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789026019003_15257.png`,
    bgColor: "bg-[#E8E0D0]",
    desc: "Bold flavours. Artisan sourdough. Perfectly balanced.",
    longDesc:
      "For when you want your bread to bring its own flavour to the table. Folded with bold, savoury mix-ins — think Missal Sourdough and Paneer Thecha, with more flavours rotating in — and finished on our usual wild-fermented base.",
    details: [
      "Rotating savoury folds — ask what's in this week's batch",
      "Wild-fermented sourdough base",
      "Great on its own or lightly toasted",
      "Best eaten within 2 days",
    ],
    leadTime: "Baked to order · Delivery Wed & Sat",
  },
  {
    id: 3,
    name: "Sweet Sourdough",
    category: "Crafted Bakes",
    badge: "BLUEBERRY CREAM CHEESE & MORE",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789026030597_4895.png`,
    bgColor: "bg-[#FFDDC1]",
    desc: "Indulgent, nostalgic and beautifully baked.",
    longDesc:
      "A sweeter side of sourdough — swirled babka-style with fillings like Blueberry Cream Cheese and Apple Pie, styled the way we'd want to eat it ourselves. Indulgent, nostalgic, and made in small batches.",
    details: [
      "Babka-styled swirl · Rotating sweet fillings",
      "Wild-fermented dough base",
      "Best enjoyed the day it arrives, warmed slightly",
      "Great for gifting or sharing",
    ],
    leadTime: "Baked to order · Delivery Wed & Sat",
  },
  {
    id: 4,
    name: "Croissant",
    category: "Crafted Bakes",
    badge: "BUTTER · CHOCOLATE & MORE",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789026013793_11161.png`,
    bgColor: "bg-[#F5EDD7]",
    desc: "Flaky, rich and made with the finest butter.",
    longDesc:
      "Laminated by hand, layer by layer, with the finest butter we could find. Comes in classic Butter and Chocolate, with more variants rotating through the week.",
    details: [
      "Hand-laminated, all-butter dough",
      "Classic & Chocolate — more variants rotate weekly",
      "Best eaten fresh, the day of delivery",
      "Warm slightly before serving for best flake",
    ],
    leadTime: "Baked to order · Delivery Wed & Sat",
  },
  {
    id: 5,
    name: "Sourdough Buns",
    category: "Crafted Bakes",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789026020943_17703.png`,
    bgColor: "bg-[#E2D4E0]",
    desc: "Soft, airy and naturally leavened to perfection.",
    longDesc:
      "Soft, pillowy buns leavened the same wild way as our loaves — just shaped smaller and baked a little quicker. Great for burgers, sliders, or simply buttered.",
    details: [
      "Naturally leavened · Soft, airy crumb",
      "Sold as a set — great for burgers & sliders",
      "Best eaten within 2 days · Freezes well",
    ],
    leadTime: "Baked to order · Delivery Wed & Sat",
  },
  {
    id: 6,
    name: "Sourdough Pita Bread",
    category: "Crafted Bakes",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789026029169_15135.png`,
    bgColor: "bg-[#FCEEA7]",
    desc: "Soft, pocketed and perfect for every table.",
    longDesc:
      "Our take on pita, wild-leavened instead of commercially yeasted — soft, pillowy, and reliably pocketed. Perfect for dips, wraps, or mopping up a good curry.",
    details: [
      "Wild-fermented dough · Naturally pocketed",
      "Great with dips, wraps or curries",
      "Best eaten within 2 days · Reheats well",
    ],
    leadTime: "Baked to order · Delivery Wed & Sat",
  },
  {
    id: 7,
    name: "Sourdough Laadi Pav",
    category: "Crafted Bakes",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789026027121_29849.png`,
    bgColor: "bg-[#E8E0D0]",
    desc: "Soft, slightly sweet and beautifully golden.",
    longDesc:
      "The classic pull-apart laadi pav, given the wild-fermented treatment. Soft, slightly sweet, and beautifully golden — pairs perfectly with pav bhaji or vada pav.",
    details: [
      "Naturally leavened · Soft pull-apart loaf",
      "Slightly sweet, golden crust",
      "Best eaten within 2 days · Freezes well",
    ],
    leadTime: "Baked to order · Delivery Wed & Sat",
  },
  {
    id: 8,
    name: "Biscotti",
    category: "Be-Sides",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789027587699_24195.png`,
    bgColor: "bg-[#F5EDD7]",
    desc: "Crisp, twice-baked and perfect to dunk or nibble.",
    longDesc:
      "Twice-baked the traditional way for a satisfying crunch. Studded with almonds, they're built for dunking in coffee or tea — or just nibbling straight from the jar.",
    details: [
      "Twice-baked for a signature crunch",
      "Studded with almonds",
      "Keeps well — great for gifting",
    ],
    leadTime: "Delivery Wed & Sat",
  },
  {
    id: 9,
    name: "Macaroons",
    category: "Be-Sides",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789026016743_8725.png`,
    bgColor: "bg-[#D1E8E2]",
    desc: "Delicate, chewy and full of flavour.",
    longDesc:
      "Delicate on the outside, chewy in the middle. Small-batch macaroons packed with flavour in every bite.",
    details: [
      "Chewy centre, delicate shell",
      "Small-batch baked",
      "Great for gifting or hampers",
    ],
    leadTime: "Delivery Wed & Sat",
  },
  {
    id: 10,
    name: "Cookies",
    category: "Be-Sides",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789027590179_6914.png`,
    bgColor: "bg-[#FFDDC1]",
    desc: "Classic, comforting and baked to perfection.",
    longDesc:
      "Classic, comforting, chocolate chip cookies — baked to that perfect edge-crisp, centre-soft finish.",
    details: [
      "Classic chocolate chip",
      "Crisp edges, soft centre",
      "Baked fresh in small batches",
    ],
    leadTime: "Delivery Wed & Sat",
  },
  {
    id: 11,
    name: "Crackers",
    category: "Be-Sides",
    price: "₹1",
    priceNum: 1,
    image: `${SUPABASE_IMG}/product_1789026010767_15387.png`,
    bgColor: "bg-[#E2D4E0]",
    desc: "Crunchy, flavourful and perfect for every occasion.",
    longDesc:
      "Crunchy, well-seasoned crackers made for snacking, pairing with cheese, or filling out a hamper. Perfect for every occasion.",
    details: [
      "Crunchy, well-seasoned bite",
      "Pairs well with cheese & dips",
      "Keeps well — great for hampers",
    ],
    leadTime: "Delivery Wed & Sat",
  },
];

export function getProduct(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}
