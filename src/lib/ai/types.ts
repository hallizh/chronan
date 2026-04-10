import type { Ingredient } from "@/types/recipe";

export interface AIProvider {
  extractIngredients(pageText: string, url: string): Promise<Ingredient[]>;
  parseIngredientLines(lines: string[]): Promise<Ingredient[]>;
}

/** Raw ingredient shape returned by the AI before we enrich with IDs */
export interface RawAIIngredient {
  name: string;
  quantity: number;
  unit: string;
  searchTerm: string; // Icelandic
  searchTermEn: string; // English fallback
  raw: string; // original recipe line
}
