export interface KronanProduct {
  sku: string;
  name: string;
  brand?: string;
  price: number; // ISK integer
  unit?: string; // "kg", "stk", "l"
  imageUrl?: string;
  inStock: boolean;
}

export interface KronanSearchRequest {
  query: string;
  pageSize?: number;
}

export interface KronanSearchResponse {
  results: KronanProduct[];
  count: number;
}

export interface CartLine {
  sku: string;
  quantity: number;
}

export interface NoteAddLine {
  sku?: string;
  text?: string;
  quantity: number;
}

export interface CheckoutResponse {
  lines: Array<{
    sku: string;
    quantity: number;
    product: KronanProduct;
  }>;
  totalPrice: number;
}
