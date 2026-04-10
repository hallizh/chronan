import { setupKeepalive } from "./alarm";
import { handleExtractWithAI } from "./handlers/recipe";
import { handleSearchProducts } from "./handlers/search";
import { handleAddToCart, handleAddToNote } from "./handlers/cart";
import {
  handleSaveRecipe,
  handleGetRecipes,
  handleDeleteRecipe,
} from "./handlers/storage";
import type { BackgroundMessage, BackgroundResponse } from "@/types/messages";

setupKeepalive();

// Open the side panel when the action button is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: BackgroundMessage,
    _sender,
    sendResponse: (response: BackgroundResponse) => void
  ) => {
    handleMessage(message).then(sendResponse).catch((err) => {
      console.error("[Chronan background] unhandled error:", err);
    });
    // Return true to keep the message channel open for async response
    return true;
  }
);

async function handleMessage(
  message: BackgroundMessage
): Promise<BackgroundResponse> {
  switch (message.type) {
    case "EXTRACT_WITH_AI":
      return handleExtractWithAI(message);
    case "SEARCH_PRODUCTS":
      return handleSearchProducts(message);
    case "ADD_TO_NOTE":
      return handleAddToNote(message);
    case "ADD_TO_CART":
      return handleAddToCart(message);
    case "SAVE_RECIPE":
      return handleSaveRecipe(message);
    case "GET_RECIPES":
      return handleGetRecipes(message);
    case "DELETE_RECIPE":
      return handleDeleteRecipe(message);
    default: {
      const _exhaustive: never = message;
      throw new Error(`Unknown message type: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
