"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPKR } from "@/lib/format";
import { placeOrder } from "@/lib/api";

export default function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ customerName: "", phone: "", address: "", city: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.customerName || !form.phone || !form.address || !form.city) {
      setError("Please fill in your name, phone, address and city.");
      return;
    }
    if (items.length === 0) {
      setError("Your bag is empty.");
      return;
    }

    setSubmitting(true);
    const { data, error: apiError } = await placeOrder({
      customerName: form.customerName,
      phone: form.phone,
      address: form.address,
      city: form.city,
      notes: form.notes,
      items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity, price: i.product.price })),
    });
    setSubmitting(false);

    if (data) {
      setPlaced(true);
      clearCart();
    } else {
      // Orders endpoint isn't live on the backend yet — this message reflects that.
      setError(apiError || "Could not place your order right now. Please try again shortly.");
    }
  }

  if (placed) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <p className="eyebrow mb-4">Order placed</p>
        <h1 className="font-display text-3xl mb-4">Thank you, {form.customerName.split(" ")[0]}</h1>
        <p className="text-muted leading-relaxed mb-8">
          We&apos;ve received your order and will confirm by phone shortly. Payment is cash on
          delivery, due when your mirror arrives.
        </p>
        <button
          onClick={() => router.push("/collection")}
          className="border border-ink px-6 py-3 text-sm hover:border-bronze hover:text-bronze transition-colors"
        >
          Continue shopping
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <p className="text-muted mb-6">Your bag is empty.</p>
        <button
          onClick={() => router.push("/collection")}
          className="border border-ink px-6 py-3 text-sm hover:border-bronze hover:text-bronze transition-colors"
        >
          Browse the collection
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
      <form onSubmit={handleSubmit} className="space-y-5">
        <h1 className="font-display text-3xl mb-4">Checkout</h1>
        <p className="text-sm text-muted mb-6">
          Guest checkout — no account needed. Pay cash on delivery.
        </p>

        <Field label="Full name" value={form.customerName} onChange={(v) => update("customerName", v)} required />
        <Field label="Phone number" value={form.phone} onChange={(v) => update("phone", v)} required type="tel" />
        <Field label="City" value={form.city} onChange={(v) => update("city", v)} required />
        <div>
          <label className="text-xs eyebrow block mb-2">Delivery address</label>
          <textarea
            className="w-full border hairline bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-bronze"
            rows={3}
            required
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>
        <Field label="Order notes (optional)" value={form.notes} onChange={(v) => update("notes", v)} />

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-ink text-cream py-3 text-sm tracking-wide hover:bg-bronze-dark transition-colors disabled:opacity-50"
        >
          {submitting ? "Placing order…" : "Place order — Cash on delivery"}
        </button>
      </form>

      <div>
        <h2 className="eyebrow mb-6">Order summary</h2>
        <ul className="space-y-4 mb-6">
          {items.map((item) => (
            <li key={item.product.id} className="flex gap-4">
              <div className="relative w-16 h-20 shrink-0 bg-[#efe8db]">
                <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
              </div>
              <div className="flex-1 flex justify-between">
                <div>
                  <p className="text-sm font-display">{item.product.name}</p>
                  <p className="text-xs text-muted">Qty {item.quantity}</p>
                </div>
                <span className="text-sm">{formatPKR(item.product.price * item.quantity)}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t hairline pt-4 flex justify-between text-sm">
          <span className="text-muted">Total</span>
          <span className="font-medium">{formatPKR(totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs eyebrow block mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border hairline bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-bronze"
      />
    </div>
  );
}
