// src/contexts/CartContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CartContextType, CartItem, ID, Product, ProductVariant } from "@/types/product";

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "cart_items_v1";
const DELIVERY_MODE_KEY = "cart_delivery_mode_v1";

export type DeliveryMode = "delivery" | "pickup";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");

  // Load items + deliveryMode
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // ignore
    }

    try {
      const mode = localStorage.getItem(DELIVERY_MODE_KEY) as DeliveryMode | null;
      if (mode === "delivery" || mode === "pickup") setDeliveryMode(mode);
    } catch {
      // ignore
    }
  }, []);

  // Persist items
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // Persist deliveryMode
  useEffect(() => {
    try {
      localStorage.setItem(DELIVERY_MODE_KEY, deliveryMode);
    } catch {
      // ignore
    }
  }, [deliveryMode]);

  const addToCart = (product: Product, variant: ProductVariant, quantity = 1) => {
    const requested = Math.max(1, Math.floor(quantity));
    const stock = Math.max(0, Math.floor(variant.stock_count ?? 0));

    // out of stock => do nothing
    if (stock <= 0) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.variant.id === variant.id);

      if (existing) {
        const nextQty = Math.min(stock, existing.quantity + requested);
        return prev.map((i) => (i.variant.id === variant.id ? { ...i, quantity: nextQty } : i));
      }

      const qty = Math.min(stock, requested);
      return [...prev, { product, variant, quantity: qty }];
    });
  };

  const removeFromCart = (variantId: ID) => {
    setItems((prev) => prev.filter((i) => i.variant.id !== variantId));
  };

  const updateQuantity = (variantId: ID, quantity: number) => {
    const requested = Math.floor(quantity);

    setItems((prev) => {
      const item = prev.find((i) => i.variant.id === variantId);
      if (!item) return prev;

      const stock = Math.max(0, Math.floor(item.variant.stock_count ?? 0));

      if (requested <= 0) return prev.filter((i) => i.variant.id !== variantId);

      const nextQty = Math.min(stock, requested);

      if (nextQty <= 0) return prev.filter((i) => i.variant.id !== variantId);

      return prev.map((i) => (i.variant.id === variantId ? { ...i, quantity: nextQty } : i));
    });
  };

  const clearCart = () => {
    setItems([]);
    setDeliveryMode("delivery");
  };

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.variant.price ?? 0) * i.quantity), 0),
    [items]
  );

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    deliveryMode,
    setDeliveryMode,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
