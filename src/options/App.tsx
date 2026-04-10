import { KronanSettings } from "./components/KronanSettings";
import { AIProviderSettings } from "./components/AIProviderSettings";

export default function App() {
  return (
    <div className="max-w-xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <img src="/icons/icon48.png" alt="" className="w-8 h-8" />
        <h1 className="text-xl font-bold text-gray-900">Chronan Settings</h1>
      </div>

      <KronanSettings />
      <AIProviderSettings />
    </div>
  );
}
