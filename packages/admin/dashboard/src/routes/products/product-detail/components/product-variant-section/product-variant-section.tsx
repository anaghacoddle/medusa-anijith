import { Buildings, Component, PencilSquare, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import {
  Badge,
  clx,
  Container,
  createDataTableColumnHelper,
  createDataTableCommandHelper,
  createDataTableFilterHelper,
  DataTableAction,
  toast,
  Tooltip,
  usePrompt,
} from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { CellContext } from "@tanstack/react-table";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DataTable } from "../../../../../components/data-table";
import { useDataTableDateColumns } from "../../../../../components/data-table/helpers/general/use-data-table-date-columns";
import { useDataTableDateFilters } from "../../../../../components/data-table/helpers/general/use-data-table-date-filters";
import { useDeleteVariantLazy, useProductVariants } from "../../../../../hooks/api/products";
import { useQueryParams } from "../../../../../hooks/use-query-params";
import { PRODUCT_VARIANT_IDS_KEY } from "../../../common/constants";
import { Thumbnail } from "../../../../../components/common/thumbnail";
import { usePermission } from "../../../../../hooks/use-permission";

type ProductVariantSectionProps = {
  product: HttpTypes.AdminProduct;
};

const PAGE_SIZE = 10;
const PREFIX = "pv";

export const ProductVariantSection = ({ product }: ProductVariantSectionProps) => {
  const { t } = useTranslation();

  const { q, order, offset, allow_backorder, manage_inventory, created_at, updated_at } =
    useQueryParams(
      ["q", "order", "offset", "manage_inventory", "allow_backorder", "created_at", "updated_at"],
      PREFIX
    );

  const { hasPermission } = usePermission();
  const filters = useFilters();
  const commands = useCommands();

  const { variants, count, isPending, isError, error } = useProductVariants(
    product.id,
    {
      q,
      order: order ? order : "variant_rank",
      offset: offset ? parseInt(offset) : undefined,
      limit: PAGE_SIZE,
      allow_backorder: allow_backorder ? JSON.parse(allow_backorder) : undefined,
      manage_inventory: manage_inventory ? JSON.parse(manage_inventory) : undefined,
      created_at: created_at ? JSON.parse(created_at) : undefined,
      updated_at: updated_at ? JSON.parse(updated_at) : undefined,
      fields:
        "title,sku,thumbnail,*options,created_at,*inventory_items.inventory.location_levels,inventory_quantity,manage_inventory,*digital_product",
    },
    {
      placeholderData: keepPreviousData,
    }
  );
  const columns = useColumns(product, hasPermission, variants);

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0">
      <DataTable
        data={variants}
        columns={columns}
        filters={filters}
        rowCount={count}
        getRowId={row => row.id}
        rowHref={row => `/products/${product.id}/variants/${row.id}`}
        pageSize={PAGE_SIZE}
        isLoading={isPending}
        heading={t("products.variants.header")}
        headingLevel="h2"
        emptyState={{
          empty: {
            heading: t("products.variants.empty.heading"),
            description: t("products.variants.empty.description"),
          },
          filtered: {
            heading: t("products.variants.filtered.heading"),
            description: t("products.variants.filtered.description"),
          },
        }}
        action={
          hasPermission("/admin/products", "POST")
            ? {
                label: t("actions.create"),
                to: `variants/create`,
              }
            : undefined
        }
        actionMenu={{
          groups: [
            {
              actions: [
                {
                  label: t("products.editPrices"),
                  to: `prices`,
                  icon: <PencilSquare />,
                  disabled: !hasPermission("/admin/products", "POST"),
                },
                {
                  label: t("inventory.stock.action"),
                  to: `stock`,
                  icon: <Buildings />,
                  disabled: !hasPermission("/admin/products", "POST"),
                },
              ],
            },
          ],
        }}
        commands={commands}
        prefix={PREFIX}
      />
    </Container>
  );
};

const columnHelper = createDataTableColumnHelper<HttpTypes.AdminProductVariant>();

const useColumns = (
  product: HttpTypes.AdminProduct,
  hasPermission: (route: string, method?: string) => boolean,
  variants: HttpTypes.AdminProductVariant[] | undefined
) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync } = useDeleteVariantLazy(product.id);
  const prompt = usePrompt();
  const [searchParams] = useSearchParams();

  const tableSearchParams = useMemo(() => {
    const filtered = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith(`${PREFIX}_`)) {
        filtered.append(key, value);
      }
    }
    return filtered;
  }, [searchParams]);

  const dateColumns = useDataTableDateColumns<HttpTypes.AdminProductVariant>();

  const handleDelete = useCallback(
    async (id: string, title: string) => {
      const res = await prompt({
        title: t("general.areYouSure"),
        description: t("products.deleteVariantWarning", {
          title,
        }),
        confirmText: t("actions.delete"),
        cancelText: t("actions.cancel"),
      });

      if (!res) {
        return;
      }

      try {
        await mutateAsync({ variantId: id });
        toast.success("Deleted successfully");
      } catch (error) {
        toast.error("Failed to delete. Please try again.");
        console.error(error);
      }
    },
    [mutateAsync, prompt, t]
  );

  const optionColumns = useMemo(() => {
    if (!product?.options) {
      return [];
    }

    return product.options.map(option => {
      return columnHelper.display({
        id: option.id,
        header: option.title,
        cell: ({ row }) => {
          const variantOpt = row.original.options?.find(opt => opt.option_id === option.id);

          if (!variantOpt) {
            return <span className="text-ui-fg-muted">-</span>;
          }

          return (
            <div className="flex items-center">
              <Tooltip content={variantOpt.value}>
                <Badge
                  size="2xsmall"
                  title={variantOpt.value}
                  className="inline-flex min-w-[20px] max-w-[140px] items-center justify-center overflow-hidden truncate"
                >
                  {variantOpt.value}
                </Badge>
              </Tooltip>
            </div>
          );
        },
      });
    });
  }, [product]);

  const getActions = useCallback(
    (ctx: CellContext<HttpTypes.AdminProductVariant, unknown>) => {
      const variant = ctx.row.original as HttpTypes.AdminProductVariant & {
        inventory_items: { inventory: HttpTypes.AdminInventoryItem }[];
      };

      const mainActions: DataTableAction<HttpTypes.AdminProductVariant>[] = [
        hasPermission("/admin/products", "POST")
          ? {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              onClick: (row: any) => {
                navigate(
                  `edit-variant?variant_id=${row.row.original.id}&${tableSearchParams.toString()}`,
                  {
                    state: {
                      restore_params: tableSearchParams.toString(),
                    },
                  }
                );
              },
            }
          : undefined,
      ].filter(Boolean) as DataTableAction<HttpTypes.AdminProductVariant>[];

      const secondaryActions: DataTableAction<HttpTypes.AdminProductVariant>[] = [
        hasPermission("/admin/products", "DELETE")
          ? {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: () => handleDelete(variant.id, variant.title!),
            }
          : undefined,
      ].filter(Boolean) as DataTableAction<HttpTypes.AdminProductVariant>[];

      const inventoryItemsCount = variant.inventory_items?.length || 0;

      switch (inventoryItemsCount) {
        case 0:
          break;
        case 1: {
          const inventoryItemLink = `/inventory/${variant.inventory_items![0].inventory.id}`;

          mainActions.push({
            label: t("products.variant.inventory.actions.inventoryItems"),
            onClick: () => {
              navigate(inventoryItemLink);
            },
            icon: <Buildings />,
          });
          break;
        }
        default: {
          const ids = variant.inventory_items?.map(i => i.inventory?.id);

          if (!ids || ids.length === 0) {
            break;
          }

          const inventoryKitLink = `/inventory?${new URLSearchParams({
            id: ids.join(","),
          }).toString()}`;

          mainActions.push({
            label: t("products.variant.inventory.actions.inventoryKit"),
            onClick: () => {
              navigate(inventoryKitLink);
            },
            icon: <Component />,
          });
        }
      }

      return [mainActions, secondaryActions];
    },
    [handleDelete, navigate, t, tableSearchParams, hasPermission]
  );

  const getInventory = useCallback(
    (variant: HttpTypes.AdminProductVariant) => {
      const castVariant = variant as HttpTypes.AdminProductVariant & {
        inventory_items: { inventory: HttpTypes.AdminInventoryItem }[];
      };

      if (!variant.manage_inventory) {
        return {
          text: t("products.variant.inventory.notManaged"),
          hasInventoryKit: false,
          notManaged: true,
        };
      }

      const itemSums = variant?.inventory_items.map(item => {
        const totalAvailable = item.inventory?.location_levels?.reduce(
          (sum, level) => sum + (level.available_quantity || 0),
          0
        );
        return {
          variant_id: item.variant_id,
          totalAvailable,
        };
      });

      const totalQuantity = itemSums.reduce((sum, item) => sum + item.totalAvailable, 0);

      const inventoryItems = castVariant.inventory_items
        ?.map(i => i.inventory)
        .filter(Boolean) as HttpTypes.AdminInventoryItem[];

      const hasInventoryKit = inventoryItems.length > 1;

      const locations: Record<string, boolean> = {};

      inventoryItems.forEach(i => {
        i.location_levels?.forEach(l => {
          locations[l.id] = true;
        });
      });

      const locationCount = Object.keys(locations).length;

      const text = hasInventoryKit
        ? t("products.variant.tableItemAvailable", {
            availableCount: totalQuantity,
          })
        : t("products.variant.tableItem", {
            availableCount: totalQuantity,
            locationCount,
            count: locationCount,
          });

      return { text, hasInventoryKit, totalQuantity, notManaged: false };
    },
    [t]
  );

  const hasDigitalProduct = variants?.some(variant => (variant as any).digital_product);

  return useMemo(() => {
    const columns = [
      columnHelper.accessor("thumbnail", {
        header: "",
        headerAlign: "center",
        maxSize: 72,
        cell: ({ row }) => (
          <div className="flex items-center pl-[1px]">
            <Thumbnail src={row.original.thumbnail} />
          </div>
        ),
      }),

      columnHelper.accessor("title", {
        header: t("fields.title"),
        enableSorting: true,
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),

      ...optionColumns,
    ];

    if (!hasDigitalProduct) {
      columns.push(
        columnHelper.accessor("sku", {
          header: t("fields.sku"),
          enableSorting: true,
          sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
          sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
        }),

        columnHelper.display({
          id: "inventory",
          header: t("fields.inventory"),
          cell: ({ row }) => {
            const { text, hasInventoryKit, totalQuantity, notManaged } = getInventory(row.original);

            return (
              <Tooltip content={text}>
                <div className="flex h-full w-full items-center gap-2 overflow-hidden">
                  {hasInventoryKit && <Component />}
                  <span
                    className={clx("truncate", {
                      "text-ui-fg-error": !totalQuantity && !notManaged,
                    })}
                  >
                    {text}
                  </span>
                </div>
              </Tooltip>
            );
          },
          maxSize: 250,
        })
      );
    }

    columns.push(
      columnHelper.action({
        actions: getActions,
      })
    );

    return columns;
  }, [t, optionColumns, getActions, getInventory, hasDigitalProduct]);
};

const filterHelper = createDataTableFilterHelper<HttpTypes.AdminProductVariant>();

const useFilters = () => {
  const { t } = useTranslation();
  const dateFilters = useDataTableDateFilters();

  return useMemo(() => {
    return [
      filterHelper.accessor("allow_backorder", {
        type: "radio",
        label: t("fields.allowBackorder"),
        options: [
          { label: t("filters.radio.yes"), value: "true" },
          { label: t("filters.radio.no"), value: "false" },
        ],
      }),
      filterHelper.accessor("manage_inventory", {
        type: "radio",
        label: t("fields.manageInventory"),
        options: [
          { label: t("filters.radio.yes"), value: "true" },
          { label: t("filters.radio.no"), value: "false" },
        ],
      }),
      ...dateFilters,
    ];
  }, [t, dateFilters]);
};

const commandHelper = createDataTableCommandHelper();

const useCommands = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return [
    commandHelper.command({
      label: t("inventory.stock.action"),
      shortcut: "i",
      action: async selection => {
        navigate(`stock?${PRODUCT_VARIANT_IDS_KEY}=${Object.keys(selection).join(",")}`);
      },
    }),
  ];
};
