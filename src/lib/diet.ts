export type Diet = "veg" | "egg";

export const DIET_LABEL: Record<Diet, string> = { veg: "Vegetarian", egg: "Contains egg" };

const EGG = /\b(eggs?|albumen|meringue|mayo|mayonnaise)\b/i;
const EGG_FREE = /\b(egg[-\s]?free|no eggs?|without eggs?)\b/gi;
const CROSS_CONTACT = /may contain[^.]*\.?/gi;

// Under FSSAI labelling rules egg counts as non-vegetarian, so the veg mark comes from each
// product's own ingredients. No ingredients entered in the OMS means no mark and no claim.
export function dietOf(ingredients?: string | null, allergens?: string | null): Diet | null {
  if (!ingredients?.trim()) return null;
  const contents = `${ingredients} ${allergens ?? ""}`.replace(CROSS_CONTACT, " ").replace(EGG_FREE, " ");
  return EGG.test(contents) ? "egg" : "veg";
}
