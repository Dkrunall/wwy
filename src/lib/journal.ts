export type JournalPost = {
  id: number;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  image: string;
  featured: boolean;
  body: string[];
};

export const posts: JournalPost[] = [
  {
    id: 1,
    category: "Process",
    title: "Why Wild Yeast Behaves Differently Every Time",
    excerpt: "Wild fermentation is never consistent in the way commercial yeast is. That's not a flaw — it's the whole point. A note on unpredictability and character.",
    date: "14 Apr 2026",
    readTime: "5 min",
    image: "/f1.png",
    featured: true,
    body: [
      "Wild yeast isn't one organism. It's a community — dozens of yeast strains and bacteria in shifting proportion, responding to temperature, humidity, the flour you use, and the air in the room. When the ratio tilts, the flavour tilts with it.",
      "Commercial yeast is a monoculture. It produces consistent CO2, consistent flavour, consistent timelines. That predictability is useful in an industrial bakery. It's also the reason commercial bread tastes the same regardless of where it's made.",
      "Wild fermentation is different. The culture learns the room. A batch started in a warm Mumbai monsoon will behave differently from the same culture in January — more assertive, faster, sometimes more sour. The baker has to read it, not follow a formula.",
      "We think this is the point. Inconsistency is what keeps wild food interesting. It means every batch is a product of its exact moment. We track variables and keep notes, but we've stopped trying to make it the same every time.",
    ],
  },
  {
    id: 2,
    category: "Ingredients",
    title: "Sourcing Hibiscus: What the Farm Tells the Bottle",
    excerpt: "The hibiscus in Wild Botanicals comes from a single cooperative in Rajasthan. Here's why that matters, and what it changes in the ferment.",
    date: "07 Apr 2026",
    readTime: "4 min",
    image: "/f2.png",
    featured: false,
    body: [
      "The hibiscus in Wild Botanicals comes from a single cooperative in Rajasthan. Not because it's a good story — though it is — but because single-origin hibiscus ferments differently from blended sources. The tannin level, the pH of the dried calyx, and the moisture content at harvest all affect how the culture develops.",
      "We've worked with the same cooperative for three years. In that time we've learned that the April harvest is lighter and more floral, while the October harvest is deeper, more astringent, and takes longer to carbonate naturally. We adjust the ferment time based on which harvest we're working with.",
      "What the farm tells the bottle: the soil that year, the rain timing, the harvest window. None of that is information we can control. What we can control is how we respond to it — and that's what makes small-batch fermentation interesting.",
    ],
  },
  {
    id: 3,
    category: "Culture",
    title: "The Century-Old Starter: A Brief History",
    excerpt: "Our sourdough culture has been passed down across three generations. What makes an old starter different from a new one — and why it takes time to understand.",
    date: "28 Mar 2026",
    readTime: "6 min",
    image: "/p2.png",
    featured: false,
    body: [
      "The starter came from a grandmother's kitchen in Pune. It was passed down twice before it came to us — each time with feeding instructions written in a different hand.",
      "Old starters aren't better than new ones in every way. A young starter is often more energetic, more aggressive. An old culture is more established — the microbial population has stabilised over thousands of fermentations, and that stability produces a more consistent, layered flavour.",
      "What makes a starter old is continuity, not age. The organisms alive in our culture today are not the same organisms from a hundred years ago — they've reproduced millions of times. What persists is the ecological balance: which strains dominate, how they interact, what ratio of lactic to acetic acid they produce.",
      "When we ship the Wild Starter, we're sending a piece of that balance. Treat it right — feed it regularly, don't leave it in the cold too long — and it will establish itself in your kitchen with its own character over time.",
    ],
  },
  {
    id: 4,
    category: "Recipes",
    title: "Using Golden Fizz as a Cooking Base",
    excerpt: "Beyond the glass. Turmeric ferment as a braising liquid, a dressing acid, a glaze. Three ways to use Golden Fizz in the kitchen.",
    date: "19 Mar 2026",
    readTime: "3 min",
    image: "/p3.png",
    featured: false,
    body: [
      "Golden Fizz was designed as a drink. But the turmeric-cardamom ferment has properties that make it interesting in the kitchen too — specifically its acidity, its warmth, and the way fermentation mellows the rawness of both spices.",
      "As a braising liquid: Use it at a 1:2 ratio with water when braising paneer or root vegetables. The acidity tenderises, the turmeric colours, and the residual ferment adds a depth you won't get from vinegar.",
      "As a dressing acid: Replace the acid in any warm salad dressing with a tablespoon of Golden Fizz. It's softer than lime juice, more complex than vinegar, and carries the cardamom through.",
      "As a glaze: Reduce it in a pan with a small amount of jaggery until syrupy. Use on roasted squash or carrots. The ferment caramelises differently from plain sugar — low, complex, not sweet in a simple way.",
      "A note: cooking kills the live cultures, so these methods are about flavour, not probiotics. Drink the rest of the bottle.",
    ],
  },
  {
    id: 5,
    category: "Process",
    title: "Temperature, Time, and the Art of the Long Ferment",
    excerpt: "Every degree changes the outcome. A practical guide to understanding how ambient temperature shapes the character of a slow ferment.",
    date: "08 Mar 2026",
    readTime: "7 min",
    image: "/p1.png",
    featured: false,
    body: [
      "Fermentation is a slow enzymatic and microbial process. Temperature determines how fast it runs. At 18°C, a batch that ferments in 48 hours at 26°C might take four days. The difference isn't just timing — the flavour profile is genuinely different.",
      "Cold fermentation favours lactic acid bacteria, which produce a smoother, more rounded sourness. Warm fermentation tends toward more acetic acid — sharper, more assertive. Neither is wrong. They're different tools.",
      "In Mumbai, ambient temperature varies from around 22°C in winter to 34°C in monsoon. We don't ferment in climate control — we adjust the time based on what the room is doing. A winter batch might go for 96 hours. A June batch might hit its peak in 52.",
      "The skill in wild fermentation is reading the culture at a given temperature and knowing when it's at its best — before it tips into over-fermentation, where the acid overwhelms everything. That window is different every time. Learning to recognise it takes months of paying attention.",
    ],
  },
  {
    id: 6,
    category: "Culture",
    title: "What 'Living Food' Actually Means",
    excerpt: "The phrase gets used often. Here is what it means specifically — biologically, culinarily, and in the context of what we make.",
    date: "22 Feb 2026",
    readTime: "5 min",
    image: "/p5.png",
    featured: false,
    body: [
      "'Living food' is a marketing term now, which is unfortunate. The underlying biology is interesting.",
      "A living food contains organisms that are metabolically active at the time of consumption — primarily lactic acid bacteria and wild yeasts. These are the same families of organisms present in a healthy gut microbiome. Whether consuming them has measurable health benefits is still an open research question; the honest answer is: probably yes, in modest ways, if consumed regularly.",
      "What living food does more reliably is taste different from dead food. Pasteurisation and high-heat processing are efficient, but they flatten flavour. The volatiles produced by active fermentation — the esters, the organic acids, the CO2 — are responsible for the complexity that makes a well-made ferment interesting.",
      "At WWY, living food means two specific things: we don't pasteurise after fermentation, and we deliver within the peak activity window — the period when the culture is at its most complex before it begins declining. That window is short. It's why our delivery schedule is what it is.",
    ],
  },
];

export function getPost(id: number): JournalPost | undefined {
  return posts.find((p) => p.id === id);
}
