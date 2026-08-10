import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchProductBySlug, fetchProductReviews } from "@/lib/api";
import { formatPKR } from "@/lib/format";
import AddToCart from "@/components/AddToCart";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  const reviews = await fetchProductReviews(product.id);

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-10 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
        <div className="relative aspect-[4/5] bg-[#efe8db]">
          <Image src={product.image} alt={product.name} fill priority className="object-cover" />
        </div>

        <div>
          <p className="eyebrow mb-4">
            {product.category} — {product.shape}
          </p>
          <h1 className="font-display text-4xl mb-6">{product.name}</h1>
          <p className="text-muted leading-relaxed mb-8">{product.description}</p>

          <dl className="grid grid-cols-2 gap-y-4 text-sm border-t border-b hairline py-6 mb-8">
            <dt className="text-muted">Shape</dt>
            <dd>{product.shape}</dd>
            <dt className="text-muted">Material</dt>
            <dd>{product.material}</dd>
            <dt className="text-muted">Dimensions</dt>
            <dd>{product.dimensions}</dd>
            <dt className="text-muted">Category</dt>
            <dd>{product.category}</dd>
            <dt className="text-muted">Price</dt>
            <dd>{formatPKR(product.price)}</dd>
          </dl>

          <AddToCart product={product} />
          <p className="text-xs text-muted mt-4">Cash on delivery · 3–5 days nationwide</p>
        </div>
      </div>

      {/* Styling copy */}
      <div className="max-w-2xl mt-24 pt-16 border-t hairline">
        <h2 className="font-display text-2xl mb-6">
          Styling the {product.name} in a Pakistani home
        </h2>
        <p className="text-muted leading-relaxed">{product.styling}</p>
      </div>

      {/* Reviews */}
      <div className="max-w-2xl mt-24 pt-16 border-t hairline">
        <h2 className="font-display text-2xl mb-8">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-muted text-sm">No reviews yet — be the first to share yours.</p>
        ) : (
          <ul className="space-y-8">
            {reviews.map((r) => (
              <li key={r.id} className="border-b hairline pb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-bronze">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                <p className="text-muted text-sm leading-relaxed">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
