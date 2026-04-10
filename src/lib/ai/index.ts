import { STORAGE_KEYS } from "@/constants";
import type { AISettings } from "@/types/ai";
import type { AIProvider } from "./types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";

export async function getAIProvider(): Promise<AIProvider> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.AI_SETTINGS);
  const settings: AISettings = result[STORAGE_KEYS.AI_SETTINGS];

  if (!settings) {
    throw new Error("No AI provider configured. Please open Settings.");
  }

  switch (settings.provider) {
    case "openai":
      return new OpenAIProvider({
        model: settings.model,
        apiKey: settings.apiKey,
        accessToken: settings.openaiAccessToken,
      });
    case "anthropic":
      if (!settings.apiKey) throw new Error("Anthropic API key not configured");
      return new AnthropicProvider({ model: settings.model, apiKey: settings.apiKey });
    case "gemini":
      if (!settings.apiKey) throw new Error("Gemini API key not configured");
      return new GeminiProvider({ model: settings.model, apiKey: settings.apiKey });
    default:
      throw new Error(`Unknown AI provider: ${settings.provider}`);
  }
}

export { launchOpenAIOAuth } from "./openai";
