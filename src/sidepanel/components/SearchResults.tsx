import type { KronanProduct } from "@/types/kronan";

interface SearchResultsProps {
  products: KronanProduct[];
  selectedSku: string | null;
  onSelect: (sku: string) => void;
  onClose: () => void;
}

export function SearchResults({
  products,
  selectedSku,
  onSelect,
  onClose,
}: SearchResultsProps) {
  if (products.length === 0) {
    return (
      <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-500">
        No products found. Try adjusting the search.
      </div>
    );
  }

  return (
    <div className="mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden z-10">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Choose product
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>
      <ul className="max-h-56 overflow-y-auto">
        {products.map((p) => (
          <li key={p.sku}>
            <button
              onClick={() => {
                onSelect(p.sku);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                p.sku === selectedSku
                  ? "bg-green-50 dark:bg-green-900/30"
                  : ""
              }`}
            >
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt=""
                  className="w-10 h-10 object-contain rounded flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {p.name}
                </div>
                {p.brand && (
                  <div className="text-xs text-gray-400">{p.brand}</div>
                )}
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
                {p.price.toLocaleString("is-IS")} kr
              </div>
              {p.sku === selectedSku && (
                <span className="text-green-600 text-sm">✓</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
