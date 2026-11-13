// The cart lives in localStorage under "wwy_cart", shared by /shop, /order and the homepage menu.
export type CartLine = { product_id: string; product_name: string; quantity: number; unit_price_paise: number };

export const CART_EVENT = "wwy-cart";

export function readCart(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem("wwy_cart") || "[]");
  } catch {
    return [];
  }
}

export function writeCart(cart: CartLine[]) {
  localStorage.setItem("wwy_cart", JSON.stringify(cart));
  window.dispatchEvent(new Event(CART_EVENT));
}
