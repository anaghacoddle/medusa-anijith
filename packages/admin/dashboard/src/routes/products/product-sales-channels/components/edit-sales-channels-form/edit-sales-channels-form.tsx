import { Button, createDataTableColumnHelper, toast } from "@medusajs/ui";
import { RowSelectionState } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { HttpTypes } from "@medusajs/types";
import { keepPreviousData } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { DataTable } from "../../../../../components/data-table";
import * as hooks from "../../../../../components/data-table/helpers/sales-channels";
import { RouteFocusModal, useRouteModal } from "../../../../../components/modals";
import { useUpdateProduct } from "../../../../../hooks/api/products";
import { useSalesChannels } from "../../../../../hooks/api/sales-channels";
import { usePermission } from "../../../../../hooks/use-permission";

type EditSalesChannelsFormProps = {
  product: HttpTypes.AdminProduct;
};

const EditSalesChannelsSchema = zod.object({
  sales_channels: zod.array(zod.string()).optional(),
});

const PAGE_SIZE = 50;
const PREFIX = "sc";

export const EditSalesChannelsForm = ({ product }: EditSalesChannelsFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<zod.infer<typeof EditSalesChannelsSchema>>({
    defaultValues: {
      sales_channels: product.sales_channels?.map(sc => sc.id) ?? [],
    },
    resolver: zodResolver(EditSalesChannelsSchema),
  });

  const { setValue } = form;

  const initialState =
    product.sales_channels?.reduce((acc, curr) => {
      acc[curr.id] = true;
      return acc;
    }, {} as RowSelectionState) ?? {};

  const [rowSelection, setRowSelection] = useState<RowSelectionState>(initialState);

  useEffect(() => {
    const ids = Object.keys(rowSelection);
    setValue("sales_channels", ids, {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [rowSelection, setValue]);

  const searchParams = hooks.useSalesChannelTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  });
  const { sales_channels, count, isLoading, isError, error } = useSalesChannels(
    {
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    }
  );

  const filters = hooks.useSalesChannelTableFilters();
  const emptyState = hooks.useSalesChannelTableEmptyState();
  const columns = useColumns();

  const { mutateAsync, isPending: isMutating } = useUpdateProduct(product.id);

  const handleSubmit = form.handleSubmit(async data => {
    try {
      const arr = data.sales_channels ?? [];

      const sales_channels = arr.map(id => {
        return {
          id,
        };
      });

      // Get original sales channel IDs
      const originalSalesChannelIds = product.sales_channels?.map(sc => sc.id) ?? [];
      const newSalesChannelIds = arr;

      // Check if there are any changes
      const hasChanges =
        originalSalesChannelIds.length !== newSalesChannelIds.length ||
        !originalSalesChannelIds.every(id => newSalesChannelIds.includes(id)) ||
        !newSalesChannelIds.every(id => originalSalesChannelIds.includes(id));

      if (!hasChanges) {
        toast.info("No changes detected");
        handleSuccess();
        return;
      }

      // Determine added and removed channels
      const addedChannels = newSalesChannelIds.filter(id => !originalSalesChannelIds.includes(id));
      const removedChannels = originalSalesChannelIds.filter(
        id => !newSalesChannelIds.includes(id)
      );

      // Build payload with changed values
      const payload = {
        sales_channels,
        additional_data: {
          changedValues: {
            sales_channels: sales_channels,
          },
          salesChannelChanges: {
            added: addedChannels,
            removed: removedChannels,
            total_before: originalSalesChannelIds.length,
            total_after: newSalesChannelIds.length,
          },
          product_details: {
            product_id: product.id,
            product_title: product.title,
            product_handle: product.handle,
            product_status: product.status,
          },
        },
      };

      await mutateAsync(payload, {
        onSuccess: () => {
          handleSuccess();
          toast.success("Sales channels updated successfully");
        },
        onError: error => {
          toast.error(error.message || "Failed to update sales channels");
        },
      });
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  });

  if (isError) {
    throw error;
  }

  const { hasPermission } = usePermission();

  return (
    <RouteFocusModal.Form form={form}>
      <div className="flex h-full flex-col overflow-hidden">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex-1 overflow-hidden">
          <DataTable
            data={sales_channels}
            columns={columns}
            getRowId={row => row.id}
            rowCount={count}
            isLoading={isLoading}
            filters={filters}
            rowSelection={{
              state: rowSelection,
              onRowSelectionChange: setRowSelection,
            }}
            autoFocusSearch
            layout="fill"
            emptyState={emptyState}
            prefix={PREFIX}
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              isLoading={isMutating}
              onClick={handleSubmit}
              disabled={!hasPermission("/admin/products", "POST")}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </div>
    </RouteFocusModal.Form>
  );
};

const columnHelper =
  createDataTableColumnHelper<HttpTypes.AdminSalesChannelResponse["sales_channel"]>();

const useColumns = () => {
  const columns = hooks.useSalesChannelTableColumns();

  return useMemo(() => [columnHelper.select(), ...columns], [columns]);
};
