import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import manifest from "./src/manifest.config";
import { resolve } from "path";
import { fileURLToPath } from "url";
import type { Plugin } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/**
 * Vite 5.4 added origin-checking on WebSocket upgrades to prevent CSRF.
 * Chrome extension service workers send `Origin: chrome-extension://...`
 * which Vite rejects with 400. This plugin remaps that origin to localhost
 * before Vite's upgrade handler runs, so HMR works in dev mode.
 */
function chromeExtensionHmr(): Plugin {
  return {
    name: "chrome-extension-hmr",
    configureServer(server) {
      server.httpServer?.prependListener("upgrade", (req) => {
        if (req.headers.origin?.startsWith("chrome-extension://")) {
          req.headers.origin = "http://localhost:5173";
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest }), chromeExtensionHmr()],
  server: {
    cors: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
