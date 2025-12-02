import { PencilSquare, Trash } from "@medusajs/icons";
import { Button, Container, Heading, Text, toast, usePrompt } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useDataTable } from "../../../../../../hooks/use-data-table";
import { usePermission } from "../../../../../../hooks/use-permission";
import { ActionMenu } from "../../../../../../components/common/action-menu";
import {
  useDeleteLoyaltyConfig,
  useLoyaltyConfig,
} from "../../../../../../hooks/api/loyaltyConfig";
import { _DataTable } from "../../../../../../components/table/data-table";

// Define the LoyaltyConfig type based on your console data
interface LoyaltyConfig {
  id: string;
  conversion_rate: number;
  region: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const PAGE_SIZE = 20;

export const LoyaltyListTable = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();

  // Use your loyalty config hook
  const {
    data: loyaltyConfigs,
    isPending: isLoading,
    isError,
    error,
  } = useLoyaltyConfig({
    placeholderData: keepPreviousData,
  });

  const columns = useColumns();

  const data = (loyaltyConfigs ?? []) as LoyaltyConfig[];

  const { table } = useDataTable({
    data: (loyaltyConfigs ?? []) as LoyaltyConfig[],
    columns,
    count: data.length,
    enablePagination: true,
    getRowId: row => row.id,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Loyalty Configuration</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Manage loyalty point configurations for your currencies. Configure different loyalty
            points and rewards based on customer behavior and currency preferences
          </Text>
        </div>
        {hasPermission("/admin/loyalty-config", "POST") && (
          <Button size="small" variant="secondary" asChild>
            <Link to="create">{t("actions.create")}</Link>
          </Button>
        )}
      </div>

      <_DataTable
        table={table}
        columns={columns}
        count={data?.length ?? 0}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        navigateTo={row => `${row.original.id}`}
        pagination
        // search
        // noRecords={{
        //   message: t("regions.list.noRecordsMessage"),
        // }}
      />
    </Container>
  );
};

const LoyaltyActions = ({ loyaltyConfig }: { loyaltyConfig: LoyaltyConfig }) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { hasPermission } = usePermission();

  // ✅ bring in your mutation hook
  const deleteMutation = useDeleteLoyaltyConfig(loyaltyConfig.id);

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: `Are you sure you want to delete this loyalty configuration?`,
      verificationText: loyaltyConfig.region || loyaltyConfig.id,
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) return;

    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("regions.toast.delete"));
      },
      onError: (error: any) => {
        console.error("Delete failed:", error);
      },
    });
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: `${loyaltyConfig.id}/edit`,
              icon: <PencilSquare />,
              //   disabled:
              //     !hasPermission("/admin/loyalty-config", "PUT") &&
              //     !hasPermission("/admin/loyalty-config", "POST"),
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              onClick: handleDelete,
              icon: <Trash />,
              // disabled: !hasPermission("/admin/loyalty-config", "DELETE"),
            },
          ],
        },
      ]}
    />
  );
};

const columnHelper = createColumnHelper<LoyaltyConfig>();

const useColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("region", {
        header: "currency",
        cell: ({ getValue }) => {
          const region = getValue();
          return region || "N/A";
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <LoyaltyActions loyaltyConfig={row.original} />,
      }),
    ],
    []
  );
};
