import type { AIProvider } from "./types";
import type { Ingredient } from "@/types/recipe";
import { SYSTEM_PROMPT, buildUserPrompt, buildIngredientLinesPrompt } from "./prompt";
import { parseAIResponse } from "./parse";

export class GeminiProvider implements AIProvider {
  private model: string;
  private apiKey: string;

  constructor(opts: { model: string; apiKey: string }) {
    this.model = opts.model;
    this.apiKey = opts.apiKey;
  }

  private async call(userPrompt: string): Promise<Ingredient[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    const content = data.candidates[0]?.content.parts[0]?.text ?? "[]";
    return parseAIResponse(content);
  }

  extractIngredients(pageText: string, url: string): Promise<Ingredient[]> {
    return this.call(buildUserPrompt(pageText, url));
  }

  parseIngredientLines(lines: string[]): Promise<Ingredient[]> {
    return this.call(buildIngredientLinesPrompt(lines));
  }
}
