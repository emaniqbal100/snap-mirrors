import { Product, Category, Review } from "./types";

export const categories: Category[] = [
  { id: 1, name: "Arch", slug: "arch" },
  { id: 2, name: "Round", slug: "round" },
  { id: 3, name: "Rectangle", slug: "rectangle" },
  { id: 4, name: "Oval", slug: "oval" },
  { id: 5, name: "Full-length", slug: "full-length" },
];

export const products: Product[] = [
  {
    id: 1,
    slug: "karachi-round-bronze",
    name: "Karachi Round Bronze",
    shape: "Round",
    material: "Premium Bronze",
    dimensions: "60 x 60 x 4 cm",
    category: "Vanity",
    price: 35000,
    description:
      "A round mirror turned from premium bronze and brushed by hand, built for Karachi's coastal light.",
    styling:
      "Hang above a console in a sea-facing lounge — the bronze warms as the light shifts through the day. Fixings for concrete and brick walls are included.",
    image: "/images/product-arch.jpg",
  },
  {
    id: 2,
    slug: "islamabad-halo",
    name: "Islamabad Halo",
    shape: "Round",
    material: "Antique Gold",
    dimensions: "70 x 70 x 4 cm",
    category: "Vanity",
    price: 42000,
    description: "An antique gold halo mirror, hand-finished for entryways and drawing rooms.",
    styling: "Pairs well with dark walnut furniture and low, warm lighting.",
    image: "/images/product-arch.jpg",
  },
  {
    id: 3,
    slug: "chiniot-heritage-arch",
    name: "Chiniot Heritage Arch",
    shape: "Arch",
    material: "Sheesham & Brass",
    dimensions: "170 x 65 x 5 cm",
    category: "Full-length",
    price: 76000,
    description: "Chiniot sheesham wood paired with a brass inlay, finished by hand in our Lahore workshop.",
    styling: "A statement piece for a bedroom or hallway — lean it rather than mount it for the fullest effect.",
    image: "/images/product-arch.jpg",
  },
  {
    id: 4,
    slug: "wazirabad-brass-disc",
    name: "Wazirabad Brass Disc",
    shape: "Round",
    material: "Hand-spun Brass",
    dimensions: "50 x 50 x 3 cm",
    category: "Vanity",
    price: 29500,
    description: "Hand-spun brass disc mirror from Wazirabad's metalworking studios.",
    styling: "Small enough for an entryway shelf, bold enough to anchor it.",
    image: "/images/product-arch.jpg",
  },
  {
    id: 5,
    slug: "lahore-arch-mirror",
    name: "Lahore Arch Mirror",
    shape: "Arch",
    material: "Brushed Brass",
    dimensions: "180 x 60 x 4 cm",
    category: "Full-length",
    price: 48500,
    description:
      "A hand-finished arch mirror in brushed brass, made for Pakistani homes — from Lahore drawing rooms to Karachi apartments. Measures 180 x 60 x 4 cm with a smudge-free sealed frame and wall or lean mounting.",
    styling:
      "In a Lahore drawing room, hang this arch piece above a Chiniot console so the brushed brass catches late afternoon light. In smaller Karachi apartments it doubles the perceived depth of a narrow lounge. Fixings for solid brick and concrete walls are included, along with rawal plugs sized for local construction. Wipe with a dry cotton cloth — the micro-lacquer seal resists humidity in coastal cities and dust in Punjab's dry season.",
    image: "/images/product-arch.jpg",
  },
  {
    id: 6,
    slug: "multan-sun-mirror",
    name: "Multan Sun Mirror",
    shape: "Round",
    material: "Copper Alloy",
    dimensions: "80 x 80 x 4 cm",
    category: "Vanity",
    price: 54000,
    description: "A radiant copper-alloy round mirror inspired by Multan's sun-baked pottery glazes.",
    styling: "Best on a plain wall where the copper tone can stand alone.",
    image: "/images/product-arch.jpg",
  },
  {
    id: 7,
    slug: "anarkali-petal-mirror",
    name: "Anarkali Petal Mirror",
    shape: "Scalloped",
    material: "Gold Leaf Metal",
    dimensions: "65 x 65 x 4 cm",
    category: "Vanity",
    price: 49500,
    description: "A scalloped, petal-edged mirror finished in gold leaf, inspired by Anarkali Bazaar's jewellery work.",
    styling: "A romantic addition to a dressing table or powder room.",
    image: "/images/product-arch.jpg",
  },
  {
    id: 8,
    slug: "gulberg-full-length",
    name: "Gulberg Full Length",
    shape: "Rectangle",
    material: "Matte Black Metal",
    dimensions: "170 x 55 x 3 cm",
    category: "Full-length",
    price: 44000,
    description: "A clean-lined matte black full-length mirror for modern Gulberg interiors.",
    styling: "Mount flush in a dressing room or lean against a bedroom wall.",
    image: "/images/product-arch.jpg",
  },
];

export const reviews: Review[] = [
  {
    id: 1,
    productId: 5,
    name: "Ayesha K.",
    rating: 5,
    comment: "Exactly as pictured, arrived well packed. The brass looks even better in person.",
    createdAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: 2,
    productId: 5,
    name: "Bilal R.",
    rating: 4,
    comment: "Beautiful mirror, delivery took a day longer than expected but worth the wait.",
    createdAt: "2026-06-10T10:00:00.000Z",
  },
];

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}
