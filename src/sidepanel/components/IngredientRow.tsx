import { useState } from "react";
import type { MatchedIngredient } from "@/types/recipe";
import { SearchResults } from "./SearchResults";
import { QuantityInput } from "./QuantityInput";
import { useRecipeStore } from "../stores/useRecipeStore";

interface IngredientRowProps {
  ingredient: MatchedIngredient;
}

export function IngredientRow({ ingredient: ing }: IngredientRowProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { selectProduct, setQuantity, toggleSkipped } = useRecipeStore();

  const selectedProduct = ing.matches.find((p) => p.sku === ing.selectedSku);
  const linePrice = selectedProduct
    ? selectedProduct.price * ing.selectedQuantity
    : null;

  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${
        ing.skipped ? "opacity-40" : ""
      }`}
    >
      {/* Top row: checkbox + ingredient name */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={!ing.skipped}
          onChange={() => toggleSkipped(ing.id)}
          className="mt-0.5 flex-shrink-0 accent-green-600"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
            {ing.name}
          </div>
          <div className="text-xs text-gray-400 truncate">{ing.raw}</div>
        </div>
      </div>

      {/* Product match area */}
      {!ing.skipped && (
        <div className="mt-2 ml-6">
          {ing.status === "searching" && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-green-500 rounded-full animate-spin" />
              Searching Krónan…
            </div>
          )}

          {ing.status === "not_found" && (
            <div className="text-xs text-amber-600 dark:text-amber-400">
              No product found
            </div>
          )}

          {ing.status === "error" && (
            <div className="text-xs text-red-500">Search failed</div>
          )}

          {ing.status === "found" && selectedProduct && (
            <div className="flex items-center gap-2">
              {selectedProduct.imageUrl && (
                <img
                  src={selectedProduct.imageUrl}
                  alt=""
                  className="w-8 h-8 object-contain rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                  {selectedProduct.name}
                </div>
                {selectedProduct.brand && (
                  <div className="text-xs text-gray-400">{selectedProduct.brand}</div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <QuantityInput
                  value={ing.selectedQuantity}
                  onChange={(n) => setQuantity(ing.id, n)}
                />
                {linePrice !== null && (
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-16 text-right">
                    {linePrice.toLocaleString("is-IS")} kr
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Change button / alternatives */}
          {(ing.status === "found" || ing.status === "not_found") &&
            ing.matches.length > 0 && (
              <div className="mt-1">
                <button
                  onClick={() => setShowPicker((v) => !v)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showPicker
                    ? "Hide options"
                    : ing.matches.length > 1
                    ? `Change (${ing.matches.length} options)`
                    : "Change"}
                </button>
                {showPicker && (
                  <SearchResults
                    products={ing.matches}
                    selectedSku={ing.selectedSku}
                    onSelect={(sku) => selectProduct(ing.id, sku)}
                    onClose={() => setShowPicker(false)}
                  />
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
