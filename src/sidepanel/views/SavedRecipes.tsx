import { useEffect, useState } from "react";
import type { Recipe } from "@/types/recipe";
import type { MsgRecipesList } from "@/types/messages";

export function SavedRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: "GET_RECIPES" })
      .then((res: MsgRecipesList) => {
        setRecipes(res.recipes);
        setLoading(false);
      });
  }, []);

  async function deleteRecipe(id: string) {
    await chrome.runtime.sendMessage({ type: "DELETE_RECIPE", id });
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3">
        <div className="text-3xl">📋</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No saved recipes yet. After adding ingredients to Krónan, you can save the recipe here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      <div className="px-4 py-3">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          Saved Recipes ({recipes.length})
        </h2>
      </div>
      {recipes.map((recipe) => (
        <div key={recipe.id} className="px-4 py-3">
          <div className="flex items-start gap-3">
            {recipe.imageUrl && (
              <img
                src={recipe.imageUrl}
                alt=""
                className="w-12 h-12 object-cover rounded flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <a
                href={recipe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
              >
                {recipe.title}
              </a>
              <p className="text-xs text-gray-400 mt-0.5">
                {recipe.ingredients.length} ingredients ·{" "}
                {new Date(recipe.savedAt).toLocaleDateString("is-IS")}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {recipe.ingredients.slice(0, 5).map((ing) => (
                  <span
                    key={ing.id}
                    className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded"
                  >
                    {ing.name}
                  </span>
                ))}
                {recipe.ingredients.length > 5 && (
                  <span className="text-xs text-gray-400">
                    +{recipe.ingredients.length - 5} more
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteRecipe(recipe.id)}
              className="text-gray-300 hover:text-red-400 text-sm flex-shrink-0"
              title="Delete recipe"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
