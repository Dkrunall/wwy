// Photo for a product that has no image uploaded in the OMS, picked from our own catalogue shots.
export function productFallbackImage(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("croissant") || n.includes("pain au chocolat")) return "/new-catelog/croissant.png";
  if (n.includes("bun")) return "/new-catelog/sourdough-buns.png";
  if (n.includes("pav")) return "/new-catelog/sourdough-laadi-pav.png";
  if (n.includes("pita")) return "/new-catelog/sourdough-pita-bread.png";
  if (n.includes("babka") || n.includes("focaccia") || n.includes("cinnamon")) return "/new-catelog/sweet-sourdough.png";
  if (n.includes("classic")) return "/new-catelog/sourdough-classic-heritage.png";
  if (n.includes("biscotti")) return "/new-catelog/biscotti.png";
  if (n.includes("macaroon")) return "/new-catelog/macaroons.png";
  if (n.includes("cookie")) return "/new-catelog/cookies.png";
  if (n.includes("cracker")) return "/new-catelog/crackers.png";
  if (n.includes("sourdough")) return "/new-catelog/savoury-sourdough.png";
  return "/product_img/7-from-the-oven.jpg";
}
