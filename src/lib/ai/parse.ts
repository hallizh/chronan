import type { Ingredient } from "@/types/recipe";
import type { RawAIIngredient } from "./types";

let idCounter = 0;
function newId(): string {
  return `ing_${Date.now()}_${idCounter++}`;
}

export function parseAIResponse(content: string): Ingredient[] {
  let raw: unknown;
  try {
    // Some models wrap the array in {"ingredients": [...]}
    const parsed: unknown = JSON.parse(content);
    if (Array.isArray(parsed)) {
      raw = parsed;
    } else if (parsed && typeof parsed === "object" && "ingredients" in parsed) {
      raw = (parsed as Record<string, unknown>).ingredients;
    } else {
      // Try to find the first JSON array in the string
      const match = content.match(/\[[\s\S]*\]/);
      raw = match ? JSON.parse(match[0]) : [];
    }
  } catch {
    // Last resort: try to find a JSON array in the string
    const match = content.match(/\[[\s\S]*\]/);
    try {
      raw = match ? JSON.parse(match[0]) : [];
    } catch {
      raw = [];
    }
  }

  if (!Array.isArray(raw)) return [];

  return (raw as RawAIIngredient[])
    .filter((item) => item && typeof item === "object" && item.name)
    .map((item) => ({
      id: newId(),
      raw: item.raw ?? item.name,
      name: item.name,
      quantity: typeof item.quantity === "number" ? item.quantity : 1,
      unit: item.unit ?? "",
      searchTerm: item.searchTerm ?? item.name,
      searchTermEn: item.searchTermEn ?? item.name,
    }));
}
