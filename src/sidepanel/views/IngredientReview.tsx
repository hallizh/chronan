import { useRecipeStore } from "../stores/useRecipeStore";
import { IngredientRow } from "../components/IngredientRow";
import type { MsgCartResult } from "@/types/messages";

export function IngredientReview() {
  const {
    recipeTitle,
    ingredients,
    setView,
    setError,
    setSuccess,
    errorMessage,
  } = useRecipeStore();

  const activeIngredients = ingredients.filter((i) => !i.skipped && i.selectedSku);
  const skippedCount = ingredients.filter((i) => i.skipped).length;
  const searchingCount = ingredients.filter((i) => i.status === "searching").length;

  // Compute total price from selected products × quantities
  const totalPrice = ingredients
    .filter((i) => !i.skipped && i.selectedSku)
    .reduce((sum, ing) => {
      const product = ing.matches.find((p) => p.sku === ing.selectedSku);
      return sum + (product ? product.price * ing.selectedQuantity : 0);
    }, 0);

  async function handleAdd(target: "note" | "cart") {
    setView("adding");
    try {
      const lines = activeIngredients.map((ing) => ({
        sku: ing.selectedSku!,
        quantity: ing.selectedQuantity,
      }));

      const result = await chrome.runtime.sendMessage({
        type: target === "note" ? "ADD_TO_NOTE" : "ADD_TO_CART",
        lines,
      }) as MsgCartResult;

      if (result.success) {
        setSuccess(lines.length);
      } else {
        setError(result.error ?? "Failed to add items");
        if (result.error?.startsWith("AUTH_ERROR")) {
          setView("settings_prompt");
        } else {
          setView("reviewing");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setView("reviewing");
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Recipe title */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
          {recipeTitle || "Recipe ingredients"}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {ingredients.length} ingredients
          {searchingCount > 0 && ` · searching ${searchingCount}…`}
          {skippedCount > 0 && ` · ${skippedCount} skipped`}
        </p>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="mx-4 mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Ingredient list */}
      <div className="flex-1 overflow-y-auto">
        {ingredients.map((ing) => (
          <IngredientRow key={ing.id} ingredient={ing} />
        ))}
      </div>

      {/* Footer: total price + action buttons */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        {/* Total price */}
        {totalPrice > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Estimated total
              {searchingCount > 0 && (
                <span className="text-xs text-gray-400 ml-1">(still loading…)</span>
              )}
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {totalPrice.toLocaleString("is-IS")} kr
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => handleAdd("note")}
            disabled={activeIngredients.length === 0}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg"
          >
            Add to Shopping Note
          </button>
          <button
            onClick={() => handleAdd("cart")}
            disabled={activeIngredients.length === 0}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm rounded-lg text-gray-700 dark:text-gray-300"
            title="Add directly to cart"
          >
            🛒
          </button>
        </div>

        {activeIngredients.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-2">
            No products selected yet
          </p>
        )}
      </div>
    </div>
  );
}
