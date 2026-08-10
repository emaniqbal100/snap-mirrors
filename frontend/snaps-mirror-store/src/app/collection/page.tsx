import { fetchProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "Mirror Collection in Pakistan — Arch, Round & Full-Length | Snap's Mirror",
  description:
    "Browse Snap's Mirror's full collection in Pakistan: arch, round, oval and full-length mirrors in brass, bronze and sheesham.",
};

export default async function CollectionPage() {
  const products = await fetchProducts();

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10 py-16">
      <p className="eyebrow mb-4">Catalogue — {products.length} pieces</p>
      <h1 className="font-display text-4xl md:text-5xl mb-6 max-w-xl">
        Luxury mirrors made in Pakistan
      </h1>
      <p className="text-muted max-w-xl leading-relaxed mb-14">
        Every Snap's Mirror piece is finished by hand in our Lahore workshop using Wazirabad
        brass, Chiniot sheesham and toughened 5 mm glass. Prices are in Pakistani Rupees
        and include insured delivery to all major cities, with cash on delivery available.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
