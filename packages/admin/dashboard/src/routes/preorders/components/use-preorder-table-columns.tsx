import { Clock, Package } from "@medusajs/icons";
import { Badge } from "@medusajs/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { DataTable } from "../../../../components/data-table";

type Preorder = {
  id: string;
  order_id: string;
  status: "pending" | "fulfilled" | "cancelled";
  item: {
    id: string;
    variant_id: string;
    available_date: string;
    status: "enabled" | "disabled";
  };
  created_at: string;
  updated_at: string;
};

export const usePreorderTableColumns = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      {
        id: "order_id",
        header: t("fields.order"),
        cell: ({ row }) => (
          <button
            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
            onClick={() => navigate(`/orders/${row.original.order_id}`)}
          >
            {row.original.order_id}
          </button>
        ),
      },
      {
        id: "variant_id",
        header: t("fields.variant"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Package className="text-ui-fg-subtle" />
            <span className="text-ui-fg-subtle">{row.original.item.variant_id}</span>
          </div>
        ),
      },
      {
        id: "status",
        header: t("fields.status"),
        cell: ({ row }) => {
          const status = row.original.status;
          const color =
            status === "fulfilled" ? "green" : status === "cancelled" ? "red" : "orange";

          return <Badge color={color}>{t(`products.variant.preorderStatus.${status}`)}</Badge>;
        },
      },
      {
        id: "available_date",
        header: t("fields.availableDate"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="text-ui-fg-subtle" />
            <span>{new Date(row.original.item.available_date).toLocaleDateString()}</span>
          </div>
        ),
      },
      {
        id: "created_at",
        header: t("fields.createdAt"),
        cell: ({ row }) => <span>{new Date(row.original.created_at).toLocaleDateString()}</span>,
      },
    ],
    [t, navigate]
  );

  return columns;
};
