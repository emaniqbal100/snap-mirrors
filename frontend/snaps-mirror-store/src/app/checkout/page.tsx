import CheckoutForm from "./CheckoutForm";

export const metadata = { title: "Checkout — Snap's Mirror" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 md:px-10 py-16">
      <CheckoutForm />
    </div>
  );
}
