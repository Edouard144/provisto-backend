// Provisto API client — pure browser fetch wrapper.
// Base URL is overridable via VITE_PROVISTO_API_URL for environments / mocks.

export const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_PROVISTO_API_URL) ||
  "https://provisto.onrender.com/api";

const TOKEN_KEY = "provisto_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | undefined | null>;
  signal?: AbortSignal;
};

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth, query, signal } = opts;
  const url = new URL(API_BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    throw new ApiError(0, "Network error — could not reach Provisto API.", e);
  }
  const text = await res.text();
  const payload = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (payload && typeof payload === "object" && (payload as any).message) ||
      res.statusText ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, String(msg), payload);
  }
  return payload as T;
}

function safeJson(t: string) {
  try { return JSON.parse(t); } catch { return t; }
}

// ---- Types ----
export type Role = "customer" | "admin";
export interface User { id: string; name: string; email: string; role: Role; }
export interface AuthResponse { token: string; user: User; }

export interface Category { id: string; name: string; slug: string; }

export interface PricingTier { minQty: number; maxQty: number | null; price: string; }
export interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  images?: ProductImage[];
  stock?: number;
  categoryId?: string | null;
  category?: Category | null;
  price?: string;
  pricingTiers?: PricingTier[];
}

export interface OrderItem { productId: string; quantity: number; unitPrice: string; name?: string; image?: string | null; images?: { url: string }[]; }
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";
export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  total: string;
  address: string;
  stripePaymentId?: string;
  createdAt: string;
  items?: OrderItem[];
}

// ---- Endpoints ----
export const Auth = {
  register: (data: { name: string; email: string; password: string }) =>
    api<AuthResponse>("/auth/register", { method: "POST", body: data }),
  login: (data: { email: string; password: string }) =>
    api<AuthResponse>("/auth/login", { method: "POST", body: data }),
  me: () => api<User>("/auth/me", { auth: true }),
};

export type ProductInput = {
  name: string;
  description?: string;
  images?: { url: string; alt?: string | null; sortOrder?: number }[];
  categoryId?: string | null;
  stock?: number;
  tiers?: { minQty: number; maxQty: number | null; price: number }[];
};

export const Products = {
  list: (params?: { search?: string; categoryId?: string }) =>
    api<Product[]>("/products", { query: params }),
  get: (id: string) => api<Product>(`/products/${id}`),
  create: (data: ProductInput) =>
    api<Product>("/products", { method: "POST", body: data, auth: true }),
  update: (id: string, data: Partial<ProductInput>) =>
    api<Product>(`/products/${id}`, { method: "PUT", body: data, auth: true }),
  remove: (id: string) =>
    api<void>(`/products/${id}`, { method: "DELETE", auth: true }),
};

export const Orders = {
  list: () => api<Order[]>("/orders", { auth: true }),
  get: (id: string) => api<Order>(`/orders/${id}`, { auth: true }),
  create: (data: { items: { productId: string; quantity: number }[]; address: string }) =>
    api<Order>("/orders", { method: "POST", body: data, auth: true }),
  listAll: () => api<Order[]>("/orders/all", { auth: true }),
  updateStatus: (id: string, status: OrderStatus) =>
    api<Order>(`/orders/${id}/status`, { method: "PATCH", body: { status }, auth: true }),
};

export const Categories = {
  list: () => api<Category[]>("/categories"),
  create: (data: { name: string }) =>
    api<Category>("/categories", { method: "POST", body: data, auth: true }),
  remove: (id: string) =>
    api<void>(`/categories/${id}`, { method: "DELETE", auth: true }),
};

export const Payments = {
  createIntent: (orderId: string) =>
    api<{ clientSecret: string }>("/payments/create-intent", {
      method: "POST",
      body: { orderId },
      auth: true,
    }),
};

export const Upload = {
  images: async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    const res = await fetch(`${API_BASE.replace("/api", "")}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    if (!res.ok) throw new ApiError(res.status, "Upload failed.");
    const data = await res.json();
    return data.urls;
  },
};

// ---- Helpers ----
export function priceForQty(product: Product, qty: number): number {
  if (product.pricingTiers && product.pricingTiers.length) {
    const t = product.pricingTiers.find(
      (tier) => qty >= tier.minQty && (tier.maxQty == null || qty <= tier.maxQty),
    );
    if (t) return Number(t.price);
  }
  return product.price ? Number(product.price) : 0;
}

export function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function formatGEL(n: number): string {
  return new Intl.NumberFormat("ka-GE", { style: "currency", currency: "GEL" }).format(n);
}

export function formatPrice(n: number, currency: "USD" | "GEL" = "USD"): string {
  return currency === "GEL" ? formatGEL(n) : formatUSD(n);
}
