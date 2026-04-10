import type { AIProvider } from "./types";
import type { Ingredient } from "@/types/recipe";
import { SYSTEM_PROMPT, buildUserPrompt, buildIngredientLinesPrompt } from "./prompt";
import { parseAIResponse } from "./parse";
import { STORAGE_KEYS } from "@/constants";

// ── OAuth constants (OpenAI Codex public client) ──────────────────────────────
const OPENAI_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const OPENAI_AUTH_URL = "https://auth.openai.com/oauth/authorize";
const OPENAI_TOKEN_URL = "https://auth.openai.com/oauth/token";
const OPENAI_REDIRECT_URI = "http://localhost:1455/auth/callback";
const OPENAI_SCOPES = "openid profile email offline_access";

export interface OpenAITokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
}

// ── API provider ──────────────────────────────────────────────────────────────

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

  private async call(userPrompt: string): Promise<Ingredient[]> {
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
          { role: "user", content: userPrompt },
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

  extractIngredients(pageText: string, url: string): Promise<Ingredient[]> {
    return this.call(buildUserPrompt(pageText, url));
  }

  parseIngredientLines(lines: string[]): Promise<Ingredient[]> {
    return this.call(buildIngredientLinesPrompt(lines));
  }
}

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// ── OAuth flow ────────────────────────────────────────────────────────────────

/**
 * Launch the OpenAI Codex OAuth flow using Chrome's tabs API.
 *
 * Opens the auth URL in a new tab, then watches for the browser to navigate
 * to the localhost:1455 callback URL. The tab is closed as soon as we capture
 * the auth code, before the browser has a chance to show a connection error.
 */
export async function launchOpenAIOAuth(): Promise<OpenAITokens> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  const authUrl = new URL(OPENAI_AUTH_URL);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", OPENAI_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", OPENAI_REDIRECT_URI);
  authUrl.searchParams.set("scope", OPENAI_SCOPES);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("id_token_add_organizations", "true");
  authUrl.searchParams.set("codex_cli_simplified_flow", "true");

  return new Promise((resolve, reject) => {
    let authTabId: number | undefined;

    function cleanup() {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
      if (authTabId !== undefined) {
        chrome.tabs.remove(authTabId).catch(() => {});
      }
    }

    function onRemoved(tabId: number) {
      if (tabId === authTabId) {
        cleanup();
        reject(new Error("OAuth window was closed before completing sign-in"));
      }
    }

    async function onUpdated(
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo
    ) {
      if (tabId !== authTabId) return;
      const url = changeInfo.url;
      if (!url) return;

      // Detect the redirect to our callback URI
      if (!url.startsWith("http://localhost:1455/auth/callback")) return;

      // Got the callback — stop listening and close the tab immediately
      // so the user doesn't see a "connection refused" error
      cleanup();

      try {
        const params = new URL(url).searchParams;

        if (params.get("error")) {
          reject(new Error(params.get("error_description") ?? params.get("error") ?? "OAuth error"));
          return;
        }
        if (params.get("state") !== state) {
          reject(new Error("OAuth state mismatch — possible CSRF"));
          return;
        }

        const code = params.get("code");
        if (!code) {
          reject(new Error("No authorization code in OAuth callback"));
          return;
        }

        const tokens = await exchangeCodeForTokens(code, codeVerifier);
        resolve(tokens);
      } catch (err) {
        reject(err);
      }
    }

    // Register listeners before opening the tab
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);

    chrome.tabs.create({ url: authUrl.toString() }).then((tab) => {
      authTabId = tab.id;
    }).catch((err) => {
      cleanup();
      reject(err);
    });
  });
}

async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<OpenAITokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: OPENAI_REDIRECT_URI,
    client_id: OPENAI_CLIENT_ID,
    code_verifier: codeVerifier,
  });

  const res = await fetch(OPENAI_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/** Refresh an expired access token using the stored refresh token. */
export async function refreshOpenAIToken(refreshToken: string): Promise<OpenAITokens> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: OPENAI_CLIENT_ID,
  });

  const res = await fetch(OPENAI_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Get a valid OpenAI access token from storage, refreshing if within 5 minutes of expiry.
 * Returns null if no tokens are stored.
 */
export async function getValidOpenAIToken(): Promise<string | null> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.AI_SETTINGS);
  const settings = result[STORAGE_KEYS.AI_SETTINGS];
  if (!settings?.openaiTokens) return null;

  const tokens: OpenAITokens = settings.openaiTokens;
  const fiveMinutes = 5 * 60 * 1000;

  if (Date.now() < tokens.expiresAt - fiveMinutes) {
    return tokens.accessToken;
  }

  // Refresh
  try {
    const refreshed = await refreshOpenAIToken(tokens.refreshToken);
    await chrome.storage.sync.set({
      [STORAGE_KEYS.AI_SETTINGS]: { ...settings, openaiTokens: refreshed },
    });
    return refreshed.accessToken;
  } catch {
    // Refresh failed — tokens are expired, user needs to re-authenticate
    return null;
  }
}
