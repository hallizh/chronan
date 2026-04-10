import type { AIProvider } from "./types";
import type { Ingredient } from "@/types/recipe";
import { SYSTEM_PROMPT, buildUserPrompt, buildIngredientLinesPrompt } from "./prompt";
import { parseAIResponse } from "./parse";

export class AnthropicProvider implements AIProvider {
  private model: string;
  private apiKey: string;

  constructor(opts: { model: string; apiKey: string }) {
    this.model = opts.model;
    this.apiKey = opts.apiKey;
  }

  private async call(userPrompt: string): Promise<Ingredient[]> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const content = data.content.find((b) => b.type === "text")?.text ?? "[]";
    return parseAIResponse(content);
  }

  extractIngredients(pageText: string, url: string): Promise<Ingredient[]> {
    return this.call(buildUserPrompt(pageText, url));
  }

  parseIngredientLines(lines: string[]): Promise<Ingredient[]> {
    return this.call(buildIngredientLinesPrompt(lines));
  }
}
