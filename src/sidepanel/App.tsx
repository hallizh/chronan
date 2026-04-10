import { useEffect } from "react";
import { useRecipeStore } from "./stores/useRecipeStore";
import { IdleView } from "./views/IdleView";
import { ExtractingView } from "./views/ExtractingView";
import { IngredientReview } from "./views/IngredientReview";
import { CartConfirmation } from "./views/CartConfirmation";
import { SavedRecipes } from "./views/SavedRecipes";
import { Header } from "./components/Header";
import type {
  ContentMessage,
  MsgRecipeFound,
  MsgNoRecipe,
  MsgExtractResult,
  MsgSearchResult,
} from "@/types/messages";
import type { MatchedIngredient } from "@/types/recipe";

export default function App() {
  const { view, setView, setRecipe, setIngredients, updateIngredientMatches, setError } =
    useRecipeStore();

  useEffect(() => {
    loadCurrentPage();
  }, []);

  async function loadCurrentPage() {
    setView("extracting");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        setView("idle");
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        type: "GET_RECIPE_DATA",
      } satisfies ContentMessage);

      const msg = response as MsgRecipeFound | MsgNoRecipe;

      if (msg.type === "RECIPE_FOUND") {
        setRecipe(msg.title, msg.url);
        const rawIngredients = msg.recipe.recipeIngredient ?? [];
        // Convert schema ingredients to MatchedIngredient with searching status
        // AI will be used to enrich them
        if (rawIngredients.length > 0) {
          await processIngredientLines(rawIngredients, msg.url, msg.title);
        } else {
          setView("idle");
        }
      } else if (msg.type === "NO_RECIPE") {
        setRecipe(msg.title, msg.url);
        // Use AI to extract ingredients from raw page text
        const result = await chrome.runtime.sendMessage({
          type: "EXTRACT_WITH_AI",
          pageText: msg.pageText,
          url: msg.url,
        }) as MsgExtractResult;

        if (result.error) {
          setError(result.error);
          setView("settings_prompt");
          return;
        }

        if (result.ingredients.length === 0) {
          setView("idle");
          return;
        }

        bootstrapIngredients(result.ingredients.map((ing) => ({
          ...ing,
          status: "searching" as const,
          matches: [],
          selectedSku: null,
          selectedQuantity: ing.quantity,
          skipped: false,
        })));
      }
    } catch (err) {
      console.error("[Chronan] Error loading page:", err);
      setView("idle");
    }
  }

  async function processIngredientLines(
    lines: string[],
    url: string,
    _title: string
  ) {
    // Use AI to parse the structured ingredient lines into searchable terms
    const combined = lines.join("\n");
    const result = await chrome.runtime.sendMessage({
      type: "EXTRACT_WITH_AI",
      pageText: combined,
      url,
    }) as MsgExtractResult;

    if (result.error || result.ingredients.length === 0) {
      // Fall back: create minimal ingredients from the raw lines
      const fallback: MatchedIngredient[] = lines.map((raw, i) => ({
        id: `ing_${i}`,
        raw,
        name: raw,
        quantity: 1,
        unit: "",
        searchTerm: raw,
        searchTermEn: raw,
        status: "searching",
        matches: [],
        selectedSku: null,
        selectedQuantity: 1,
        skipped: false,
      }));
      bootstrapIngredients(fallback);
      return;
    }

    bootstrapIngredients(
      result.ingredients.map((ing) => ({
        ...ing,
        status: "searching" as const,
        matches: [],
        selectedSku: null,
        selectedQuantity: ing.quantity,
        skipped: false,
      }))
    );
  }

  function bootstrapIngredients(ingredients: MatchedIngredient[]) {
    setIngredients(ingredients);
    setView("reviewing");

    // Fire off parallel product searches
    for (const ing of ingredients) {
      chrome.runtime
        .sendMessage({
          type: "SEARCH_PRODUCTS",
          query: ing.searchTerm,
          queryEn: ing.searchTermEn,
          ingredientId: ing.id,
        })
        .then((result: MsgSearchResult) => {
          updateIngredientMatches(
            result.ingredientId,
            result.products,
            result.products.length > 0 ? "found" : "not_found"
          );
        })
        .catch(() => {
          updateIngredientMatches(ing.id, [], "error");
        });
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <main className="flex-1 overflow-y-auto">
        {view === "idle" && <IdleView onScan={loadCurrentPage} />}
        {view === "extracting" && <ExtractingView />}
        {view === "reviewing" && <IngredientReview />}
        {view === "adding" && <ExtractingView label="Adding to Krónan…" />}
        {view === "success" && <CartConfirmation />}
        {view === "saved_recipes" && <SavedRecipes />}
        {view === "settings_prompt" && <IdleView onScan={loadCurrentPage} settingsPrompt />}
      </main>
    </div>
  );
}
