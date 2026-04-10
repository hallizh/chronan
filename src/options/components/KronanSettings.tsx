import { useEffect, useState } from "react";
import { STORAGE_KEYS, KRONAN_SETTINGS_URL } from "@/constants";
import { testConnection } from "@/lib/kronan/client";

export function KronanSettings() {
  const [token, setToken] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    chrome.storage.sync.get(STORAGE_KEYS.KRONAN_TOKEN).then((result) => {
      setToken(result[STORAGE_KEYS.KRONAN_TOKEN] ?? "");
    });
  }, []);

  async function save() {
    await chrome.storage.sync.set({ [STORAGE_KEYS.KRONAN_TOKEN]: token.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    setTesting(true);
    setTestResult(null);
    try {
      const me = await testConnection();
      setTestResult(`✓ Connected as ${me.name || me.email}`);
    } catch (err) {
      setTestResult(`✗ ${err instanceof Error ? err.message : "Connection failed"}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-gray-900">Krónan Account</h2>
      <p className="text-sm text-gray-500">
        Get your access token from{" "}
        <a
          href={KRONAN_SETTINGS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Krónan Snjallverslun settings
        </a>{" "}
        (requires Audkenni login). The token starts with <code>act_</code>.
      </p>

      <div className="flex gap-2">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="act_..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={save}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium"
        >
          {saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={test}
          disabled={!token || testing}
          className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-sm rounded-lg disabled:opacity-40"
        >
          {testing ? "Testing…" : "Test connection"}
        </button>
        {testResult && (
          <span
            className={`text-sm ${
              testResult.startsWith("✓") ? "text-green-600" : "text-red-500"
            }`}
          >
            {testResult}
          </span>
        )}
      </div>
    </section>
  );
}
