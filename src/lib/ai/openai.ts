import type { AIProvider } from "./types";
import type { Ingredient } from "@/types/recipe";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { parseAIResponse } from "./parse";

export class OpenAIProvider implements AIProvider {
  private model: string;
  private authHeader: string;

  constructor(opts: { model: string; apiKey?: string; accessToken?: string }) {
    this.model = opts.model;
    if (opts.accessToken) {
      this.authHeader = `Bearer ${opts.accessToken}`;
    } else if (opts.apiKey) {
      this.authHeader = `Bearer ${opts.apiKey}`;
    } else {
      throw new Error("OpenAI requires an API key or access token");
    }
  }

  async extractIngredients(pageText: string, url: string): Promise<Ingredient[]> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(pageText, url) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err}`);
    }

    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content ?? "[]";
    return parseAIResponse(content);
  }
}

/** Launch OpenAI OAuth flow using chrome.identity */
export async function launchOpenAIOAuth(): Promise<string> {
  const redirectUrl = chrome.identity.getRedirectURL("openai");
  const clientId = "YOUR_OPENAI_CLIENT_ID"; // configured in options or manifest

  const authUrl = new URL("https://accounts.google.com/o/oauth2/auth"); // placeholder
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUrl);
  authUrl.searchParams.set("response_type", "token");
  authUrl.searchParams.set("scope", "openid email");

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl.toString(), interactive: true },
      (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          reject(new Error(chrome.runtime.lastError?.message ?? "OAuth cancelled"));
          return;
        }
        const hash = new URL(responseUrl).hash;
        const params = new URLSearchParams(hash.slice(1));
        const token = params.get("access_token");
        if (!token) {
          reject(new Error("No access token in OAuth response"));
          return;
        }
        resolve(token);
      }
    );
  });
}
