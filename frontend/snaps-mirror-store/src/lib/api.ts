import { Product, Review, Category, OrderPayload, ApiResponse } from "./types";
import { products as mockProducts, reviews as mockReviews, categories as mockCategories, getProductBySlug } from "./mock-data";

// Set NEXT_PUBLIC_API_URL in .env.local once the real backend endpoints below are live.
// Until then, every function here falls back to the mock data in ./mock-data.ts so the
// storefront works standalone. Swap happens automatically: if the fetch fails or 404s,
// we silently fall back — remove the try/catch once every endpoint is confirmed live.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json: ApiResponse<T> = await res.json();
    if (!json.success) return null;
    return json.data;
  } catch {
    return null; // backend not reachable / endpoint not built yet -> caller falls back to mock data
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<{ data: T | null; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json: ApiResponse<T> = await res.json();
    if (!json.success) return { data: null, error: json.message };
    return { data: json.data };
  } catch {
    return { data: null, error: "Could not reach the server. Please try again." };
  }
}

// GET /api/categories (public) — falls back to mock categories
export async function fetchCategories(): Promise<Category[]> {
  const data = await apiGet<Category[]>("/categories");
  return data ?? mockCategories;
}

// GET /api/products (public, supports query params for filtering/pagination)
export async function fetchProducts(params?: Record<string, string>): Promise<Product[]> {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  const data = await apiGet<Product[]>(`/products${qs}`);
  return data ?? mockProducts;
}

// GET /api/products/:slug (public)
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const data = await apiGet<Product>(`/products/${slug}`);
  return data ?? getProductBySlug(slug) ?? null;
}

// GET /api/products/:id/reviews (public)
export async function fetchProductReviews(productId: number): Promise<Review[]> {
  const data = await apiGet<Review[]>(`/products/${productId}/reviews`);
  return data ?? mockReviews.filter((r) => r.productId === productId);
}

// POST /api/products/:id/reviews (public, no login)
export async function submitReview(
  productId: number,
  payload: { name: string; rating: number; comment: string }
) {
  return apiPost(`/products/${productId}/reviews`, payload);
}

// POST /api/orders (public, guest checkout)
export async function placeOrder(payload: OrderPayload) {
  return apiPost<{ id: number }>("/orders", payload);
}
