"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";

export default function AddToCart({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center border hairline w-fit">
        <button className="w-9 h-9 text-sm" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          −
        </button>
        <span className="w-9 text-center text-sm">{qty}</span>
        <button className="w-9 h-9 text-sm" onClick={() => setQty((q) => q + 1)}>
          +
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => addItem(product, qty)}
          className="flex-1 border border-ink py-3 text-sm tracking-wide hover:border-bronze hover:text-bronze transition-colors"
        >
          Add to bag
        </button>
        <button
          onClick={() => {
            addItem(product, qty);
            router.push("/checkout");
          }}
          className="flex-1 bg-ink text-cream py-3 text-sm tracking-wide hover:bg-bronze-dark transition-colors"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
