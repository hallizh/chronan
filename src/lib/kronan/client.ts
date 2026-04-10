import { KRONAN_API_BASE, SEARCH_PAGE_SIZE, STORAGE_KEYS } from "@/constants";
import type { KronanProduct, CartLine, CheckoutResponse } from "@/types/kronan";
import { rateLimiter } from "./rate-limiter";

async function getToken(): Promise<string> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.KRONAN_TOKEN);
  const token: string = result[STORAGE_KEYS.KRONAN_TOKEN] ?? "";
  return token;
}

async function kronanFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  await rateLimiter.consume();
  const token = await getToken();

  const res = await fetch(`${KRONAN_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `AccessToken ${token}`,
      ...options.headers,
    },
  });

  if (res.status === 401) {
    throw new KronanAuthError("Invalid or expired Krónan token");
  }
  if (res.status === 429) {
    throw new KronanRateLimitError("Rate limit exceeded");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Krónan API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export class KronanAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KronanAuthError";
  }
}

export class KronanRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KronanRateLimitError";
  }
}

interface RawSearchResponse {
  count: number;
  results: RawProduct[];
}

interface RawProduct {
  sku: string;
  name: string;
  brand?: { name: string };
  price?: number;
  pricePerUnit?: number;
  unit?: string;
  image?: string | { url: string };
  inStock?: boolean;
}

function normalizeProduct(p: RawProduct): KronanProduct {
  let imageUrl: string | undefined;
  if (typeof p.image === "string") imageUrl = p.image;
  else if (p.image && typeof p.image === "object") imageUrl = p.image.url;

  return {
    sku: p.sku,
    name: p.name,
    brand: p.brand?.name,
    price: p.price ?? p.pricePerUnit ?? 0,
    unit: p.unit,
    imageUrl,
    inStock: p.inStock ?? true,
  };
}

export async function searchProducts(query: string): Promise<KronanProduct[]> {
  const body = { query, pageSize: SEARCH_PAGE_SIZE };
  const data = await kronanFetch<RawSearchResponse>("/products/search/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return (data.results ?? []).map(normalizeProduct);
}

export async function getCheckout(): Promise<CheckoutResponse> {
  return kronanFetch<CheckoutResponse>("/checkout/");
}

export async function addToCart(lines: CartLine[]): Promise<void> {
  await kronanFetch("/checkout/lines/", {
    method: "POST",
    body: JSON.stringify({ lines }),
  });
}

export async function addToShoppingNote(lines: CartLine[]): Promise<void> {
  // Shopping note add-line accepts one item at a time
  for (const line of lines) {
    await kronanFetch("/shopping-notes/add-line/", {
      method: "POST",
      body: JSON.stringify({ sku: line.sku, quantity: line.quantity }),
    });
  }
}

export async function testConnection(): Promise<{ name: string; email: string }> {
  return kronanFetch<{ name: string; email: string }>("/me/");
}
