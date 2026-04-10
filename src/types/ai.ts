export type AIProviderName = "openai" | "anthropic" | "gemini";

export interface AISettings {
  provider: AIProviderName;
  model: string;
  apiKey: string;
  /** How to authenticate with OpenAI — explicit choice, not derived */
  openaiAuthMethod?: "apikey" | "oauth";
  /** Stored OpenAI OAuth tokens (access + refresh + expiry) */
  openaiTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

export const MODEL_OPTIONS: Record<AIProviderName, { id: string; label: string }[]> = {
  openai: [
    { id: "gpt-5.4", label: "GPT-5.4" },
    { id: "gpt-5.4-mini", label: "GPT-5.4 mini" },
    { id: "gpt-5.4-nano", label: "GPT-5.4 nano" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
  gemini: [
    { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (preview)" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ],
};
