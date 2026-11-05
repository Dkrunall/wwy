export const MAX_QTY_PER_PRODUCT = 10;
export const MAX_ITEMS_PER_ORDER = 20;

export const LIMIT_HINT = "Order limit reached. WhatsApp us for bigger orders.";

type Line = { product_id: string; quantity: number };

export function canAddToCart(cart: Line[], productId: string): boolean {
  const total = cart.reduce((s, i) => s + i.quantity, 0);
  const inCart = cart.find((i) => i.product_id === productId)?.quantity ?? 0;
  return total < MAX_ITEMS_PER_ORDER && inCart < MAX_QTY_PER_PRODUCT;
}

export function orderLimitError(cart: Line[]): string | null {
  const perProduct = new Map<string, number>();
  for (const i of cart) perProduct.set(i.product_id, (perProduct.get(i.product_id) ?? 0) + i.quantity);
  if ([...perProduct.values()].some((q) => q > MAX_QTY_PER_PRODUCT)) {
    return `You can order up to ${MAX_QTY_PER_PRODUCT} of each item. WhatsApp us for bigger orders.`;
  }
  if ([...perProduct.values()].reduce((s, q) => s + q, 0) > MAX_ITEMS_PER_ORDER) {
    return `You can order up to ${MAX_ITEMS_PER_ORDER} items at a time. WhatsApp us for bigger orders.`;
  }
  return null;
}
