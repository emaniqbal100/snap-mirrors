import Link from "next/link";
import Image from "next/image";
import { fetchProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default async function HomePage() {
  const products = await fetchProducts();
  const featured = products.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 md:px-10 pt-14 pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="eyebrow mb-6">Collection — Reflections</p>
          <h1 className="font-display text-5xl md:text-6xl leading-[1.05] mb-6">
            Snap&apos;s
            <br />
            Mirror
          </h1>
          <p className="text-muted max-w-md leading-relaxed mb-8">
            A single arc of bronze, drawn around silence. Every piece is mirror as
            architecture — a quiet object that changes the temperature of a room.
          </p>
          <Link
            href="/collection"
            className="inline-block border-b border-ink pb-1 text-sm tracking-wide hover:border-bronze hover:text-bronze transition-colors"
          >
            Discover
          </Link>
        </div>
        <div className="relative aspect-[4/5] bg-[#efe8db]">
          <Image
            src="/images/hero-mirror.jpg"
            alt="Bronze / Arch Edition mirror"
            fill
            priority
            className="object-cover"
          />
          <p className="absolute bottom-4 left-4 text-xs text-white/90 italic font-display">
            Bronze / Arch Edition — H 62 cm
          </p>
        </div>
      </section>

      {/* Material story */}
      <section className="mx-auto max-w-7xl px-6 md:px-10 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center border-t hairline">
        <div className="order-2 md:order-1 relative aspect-[4/5] bg-[#efe8db]">
          <Image src="/images/detail-mirror.jpg" alt="detail of the bronze Snap's Mirror frame" fill className="object-cover" />
        </div>
        <div className="order-1 md:order-2">
          <p className="eyebrow mb-6">01 — Material</p>
          <h2 className="font-display text-3xl md:text-4xl mb-6">Metal, drawn thin</h2>
          <p className="text-muted leading-relaxed mb-6 max-w-md">
            The frame is turned from a single length of premium bronze, then brushed by
            hand. Wire supports are hidden inside the profile so the silhouette stays
            uninterrupted.
          </p>
          <div className="flex gap-6 text-xs eyebrow">
            <span>Metal</span>
            <span>Wire</span>
            <span>Marble</span>
          </div>
        </div>
      </section>

      {/* Practical story */}
      <section className="mx-auto max-w-7xl px-6 md:px-10 py-20 border-t hairline">
        <p className="eyebrow mb-6">02 — Practical</p>
        <h2 className="font-display text-3xl md:text-4xl mb-6 max-w-lg">Smudge-free frame</h2>
        <p className="text-muted leading-relaxed max-w-md mb-6">
          A micro-lacquer seals the metal, so fingerprints lift with a dry cloth. Mounts
          flush to the wall or leans at 8.5 cm depth without slipping.
        </p>
        <div className="flex gap-6 text-xs eyebrow">
          <span>Seal</span>
          <span>Lean</span>
          <span>Mount</span>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-6 md:px-10 py-20 border-t hairline">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="eyebrow mb-4">03 — Collection</p>
            <h2 className="font-display text-3xl md:text-4xl">Featured mirrors</h2>
          </div>
          <Link href="/collection" className="hidden sm:inline text-sm border-b border-ink pb-1 hover:border-bronze hover:text-bronze transition-colors">
            View all {products.length} mirrors →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <Link href="/collection" className="sm:hidden mt-8 inline-block text-sm border-b border-ink pb-1">
          View all {products.length} mirrors →
        </Link>
      </section>
    </div>
  );
}
