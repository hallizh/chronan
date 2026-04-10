import { STORAGE_KEYS } from "@/constants";
import type { Recipe } from "@/types/recipe";
import type {
  MsgSaveRecipe,
  MsgGetRecipes,
  MsgDeleteRecipe,
  MsgRecipesList,
  MsgCartResult,
} from "@/types/messages";

async function loadRecipes(): Promise<Recipe[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SAVED_RECIPES);
  return result[STORAGE_KEYS.SAVED_RECIPES] ?? [];
}

async function saveRecipes(recipes: Recipe[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.SAVED_RECIPES]: recipes });
}

export async function handleSaveRecipe(
  msg: MsgSaveRecipe
): Promise<MsgCartResult> {
  try {
    const recipes = await loadRecipes();
    const existing = recipes.findIndex((r) => r.url === msg.recipe.url);
    const entry: Recipe = {
      id: existing >= 0 ? recipes[existing].id : `recipe_${Date.now()}`,
      url: msg.recipe.url,
      title: msg.recipe.title,
      ingredients: msg.recipe.ingredients,
      savedAt: new Date().toISOString(),
      imageUrl: msg.recipe.imageUrl,
    };
    if (existing >= 0) {
      recipes[existing] = entry;
    } else {
      recipes.unshift(entry);
    }
    await saveRecipes(recipes);
    return { type: "CART_RESULT", success: true };
  } catch (err) {
    return {
      type: "CART_RESULT",
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function handleGetRecipes(
  _msg: MsgGetRecipes
): Promise<MsgRecipesList> {
  const recipes = await loadRecipes();
  return { type: "RECIPES_LIST", recipes };
}

export async function handleDeleteRecipe(
  msg: MsgDeleteRecipe
): Promise<MsgCartResult> {
  try {
    const recipes = await loadRecipes();
    await saveRecipes(recipes.filter((r) => r.id !== msg.id));
    return { type: "CART_RESULT", success: true };
  } catch (err) {
    return {
      type: "CART_RESULT",
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
