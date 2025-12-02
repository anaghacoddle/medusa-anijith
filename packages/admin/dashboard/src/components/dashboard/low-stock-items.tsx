import { AlertTriangle, Package } from "lucide-react";
import { HttpTypes } from "@medusajs/types";

interface ExtendedInventoryLevel extends HttpTypes.AdminInventoryLevel {
  stock_locations?: {
    id: string;
    name: string;
  }[];
}

interface InventoryItem {
  id: string;
  location_levels?: ExtendedInventoryLevel[];
  variants?: HttpTypes.AdminProductVariant[];
}

interface LowStockItemsProps {
  items: HttpTypes.AdminInventoryItem[];
  isLoading?: boolean;
}

function LowStockCard({ item }: { item: InventoryItem }) {
  const locationLevels = item.location_levels || [];

  // Don't render anything if there are no location levels
  if (locationLevels.length === 0) {
    return null;
  }

  const totalAvailable = locationLevels.reduce(
    (sum, level) => sum + (level.available_quantity ?? 0),
    0
  );

  const hasNegativeStock = locationLevels.some(level => (level.available_quantity ?? 0) < 0);

  return (
    <div className="flex w-full bg-ui-bg-subtle text-ui-fg-subtle items-start gap-4 p-4">
      <div
        className="flex-1 w-full miLow Stock
n-w-0"
      >
        <div className="flex w-full items-start justify-between gap-4">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-medium break-all">
                {item?.variants?.[0]?.product?.title || item.id}
                {item?.variants?.[0]?.title && ` (${item.variants[0].title})`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {hasNegativeStock && (
              <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Negative Stock
              </span>
            )}
            {totalAvailable <= 3 && totalAvailable >= 0 && (
              <span className="text-xs font-semibold text-yellow-500">Low Stock</span>
            )}
          </div>
        </div>

        {locationLevels.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-gray-400">Locations:</p>
            {locationLevels.map(level => (
              <div
                key={level.id}
                className="flex items-center justify-between text-xs bg-ui-bg-base p-2 rounded"
              >
                <span className="text-gray-400 break-all">
                  {level?.stock_locations?.[0]?.name || level.id}
                </span>
                <div className="flex items-center gap-3 ml-2">
                  <span
                    className={`font-medium ${
                      (level.available_quantity ?? 0) < 0
                        ? "text-red-500"
                        : (level.available_quantity ?? 0) <= 3
                          ? "text-yellow-500"
                          : "text-green-500"
                    }`}
                  >
                    Avail: {level.available_quantity}
                  </span>
                  <span className="text-gray-500">Stock: {level.stocked_quantity}</span>
                  {level.reserved_quantity > 0 && (
                    <span className="text-blue-500">Reserved: {level.reserved_quantity}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LowStockItems({ items, isLoading }: LowStockItemsProps) {
  return (
    <div className="bg-ui-bg-subtle text-ui-fg-subtle rounded-lg shadow-elevation-card-rest">
      <div className="flex items-center justify-between p-6">
        <h3 className="text-lg font-semibold text-ui-fg-subtle">Low Stock Items</h3>
        <AlertTriangle className="h-5 w-5 text-yellow-500" />
      </div>

      <div className="divide-y shadow-elevation-card-rest max-h-96 overflow-y-auto">
        {items.length > 0 ? (
          items.map(item => <LowStockCard key={item.id} item={item} />)
        ) : isLoading ? (
          <p className="text-sm text-center py-4 text-gray-400">Loading items...</p>
        ) : (
          <p className="text-sm text-center py-4 text-gray-400">No low stock items</p>
        )}

        {isLoading && items.length > 0 && (
          <p className="text-sm text-center py-4 text-gray-400">Loading more...</p>
        )}
      </div>
    </div>
  );
}
