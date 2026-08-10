export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductVariant {
  id: number;
  label: string; // e.g. "Round / Bronze"
  price: number;
  stock?: number;
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  shape: string; // Arch, Round, Rectangle, Oval, Scalloped, Organic
  material: string;
  dimensions: string; // "180 x 60 x 4 cm"
  category: string; // Full-length, Vanity, etc.
  price: number; // in PKR
  description: string;
  styling: string; // long-form styling copy
  image: string;
  images?: string[];
  variants?: ProductVariant[];
}

export interface Review {
  id: number;
  productId: number;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderPayload {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  items: { productId: number; quantity: number; price: number }[];
  notes?: string;
}

export interface ApiSuccess<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
