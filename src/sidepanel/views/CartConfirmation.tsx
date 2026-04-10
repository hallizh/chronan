import { useRecipeStore } from "../stores/useRecipeStore";
import { KRONAN_SITE_URL } from "@/constants";
import type { MsgCartResult } from "@/types/messages";

export function CartConfirmation() {
  const {
    successItemCount,
    recipeTitle,
    recipeUrl,
    recipeImageUrl,
    ingredients,
    reset,
  } = useRecipeStore();

  async function saveRecipe() {
    const result = await chrome.runtime.sendMessage({
      type: "SAVE_RECIPE",
      recipe: {
        url: recipeUrl,
        title: recipeTitle,
        ingredients: ingredients.map((i) => ({
          id: i.id,
          raw: i.raw,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          searchTerm: i.searchTerm,
          searchTermEn: i.searchTermEn,
        })),
        imageUrl: recipeImageUrl,
      },
    }) as MsgCartResult;
    return result.success;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
      <div className="text-4xl">✅</div>
      <div>
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
          Added to Krónan!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {successItemCount} item{successItemCount !== 1 ? "s" : ""} added to your shopping note.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        <a
          href={KRONAN_SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg text-center"
        >
          Open Krónan →
        </a>

        <button
          onClick={saveRecipe}
          className="w-full py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm rounded-lg text-gray-700 dark:text-gray-300"
        >
          Save recipe
        </button>

        <button
          onClick={reset}
          className="w-full py-2 text-sm text-gray-400 hover:text-gray-600"
        >
          Scan another recipe
        </button>
      </div>
    </div>
  );
}
