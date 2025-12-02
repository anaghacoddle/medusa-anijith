import { Heading, Text } from "@medusajs/ui";
import { DataTableFilter } from "../../../../components/table/data-table/data-table-filter";
import { useTranslation } from "react-i18next";
import { useCartTableFilters } from "../../../../hooks/table/filters";

export const ExportFilters = () => {
  const { t } = useTranslation();
  const filters = useCartTableFilters();

  return (
    <div>
      <Heading level="h2">{t("carts.export.filters.title", "Filters")}</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        {t(
          "carts.export.filters.description",
          "Choose which carts to export based on the filters below."
        )}
      </Text>

      <div className="mt-4">
        <DataTableFilter filters={filters} readonly />
      </div>
    </div>
  );
};
