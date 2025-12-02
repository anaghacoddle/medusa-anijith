/* eslint-disable react-hooks/exhaustive-deps */
import { ArrowPath } from "@medusajs/icons";
import { Container, Heading, toast, usePrompt, Badge } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "react-router-dom";

import { HttpTypes } from "@medusajs/types";
import { ActionMenu } from "../../../../components/common/action-menu";
import { _DataTable as DataTable } from "../../../../components/table/data-table";
import { useDeletedProducts, useRestoreProduct } from "../../../../hooks/api/products";
import { useProductTableColumns } from "../../../../hooks/table/columns/use-product-table-columns";
import { useProductTableFilters } from "../../../../hooks/table/filters/use-product-table-filters";
import { useDataTable } from "../../../../hooks/use-data-table";
import { usePermission } from "../../../../hooks/use-permission";

const PAGE_SIZE = 20;
const columnHelper = createColumnHelper<HttpTypes.AdminProduct>();

// Custom hook for deleted products table query (similar to useProductTableQuery)
const useDeletedProductTableQuery = ({ pageSize }: { pageSize: number }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const now = new Date();
  const futureBuffer = new Date(now.getTime() + 5 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const queryObject = useMemo(() => {
    const params: any = {
      deleted_at: {
        $gte: thirtyDaysAgo.toISOString(),
        $lte: futureBuffer.toISOString(),
      },
      is_giftcard: false,
      limit: pageSize,
      fields: "id,title,handle,status,*collection,*sales_channels,variants.id,thumbnail,deleted_at",
    };

    // search
    const q = searchParams.get("q");
    if (q) {
      params.q = q;
    }

    // pagination → convert page → offset
    const page = Number(searchParams.get("page") || "1");
    params.offset = (page - 1) * pageSize;

    // ordering
    const order = searchParams.get("order");
    if (order) {
      params.order = order;
    }

    // handle other filters
    searchParams.forEach((value, key) => {
      if (!["q", "page", "order"].includes(key)) {
        try {
          // ✅ special cases for array-based filters
          if (key === "sales_channel_id" || key === "status") {
            params[key] = [value]; // force into array
          } else {
            params[key] = JSON.parse(value);
          }
        } catch {
          params[key] = value;
        }
      }
    });

    return params;
  }, [location.search, pageSize]);

  // Create a queryObject for _DataTable that preserves search/filter state
  // This ensures the filter section stays visible even when no data is returned
  const tableQueryObject = useMemo(() => {
    const tableQuery: Record<string, any> = {};

    // Include search query if present
    const q = searchParams.get("q");
    if (q) {
      tableQuery.q = q;
    }

    // Include pagination
    const page = searchParams.get("page");
    if (page && page !== "1") {
      tableQuery.page = page;
    }

    // Include ordering
    const order = searchParams.get("order");
    if (order) {
      tableQuery.order = order;
    }

    // Include other filters
    searchParams.forEach((value, key) => {
      if (!["q", "page", "order"].includes(key) && value) {
        tableQuery[key] = value;
      }
    });

    return tableQuery;
  }, [searchParams]);

  return {
    searchParams: queryObject,
    raw: tableQueryObject, // Use the cleaned queryObject for the table
  };
};

const useDeletedProductColumns = () => {
  const base = useProductTableColumns();
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      ...base,
      columnHelper.accessor("deleted_at", {
        header: () => t("fields.deletedAt", "Deleted At"),
        cell: ({ getValue }) => {
          const value = getValue();
          return value ? new Date(value).toLocaleDateString() : "-";
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <DeletedProductActions product={row.original} />;
        },
      }),
    ],
    [base, t]
  );

  return columns;
};

export const DeletedProductsSection = () => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  const { searchParams, raw } = useDeletedProductTableQuery({ pageSize: PAGE_SIZE });

  const {
    products: deletedProducts = [], // Default to empty array
    count = 0,
    isLoading,
    isError,
    error,
  } = useDeletedProducts(searchParams, {
    placeholderData: keepPreviousData,
    enabled: isExpanded,
  });

  const filters = useProductTableFilters();
  const columns = useDeletedProductColumns();

  const { table } = useDataTable({
    data: deletedProducts,
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: row => row.id,
  });

  if (isError && isExpanded) {
    throw error;
  }

  const { hasPermission } = usePermission();

  if (!hasPermission("/admin/products", "PUT")) {
    return null;
  }

  return (
    <Container className="divide-y p-0 mt-6">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-3">
          <Heading level="h2">
            {t("products.deletedProducts.title", "Recently Deleted Products")}
          </Heading>
          <Badge size="small">{count}</Badge>
        </div>
      </div>

      <DataTable
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        filters={filters}
        search
        pagination
        isLoading={isLoading}
        queryObject={raw}
        orderBy={[
          { key: "title", label: t("fields.title") },
          { key: "deleted_at", label: t("fields.deletedAt", "Deleted At") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
      />
      <Outlet />
    </Container>
  );
};

const DeletedProductActions = ({ product }: { product: HttpTypes.AdminProduct }) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useRestoreProduct(product.id);
  const { hasPermission } = usePermission();

  const handleRestore = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.restoreWarning", {
        title: product.title,
        defaultValue: `Are you sure you want to restore "${product.title}"? This will make the product active again.`,
      }),
      confirmText: t("actions.restore", "Restore"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("products.toasts.restore.success.header", "Product restored"), {
          description: t("products.toasts.restore.success.description", {
            title: product.title,
            defaultValue: `"${product.title}" has been restored successfully`,
          }),
        });
      },
      onError: e => {
        toast.error(t("products.toasts.restore.error.header", "Failed to restore product"), {
          description: e.message,
        });
      },
    });
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <ArrowPath />,
              label: t("actions.restore", "Restore"),
              disabled: !product.id || !hasPermission("/admin/products", "PUT"),
              onClick: handleRestore,
            },
          ],
        },
      ]}
    />
  );
};
