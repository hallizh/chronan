import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/constants";
import { MODEL_OPTIONS, type AIProviderName, type AISettings } from "@/types/ai";
import { launchOpenAIOAuth, type OpenAITokens } from "@/lib/ai/openai";

const DEFAULT_SETTINGS: AISettings = {
  provider: "openai",
  model: "gpt-5.4-mini",
  apiKey: "",
  openaiAuthMethod: "apikey",
  openaiTokens: undefined,
};

export function AIProviderSettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    chrome.storage.sync.get(STORAGE_KEYS.AI_SETTINGS).then((result) => {
      if (result[STORAGE_KEYS.AI_SETTINGS]) {
        const stored: AISettings = result[STORAGE_KEYS.AI_SETTINGS];
        // Backward compat: if tokens exist but method wasn't set, derive it
        if (!stored.openaiAuthMethod) {
          stored.openaiAuthMethod = stored.openaiTokens ? "oauth" : "apikey";
        }
        setSettings(stored);
      }
    });
  }, []);

  function update<K extends keyof AISettings>(key: K, value: AISettings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "provider") {
        next.model = MODEL_OPTIONS[value as AIProviderName][0].id;
      }
      return next;
    });
  }

  function selectAuthMethod(method: "apikey" | "oauth") {
    setSettings((prev) => ({
      ...prev,
      openaiAuthMethod: method,
      // Clear the other method's credentials when switching
      ...(method === "apikey" ? { openaiTokens: undefined } : { apiKey: "" }),
    }));
  }

  async function save() {
    await chrome.storage.sync.set({ [STORAGE_KEYS.AI_SETTINGS]: settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function connectOpenAI() {
    setOauthLoading(true);
    setOauthError(null);
    try {
      const tokens: OpenAITokens = await launchOpenAIOAuth();
      const updated: AISettings = { ...settings, openaiTokens: tokens, openaiAuthMethod: "oauth" };
      setSettings(updated);
      await chrome.storage.sync.set({ [STORAGE_KEYS.AI_SETTINGS]: updated });
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : "OAuth failed");
    } finally {
      setOauthLoading(false);
    }
  }

  function disconnectOpenAI() {
    setSettings((prev) => ({ ...prev, openaiTokens: undefined }));
  }

  const isOAuthConnected = !!settings.openaiTokens;
  const models = MODEL_OPTIONS[settings.provider];

  return (
    <section className="space-y-4">
      <h2 className="font-semibold text-gray-900">AI Provider</h2>
      <p className="text-sm text-gray-500">
        Used to extract ingredients from recipe pages. Your keys are stored locally in Chrome.
      </p>

      {/* Provider selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
        <div className="flex gap-2">
          {(["openai", "anthropic", "gemini"] as AIProviderName[]).map((p) => (
            <button
              key={p}
              onClick={() => update("provider", p)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
                settings.provider === p
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {p === "openai" ? "OpenAI" : p === "anthropic" ? "Anthropic" : "Gemini"}
            </button>
          ))}
        </div>
      </div>

      {/* Model selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
        <select
          value={settings.model}
          onChange={(e) => update("model", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* OpenAI: choose one auth method */}
      {settings.provider === "openai" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Authentication</label>
            <div className="flex gap-2">
              {(["apikey", "oauth"] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => selectAuthMethod(method)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
                    settings.openaiAuthMethod === method
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {method === "apikey" ? "API Key" : "Sign in with ChatGPT"}
                </button>
              ))}
            </div>
          </div>

          {/* API key */}
          {settings.openaiAuthMethod === "apikey" && (
            <div>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => update("apiKey", e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* OAuth */}
          {settings.openaiAuthMethod === "oauth" && (
            <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
              {isOAuthConnected ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-sm">✓ Connected</span>
                  <span className="text-xs text-gray-400">· refreshes automatically</span>
                  <button
                    onClick={disconnectOpenAI}
                    className="ml-auto text-xs text-gray-400 hover:text-red-500 underline"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <button
                    onClick={connectOpenAI}
                    disabled={oauthLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white text-sm rounded-lg font-medium disabled:opacity-40"
                  >
                    {oauthLoading ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Connecting…
                      </>
                    ) : (
                      "Connect with OpenAI"
                    )}
                  </button>
                  {oauthError && (
                    <p className="text-xs text-red-500">{oauthError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Anthropic / Gemini: API key only */}
      {settings.provider !== "openai" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => update("apiKey", e.target.value)}
            placeholder={settings.provider === "anthropic" ? "sk-ant-..." : "AIza..."}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <button
        onClick={save}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium"
      >
        {saved ? "Saved ✓" : "Save settings"}
      </button>
    </section>
  );
}
