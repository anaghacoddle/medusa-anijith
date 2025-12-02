import { PencilSquare, Eye } from "@medusajs/icons";
import { Container, Heading, Badge, Text, Button } from "@medusajs/ui";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { ActionMenu } from "../../../../../components/common/action-menu";
import { _DataTable } from "../../../../../components/table/data-table";
import { useDataTable } from "../../../../../hooks/use-data-table";
import { usePermission } from "../../../../../hooks/use-permission";
import { decryptObject } from "../../../../../utils/encryption";

const PAGE_SIZE = 20;

// Define Cart interface based on our API response
interface Cart {
  id: string;
  customer_id: string;
  email: string;
  currency_code: string;
  region_id: string;
  sales_channel_id: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  items?: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
    total: number;
    variant?: {
      id: string;
      title: string;
    };
  }>;
  region?: {
    id: string;
    name: string;
    currency_code: string;
  };
  sales_channel?: {
    id: string;
    name: string;
  };
}

interface CartsResponse {
  carts: Cart[];
  count: number;
  offset: number;
  limit: number;
  pagination: {
    total: number;
    page: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export const CartListTable = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const flattenCartsByItems = (carts: Cart[]) => {
    const flattenedRecords: Cart[] = [];

    carts.forEach(cart => {
      if (cart.items && cart.items.length > 0) {
        // Create a separate record for each item
        cart.items.forEach(item => {
          const cartRecord: Cart = {
            ...cart, // Copy all cart properties
            items: [item], // Only include this specific item
          };
          flattenedRecords.push(cartRecord);
        });
      } else {
        // If no items, still include the cart but with empty items array
        const cartRecord: Cart = {
          ...cart,
          items: [],
        };
        flattenedRecords.push(cartRecord);
      }
    });

    return flattenedRecords;
  };

  // Fetch carts data
  useEffect(() => {
    const fetchCarts = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          limit: PAGE_SIZE.toString(),
          offset: "0",
        });

        const response = await fetch(`/admin/carts?${queryParams}`);
        const data: CartsResponse = await response.json();

        const excludeKeys = [
          "id",
          "customer_id",
          "currency_code",
          "region_id",
          "sales_channel_id",
          "created_at",
          "updated_at",
          "completed_at",
          "customer.id",
          "items.id",
          "items.quantity",
          "items.unit_price",
          "items.total",
          "region.id",
          "region.currency_code",
          "sales_channel.id",
        ];

        // setCarts(data.carts || []);

        if (data.carts && data.carts.length > 0) {
          // Decrypt each cart object
          const decryptedCarts = await Promise.all(
            data.carts.map(async cart => {
              try {
                const decryptedCart = await decryptObject(cart, excludeKeys);
                return decryptedCart as Cart;
              } catch (error) {
                console.error(`Error decrypting cart ${cart.id}:`, error);
                // Return original cart if decryption fails
                return cart;
              }
            })
          );
          const flattenedCarts = flattenCartsByItems(decryptedCarts);
          setCarts(flattenedCarts);
          setCount(flattenedCarts.length); // Update count to reflect flattened records
        } else {
          setCarts([]);
          setCount(0);
        }
        // setCount(data.count || 0);
      } catch (error) {
        console.error("Error fetching carts:", error);
        setCarts([]);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarts();
  }, []);

  const columns = useColumns();

  const { table } = useDataTable({
    data: carts,
    columns,
    count,
    enablePagination: true,
    getRowId: row => row.id,
    pageSize: PAGE_SIZE,
  });

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("carts.domain", "Carts")}</Heading>
        <div className="flex items-center justify-center gap-x-2">
          <Button size="small" variant="secondary" asChild>
            <Link to={`export${location.search}`}>{t("actions.export", "Export")}</Link>
          </Button>
        </div>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        orderBy={[
          { key: "created_at", label: t("fields.createdAt", "Created At") },
          { key: "updated_at", label: t("fields.updatedAt", "Updated At") },
          { key: "email", label: t("fields.customerEmail", "Customer Email") },
          { key: "currency_code", label: t("fields.currency", "Currency") },
        ]}
        isLoading={isLoading}
        navigateTo={row => row.original.id}
        search
        noRecords={{
          message: t("carts.list.noRecordsMessage", "No carts found"),
        }}
      />
    </Container>
  );
};

const useColumns = () => {
  const { t } = useTranslation();
  const columnHelper = createColumnHelper<Cart>();

  return useMemo(
    () => [
      // Customer Name
      columnHelper.display({
        id: "customerName",
        header: t("fields.customerName", "Customer Name"),
        cell: ({ row }) => {
          const customer = row.original.customer;
          if (customer?.first_name || customer?.last_name) {
            const name = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
            return <Text size="small">{name}</Text>;
          }
          return (
            <Text size="small" className="text-ui-fg-muted">
              -
            </Text>
          );
        },
      }),

      // Customer Email
      columnHelper.display({
        id: "customerEmail",
        header: t("fields.customerEmail", "Customer Email"),
        cell: ({ row }) => {
          const customer = row.original.customer;
          const email = customer?.email || row.original.email || "-";
          return <Text size="small">{email}</Text>;
        },
      }),

      // Items
      columnHelper.accessor("items", {
        header: t("fields.item", "Item"),
        cell: ({ getValue }) => {
          const items = getValue() || [];
          if (items.length === 0) {
            return (
              <Text size="small" className="text-ui-fg-muted">
                No items
              </Text>
            );
          }
          // return (
          //   <Badge size="small" color="grey">
          //     {items.length} {items.length === 1 ? "item" : "items"}
          //   </Badge>
          // );
          const item = items[0];
          const productTitle = item?.title || "Unknown Product";
          const variantTitle = item?.variant?.title || "Default";

          return (
            <Text size="small">
              {productTitle} ({variantTitle})
            </Text>
          );
        },
      }),

      // Currency
      // columnHelper.accessor("currency_code", {
      //   header: t("fields.currency", "Currency"),
      //   cell: ({ getValue }) => {
      //     const currency = getValue();
      //     return (
      //       <Badge size="small" color="blue">
      //         {currency?.toUpperCase() || "-"}
      //       </Badge>
      //     );
      //   },
      // }),

      // Region
      columnHelper.display({
        id: "region",
        header: t("fields.region", "Region"),
        cell: ({ row }) => {
          const region = row.original.region;
          return <Text size="small">{region?.name || "-"}</Text>;
        },
      }),

      // Actions
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          return <CartActions cart={row.original} />;
        },
      }),
    ],
    [t, columnHelper]
  );
};

const CartActions = ({ cart }: { cart: Cart }) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <Eye />,
              label: t("actions.view", "View"),
              to: `/carts/${cart.customer_id}`,
            },
            ...(hasPermission("/admin/orders", "POST")
              ? [
                  {
                    icon: <PencilSquare />,
                    label: t("actions.edit", "Edit"),
                    to: `/carts/${cart.id}/edit`,
                  },
                ]
              : []),
          ],
        },
      ]}
    />
  );
};
