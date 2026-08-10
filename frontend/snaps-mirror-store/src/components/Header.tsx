"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { totalItems, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-sm border-b hairline">
      <div className="mx-auto max-w-7xl px-6 md:px-10 h-20 flex items-center justify-between">
        <Link href="/" className="font-display text-xl tracking-[0.2em] uppercase">
          Snap&apos;s Mirror
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-sm">
          <Link href="/collection" className="hover:text-bronze transition-colors">
            Collection
          </Link>
          <Link href="/journal" className="hover:text-bronze transition-colors">
            Journal
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <span className="hidden sm:inline eyebrow">Karachi · Lahore</span>
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative flex items-center justify-center w-9 h-9 rounded-full border hairline hover:border-bronze transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-bronze text-white text-[10px] flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
