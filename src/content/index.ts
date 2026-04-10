import type { ContentMessage, MsgRecipeFound, MsgNoRecipe } from "@/types/messages";
import type { SchemaRecipe } from "@/types/recipe";
import { MAX_PAGE_TEXT_CHARS } from "@/constants";

chrome.runtime.onMessage.addListener(
  (message: ContentMessage, _sender, sendResponse) => {
    if (message.type === "GET_RECIPE_DATA") {
      const result = extractRecipeData();
      sendResponse(result);
    }
    return false; // sync response
  }
);

function extractRecipeData(): MsgRecipeFound | MsgNoRecipe {
  const url = window.location.href;
  const title = document.title;

  const recipe = extractSchemaRecipe();
  if (recipe) {
    return { type: "RECIPE_FOUND", recipe, url, title };
  }

  // No structured data — send trimmed page text for AI extraction
  const pageText = extractPageText();
  return { type: "NO_RECIPE", pageText, url, title };
}

/** Try to find a schema.org Recipe in JSON-LD script tags */
function extractSchemaRecipe(): SchemaRecipe | null {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');

  for (const script of scripts) {
    try {
      const json: unknown = JSON.parse(script.textContent ?? "");
      const recipe = findRecipeInJsonLd(json);
      if (recipe) return recipe;
    } catch {
      // malformed JSON-LD, skip
    }
  }

  return null;
}

function findRecipeInJsonLd(json: unknown): SchemaRecipe | null {
  if (!json || typeof json !== "object") return null;

  // Handle @graph arrays
  if (Array.isArray(json)) {
    for (const item of json) {
      const found = findRecipeInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  const obj = json as Record<string, unknown>;

  // Handle @graph property
  if (obj["@graph"]) {
    return findRecipeInJsonLd(obj["@graph"]);
  }

  // Check @type — can be string or array
  const type = obj["@type"];
  const isRecipe =
    type === "Recipe" ||
    (Array.isArray(type) && type.includes("Recipe"));

  if (isRecipe && Array.isArray(obj["recipeIngredient"]) && (obj["recipeIngredient"] as unknown[]).length > 0) {
    return obj as unknown as SchemaRecipe;
  }

  return null;
}

/** Extract text from the most relevant part of the page */
function extractPageText(): string {
  // Prefer recipe-specific containers
  const selectors = [
    "[class*='recipe']",
    "[class*='Recipe']",
    "[id*='recipe']",
    "article",
    "main",
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = (el as HTMLElement).innerText;
      if (text.length > 200) {
        return text.slice(0, MAX_PAGE_TEXT_CHARS);
      }
    }
  }

  return document.body.innerText.slice(0, MAX_PAGE_TEXT_CHARS);
}
