interface ExtractingViewProps {
  label?: string;
}

export function ExtractingView({ label = "Scanning recipe…" }: ExtractingViewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
