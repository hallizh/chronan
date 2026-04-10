import type { Ingredient, SchemaRecipe } from "./recipe";
import type { KronanProduct, CartLine } from "./kronan";

// ── Content script → Side panel ──────────────────────────────────────────────

export interface MsgGetRecipeData {
  type: "GET_RECIPE_DATA";
}

export interface MsgRecipeFound {
  type: "RECIPE_FOUND";
  recipe: SchemaRecipe;
  url: string;
  title: string;
}

export interface MsgNoRecipe {
  type: "NO_RECIPE";
  pageText: string;
  url: string;
  title: string;
}

// ── Side panel → Background ───────────────────────────────────────────────────

export interface MsgExtractWithAI {
  type: "EXTRACT_WITH_AI";
  pageText: string;
  url: string;
}

export interface MsgSearchProducts {
  type: "SEARCH_PRODUCTS";
  query: string;
  queryEn: string;
  ingredientId: string;
}

export interface MsgAddToNote {
  type: "ADD_TO_NOTE";
  lines: CartLine[];
}

export interface MsgAddToCart {
  type: "ADD_TO_CART";
  lines: CartLine[];
}

export interface MsgSaveRecipe {
  type: "SAVE_RECIPE";
  recipe: {
    url: string;
    title: string;
    ingredients: Ingredient[];
    imageUrl?: string;
  };
}

export interface MsgGetRecipes {
  type: "GET_RECIPES";
}

export interface MsgDeleteRecipe {
  type: "DELETE_RECIPE";
  id: string;
}

// ── Background → Side panel (responses) ──────────────────────────────────────

export interface MsgExtractResult {
  type: "EXTRACT_RESULT";
  ingredients: Ingredient[];
  error?: string;
}

export interface MsgSearchResult {
  type: "SEARCH_RESULT";
  ingredientId: string;
  products: KronanProduct[];
  error?: string;
}

export interface MsgCartResult {
  type: "CART_RESULT";
  success: boolean;
  error?: string;
}

export interface MsgRecipesList {
  type: "RECIPES_LIST";
  recipes: import("./recipe").Recipe[];
}

// ── Union types ───────────────────────────────────────────────────────────────

export type ContentMessage = MsgGetRecipeData;
export type ContentResponse = MsgRecipeFound | MsgNoRecipe;

export type BackgroundMessage =
  | MsgExtractWithAI
  | MsgSearchProducts
  | MsgAddToNote
  | MsgAddToCart
  | MsgSaveRecipe
  | MsgGetRecipes
  | MsgDeleteRecipe;

export type BackgroundResponse =
  | MsgExtractResult
  | MsgSearchResult
  | MsgCartResult
  | MsgRecipesList;
