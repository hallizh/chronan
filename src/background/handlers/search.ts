import { searchProducts } from "@/lib/kronan/client";
import type { MsgSearchProducts, MsgSearchResult } from "@/types/messages";

export async function handleSearchProducts(
  msg: MsgSearchProducts
): Promise<MsgSearchResult> {
  try {
    // Try Icelandic term first
    let products = await searchProducts(msg.query);

    // If no results, fall back to English term
    if (products.length === 0 && msg.queryEn && msg.queryEn !== msg.query) {
      products = await searchProducts(msg.queryEn);
    }

    return { type: "SEARCH_RESULT", ingredientId: msg.ingredientId, products };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return {
      type: "SEARCH_RESULT",
      ingredientId: msg.ingredientId,
      products: [],
      error,
    };
  }
}
