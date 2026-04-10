export type AIProviderName = "openai" | "anthropic" | "gemini";

export interface AISettings {
  provider: AIProviderName;
  model: string;
  apiKey: string;
  /** Stored OpenAI OAuth tokens (access + refresh + expiry). Takes precedence over apiKey. */
  openaiTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}

export const MODEL_OPTIONS: Record<AIProviderName, { id: string; label: string }[]> = {
  openai: [
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o mini" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
  gemini: [
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  ],
};
