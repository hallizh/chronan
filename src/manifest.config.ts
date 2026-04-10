import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Chronan",
  version: "0.1.0",
  description: "Add recipe ingredients to your Krónan shopping note",
  permissions: ["storage", "activeTab", "scripting", "sidePanel", "tabs"],
  host_permissions: [
    "https://api.kronan.is/*",
    "https://api.openai.com/*",
    "https://api.anthropic.com/*",
    "https://generativelanguage.googleapis.com/*",
    "https://auth.openai.com/*",
    "http://localhost:1455/*",
  ],
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
  action: {
    default_title: "Chronan",
    default_icon: {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
  },
  options_page: "src/options/index.html",
  icons: {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
});
