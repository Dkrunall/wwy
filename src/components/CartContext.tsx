"use client";

import React, { createContext, useContext } from "react";

export type CartItem = {
  id: number;
  name: string;
  price: string;
  priceNum: number;
  image: string;
  bgColor: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const noop = () => {};

const defaultValue: CartContextType = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  addItem: noop,
  removeItem: noop,
  increment: noop,
  decrement: noop,
  clearCart: noop,
  isOpen: false,
  openCart: noop,
  closeCart: noop,
};

const CartContext = createContext<CartContextType>(defaultValue);

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <CartContext.Provider value={defaultValue}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
