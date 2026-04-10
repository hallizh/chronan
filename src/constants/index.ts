export const KRONAN_API_BASE = "https://api.kronan.is/api/v1";

export const STORAGE_KEYS = {
  KRONAN_TOKEN: "kronan_token",
  AI_SETTINGS: "ai_settings",
  SAVED_RECIPES: "saved_recipes",
  RATE_LIMITER: "rate_limiter",
} as const;

export const RATE_LIMIT = {
  MAX_TOKENS: 200,
  REFILL_INTERVAL_MS: 200_000, // 200 seconds
  REFILL_AMOUNT: 200,
} as const;

/** Max page text sent to AI to keep token costs reasonable */
export const MAX_PAGE_TEXT_CHARS = 15_000;

/** Max products returned per ingredient search */
export const SEARCH_PAGE_SIZE = 6;

export const KRONAN_SITE_URL = "https://www.kronan.is";
export const KRONAN_SETTINGS_URL = "https://snjallverslun.kronan.is/settings";

export const OPENAI_AUTH_URL = "https://auth.openai.com/authorize";
export const OPENAI_TOKEN_URL = "https://auth.openai.com/token";
export const OPENAI_CLIENT_ID = "chronan-extension";
