import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { formatPKR } from "@/lib/format";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#efe8db]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
      </div>
      <div className="pt-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base leading-snug">{product.name}</h3>
          <p className="text-xs text-muted mt-1">
            {product.shape} · {product.material}
          </p>
        </div>
        <span className="text-sm whitespace-nowrap pt-0.5">{formatPKR(product.price)}</span>
      </div>
    </Link>
  );
}
