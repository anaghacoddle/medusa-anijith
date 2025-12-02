import { Button, DropdownMenu } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

type DeleteFilterGroupProps = {
  filters: Record<string, string>; // key -> label
  value?: Record<string, string | null>; // active filters
  onFilterChange?: (filters: Record<string, string | null>) => void;
};

export const DeleteFilterGroup = ({
  filters,
  value = {},
  onFilterChange,
}: DeleteFilterGroupProps) => {
  const { t } = useTranslation();
  const filterKeys = Object.keys(filters);

  if (filterKeys.length === 0) return null;

  const activeFilters = value;
  const hasActiveFilters = Object.values(activeFilters).some(v => v);
  const availableKeys = filterKeys.filter(key => !activeFilters[key]);

  // Add filter
  const handleAddFilter = (key: string) => {
    const newFilters = { ...activeFilters, [key]: filters[key] }; // store label as value
    onFilterChange?.(newFilters);
  };

  // Remove filter
  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    onFilterChange?.(newFilters);
  };

  // Clear all
  const handleClearAll = () => {
    onFilterChange?.({});
  };

  return (
    <div className="flex items-center flex-wrap gap-2">
      {/* Active filter chips */}
      {Object.entries(activeFilters).map(([key, val]) => {
        if (!val) return null;
        return (
          <div
            key={key}
            className="flex items-center gap-1 bg-ui-bg-subtle rounded-md px-2 py-1 text-sm"
          >
            <span className="text-ui-fg-subtle capitalize">{filters[key]}</span>
            <Button
              variant="transparent"
              size="small"
              onClick={() => handleRemoveFilter(key)}
              className="h-4 w-4 p-0 ml-1"
            >
              ×
            </Button>
          </div>
        );
      })}

      {/* Add filter dropdown */}
      {availableKeys.length > 0 && (
        <DeleteAddFilterMenu
          availableKeys={availableKeys}
          filters={filters}
          onAdd={handleAddFilter}
        />
      )}

      {/* Clear all button */}
      {hasActiveFilters && (
        <Button variant="transparent" size="small" onClick={handleClearAll}>
          {t("actions.clearAll", "Clear all")}
        </Button>
      )}
    </div>
  );
};

type DeleteAddFilterMenuProps = {
  availableKeys: string[];
  filters: Record<string, string>;
  onAdd: (key: string) => void;
};

const DeleteAddFilterMenu = ({ availableKeys, filters, onAdd }: DeleteAddFilterMenuProps) => {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary" size="small">
          {t("filters.addFilter", "Add filter")}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {availableKeys.map(key => (
          <DropdownMenu.Item key={key} onClick={() => onAdd(key)}>
            <span className="capitalize">{filters[key]}</span>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};
