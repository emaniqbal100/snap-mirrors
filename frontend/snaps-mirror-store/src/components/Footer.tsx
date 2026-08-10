import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t hairline mt-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="font-display text-lg tracking-[0.2em] uppercase mb-4">Snap's Mirror</div>
          <p className="text-sm text-muted max-w-sm leading-relaxed">
            Handcrafted luxury mirrors made in Pakistan. Delivered to Karachi, Lahore, Islamabad,
            Faisalabad, Multan and Peshawar.
          </p>
        </div>

        <div>
          <div className="eyebrow mb-4">Shop</div>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/collection" className="hover:text-bronze transition-colors">
                All mirrors
              </Link>
            </li>
            <li>
              <Link href="/journal" className="hover:text-bronze transition-colors">
                Styling journal
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="eyebrow mb-4">Care</div>
          <ul className="space-y-2 text-sm text-muted">
            <li>Cash on delivery nationwide</li>
            <li>7-day breakage guarantee</li>
            <li>WhatsApp orders: 0300-0000000</li>
          </ul>
        </div>
      </div>

      <div className="border-t hairline">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-6 text-xs text-muted">
          © {new Date().getFullYear()} — Snap's Mirror, Pakistan
        </div>
      </div>
    </footer>
  );
}
