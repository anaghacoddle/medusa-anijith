import { Container, createDataTableColumnHelper, Button, Heading, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { DigitalProduct } from "../types";
import { usePermission } from "../../../../../hooks/use-permission";
import { useFormattedProducts } from "../../../../../hooks/api/sync-products";
import { _DataTable } from "../../../../../components/table/data-table";
import { useDataTable } from "../../../../../hooks/use-data-table";
import { useProductTableQuery } from "../../../../../hooks/table/query/use-product-table-query";
import { useProductTableFilters } from "../../../../../hooks/table/filters/use-product-table-filters";
import { StatusCell } from "../../../../../components/table/table-cells/common/status-cell";
import { ProductActions } from "../../../../products/product-list/components/product-list-table/product-list-table";
import { keepPreviousData } from "@tanstack/react-query";
import { useDigitalProducts } from "../../../../../hooks/api/digital-product";

const PAGE_SIZE = 20;

export const DigitalProductsListTable = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const { mutate, isPending } = useFormattedProducts();
  const { searchParams, raw } = useProductTableQuery({ pageSize: PAGE_SIZE });

  // Use the digital products hook instead of manual fetch
  const { digital_products, count, isLoading, isError, error } = useDigitalProducts(
    {
      q: searchParams.q,
      order: searchParams.order,
      offset: searchParams.offset,
      limit: PAGE_SIZE,
    },
    {
      placeholderData: keepPreviousData,
    }
  );

  const sync_access = hasPermission("/admin/digital-products", "sync");
  const handleSyncToCMS = () => {
    mutate(undefined, {
      onSuccess: () => {
        toast.success("Sync complete", {
          description: "Products successfully synced to CMS",
        });
      },
      onError: error => {
        toast.error("Sync failed", {
          description: "There was an error syncing to the CMS.",
        });
        console.error("Sync to CMS failed:", error);
      },
    });
  };

  const columnHelper = createDataTableColumnHelper<DigitalProduct>();

  const useColumns = () => {
    const { t } = useTranslation();

    return useMemo(
      () => [
        columnHelper.accessor("name", {
          header: t("fields.name"),
          cell: ({ row }) => (
            <span className="truncate max-w-[200px] block" title={row.original.name || "-"}>
              {row.original.name || "-"}
            </span>
          ),
          enableSorting: true,
          sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
          sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
        }),
        columnHelper.accessor("collection", {
          header: t("fields.collection"),
          cell: ({ row }) => (
            <span
              className="truncate max-w-[200px] block"
              title={row.original?.product_variant?.product?.collection?.title || "-"}
            >
              {row.original?.product_variant?.product?.collection?.title || "-"}
            </span>
          ),
          enableSorting: true,
          sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
          sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
        }),
        columnHelper.accessor("product_variant.sales_channels.name", {
          header: t("fields.sales_channels"),
          cell: ({ row }) => {
            const salesChannels = row.original?.product_variant?.product?.sales_channels;

            if (!salesChannels || !salesChannels.length) {
              return <span>-</span>;
            }

            const channels =
              salesChannels.length > 2
                ? `${salesChannels
                    .slice(0, 2)
                    .map(sc => sc.name)
                    .join(", ")} +${salesChannels.length - 2} more`
                : salesChannels.map(sc => sc.name).join(", ");

            const tooltipTitle = salesChannels.map(sc => sc.name).join(", ");

            return (
              <span className="truncate max-w-[200px] block" title={tooltipTitle}>
                {channels}
              </span>
            );
          },
          enableSorting: true,
          sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
          sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
        }),
        columnHelper.accessor("product_variant.product.status", {
          header: t("fields.status"),
          cell: ({ row }) => {
            const [color, text] = {
              draft: ["grey", t("products.productStatus.draft")],
              proposed: ["orange", t("products.productStatus.proposed")],
              published: ["green", t("products.productStatus.published")],
              rejected: ["red", t("products.productStatus.rejected")],
            }[row?.original?.product_variant?.product?.status] as [
              "grey" | "orange" | "green" | "red",
              string,
            ];
            return <StatusCell color={color}>{text}</StatusCell>;
          },
          enableSorting: true,
          sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
          sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
        }),
        columnHelper.display({
          id: "actions",
          cell: ({ row }) => {
            return <ProductActions product={row.original.product_variant?.product} />;
          },
        }),
      ],
      [t]
    );
  };

  const columns = useColumns();
  const filters = useProductTableFilters();

  const { table } = useDataTable({
    data: (digital_products ?? []) as DigitalProduct[],
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: row => row.id,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("digitalProducts.domain")}</Heading>
        <div className="flex items-center justify-center gap-x-2">
          {sync_access && (
            <Button size="small" variant="secondary" onClick={handleSyncToCMS} disabled={isPending}>
              {isPending ? "Syncing..." : "Sync"}
            </Button>
          )}

          {hasPermission("/admin/digital-products", "POST") && (
            <Button size="small" variant="secondary" asChild>
              <Link to="create">{t("actions.create")}</Link>
            </Button>
          )}
        </div>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        filters={filters}
        search
        pagination
        isLoading={isLoading}
        queryObject={raw}
        navigateTo={row => {
          const productId = row.original.product_variant?.product_id;
          return `/products/${productId}`;
        }}
        orderBy={[
          { key: "name", label: t("fields.name") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        noRecords={{
          message: t("products.list.noRecordsMessage"),
        }}
      />
    </Container>
  );
};
