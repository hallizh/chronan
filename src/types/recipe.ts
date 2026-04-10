export interface Ingredient {
  id: string; // generated uuid
  raw: string; // original text from recipe e.g. "2 tbsp olive oil"
  name: string; // cleaned name e.g. "olive oil"
  quantity: number;
  unit: string;
  searchTerm: string; // Icelandic search term suggested by AI
  searchTermEn: string; // English fallback
}

export interface MatchedIngredient extends Ingredient {
  status: "searching" | "found" | "not_found" | "error";
  matches: import("./kronan").KronanProduct[];
  selectedSku: string | null; // which product the user picked
  selectedQuantity: number; // may differ from ingredient quantity
  skipped: boolean; // user unchecked this ingredient
}

export interface Recipe {
  id: string;
  url: string;
  title: string;
  ingredients: Ingredient[];
  savedAt: string; // ISO-8601
  imageUrl?: string;
}

/** Shape of schema.org Recipe JSON-LD as extracted from the page */
export interface SchemaRecipe {
  name?: string;
  image?: string | string[] | { url: string };
  recipeIngredient?: string[];
  description?: string;
}
