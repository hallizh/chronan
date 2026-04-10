interface IdleViewProps {
  onScan: () => void;
  settingsPrompt?: boolean;
}

export function IdleView({ onScan, settingsPrompt }: IdleViewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
      <div className="text-4xl">🛒</div>
      <div>
        <h2 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
          {settingsPrompt ? "Setup required" : "No recipe detected"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {settingsPrompt
            ? "Configure your AI provider and Krónan token in Settings before using Chronan."
            : "Navigate to a recipe page and click the button below to extract ingredients."}
        </p>
      </div>

      {settingsPrompt ? (
        <button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Open Settings
        </button>
      ) : (
        <button
          onClick={onScan}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          Scan this page
        </button>
      )}
    </div>
  );
}
