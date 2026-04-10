import { create } from "zustand";
import type { MatchedIngredient } from "@/types/recipe";
import type { KronanProduct } from "@/types/kronan";

export type PanelView =
  | "idle"
  | "extracting"
  | "reviewing"
  | "adding"
  | "success"
  | "saved_recipes"
  | "settings_prompt";

interface RecipeStore {
  view: PanelView;
  recipeTitle: string;
  recipeUrl: string;
  recipeImageUrl: string | undefined;
  ingredients: MatchedIngredient[];
  errorMessage: string | null;
  successItemCount: number;

  setView: (view: PanelView) => void;
  setRecipe: (title: string, url: string, imageUrl?: string) => void;
  setIngredients: (ingredients: MatchedIngredient[]) => void;
  updateIngredientMatches: (
    id: string,
    products: KronanProduct[],
    status: MatchedIngredient["status"]
  ) => void;
  selectProduct: (ingredientId: string, sku: string) => void;
  setQuantity: (ingredientId: string, quantity: number) => void;
  toggleSkipped: (ingredientId: string) => void;
  setError: (msg: string | null) => void;
  setSuccess: (count: number) => void;
  reset: () => void;
}

export const useRecipeStore = create<RecipeStore>((set) => ({
  view: "idle",
  recipeTitle: "",
  recipeUrl: "",
  recipeImageUrl: undefined,
  ingredients: [],
  errorMessage: null,
  successItemCount: 0,

  setView: (view) => set({ view }),
  setRecipe: (title, url, imageUrl) =>
    set({ recipeTitle: title, recipeUrl: url, recipeImageUrl: imageUrl }),

  setIngredients: (ingredients) => set({ ingredients }),

  updateIngredientMatches: (id, products, status) =>
    set((state) => ({
      ingredients: state.ingredients.map((ing) =>
        ing.id === id
          ? {
              ...ing,
              status,
              matches: products,
              // Auto-select first in-stock product if none selected yet
              selectedSku:
                ing.selectedSku ??
                (products.find((p) => p.inStock)?.sku ?? products[0]?.sku ?? null),
            }
          : ing
      ),
    })),

  selectProduct: (ingredientId, sku) =>
    set((state) => ({
      ingredients: state.ingredients.map((ing) =>
        ing.id === ingredientId ? { ...ing, selectedSku: sku } : ing
      ),
    })),

  setQuantity: (ingredientId, quantity) =>
    set((state) => ({
      ingredients: state.ingredients.map((ing) =>
        ing.id === ingredientId ? { ...ing, selectedQuantity: quantity } : ing
      ),
    })),

  toggleSkipped: (ingredientId) =>
    set((state) => ({
      ingredients: state.ingredients.map((ing) =>
        ing.id === ingredientId ? { ...ing, skipped: !ing.skipped } : ing
      ),
    })),

  setError: (errorMessage) => set({ errorMessage }),
  setSuccess: (count) => set({ successItemCount: count, view: "success" }),

  reset: () =>
    set({
      view: "idle",
      recipeTitle: "",
      recipeUrl: "",
      recipeImageUrl: undefined,
      ingredients: [],
      errorMessage: null,
      successItemCount: 0,
    }),
}));
