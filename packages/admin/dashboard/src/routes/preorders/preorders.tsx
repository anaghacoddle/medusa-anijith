import { Clock, Package } from "@medusajs/icons";
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { DataTable } from "../../../components/data-table";
import { usePreorderTableColumns } from "./components/use-preorder-table-columns";
import { usePreorders } from "../../../hooks/api/preorders";

export const Preorders = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = usePreorders();
  const columns = usePreorderTableColumns();

  if (error) {
    throw error;
  }

  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Clock className="text-ui-fg-subtle" />
          <Heading level="h1">{t("navigation.preorders")}</Heading>
        </div>
        <Badge color="orange">
          {data?.count || 0} {t("products.variant.preorders")}
        </Badge>
      </div>

      <div className="px-6 py-4">
        <DataTable
          columns={columns}
          data={data?.preorders || []}
          isLoading={isLoading}
          pagination
          search
          count={data?.count || 0}
          orderBy={{ created_at: "desc" }}
        />
      </div>
    </Container>
  );
};
