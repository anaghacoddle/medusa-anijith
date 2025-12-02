import { PencilSquare, Trash } from "@medusajs/icons";
import { Container, toast, usePrompt } from "@medusajs/ui";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ActionMenu } from "../../../../../../components/common/action-menu";
import { DataTable } from "../../../../../../components/data-table";
import { LoyaltyConfig, useDeleteLoyaltyConfig } from "../../../../../../hooks/api/loyaltyConfig";
import { usePermission } from "../../../../../../hooks/use-permission";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 20;

type LoyaltyGeneralSectionProps = {
  loyaltyConfig: LoyaltyConfig;
};

export const LoyaltyGeneralSection = ({ loyaltyConfig }: LoyaltyGeneralSectionProps) => {
  const { t } = useTranslation();
  const columns = useColumns();

  return (
    <Container className="divide-y px-0 py-0">
      <DataTable
        data={loyaltyConfig ? [loyaltyConfig] : []}
        columns={columns}
        getRowId={row => row.id}
        rowCount={loyaltyConfig ? 1 : 0}
        pageSize={PAGE_SIZE}
        heading={"Loyalty Points"}
        subHeading="Loyalty points are calculated by dividing the purchase amount by the conversion rate (Amount ÷ Conversion Rate = Loyalty Points)."
        isLoading={false}
        enablePagination={false}
        enableSearch={false}
        // enableSorting={false}
        emptyState={{
          empty: {
            heading: "No loyalty configuration available",
            description: "There is currently no loyalty configuration to display.",
          },
          filtered: {
            heading: t("general.noResultsTitle"),
            description: t("general.noResultsMessage"),
          },
        }}
      />
    </Container>
  );
};

type LoyaltyConfigRowActionsProps = {
  loyaltyConfig: LoyaltyConfig;
};

const LoyaltyConfigRowActions = ({ loyaltyConfig }: LoyaltyConfigRowActionsProps) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const navigate = useNavigate();
  const prompt = usePrompt();

  // Call the hook at top level (pass the id here)
  const deleteMutation = useDeleteLoyaltyConfig(loyaltyConfig.id);

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description: `Are you sure you want to delete this loyalty configuration?`,
      verificationText: loyaltyConfig.region || loyaltyConfig.id, // same as in your first component
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!confirmed) return;

    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("regions.toast.delete"));
        navigate("/settings/loyalty-points");
      },
      onError: error => {
        console.error("Failed to delete loyalty config:", error);
      },
    });
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/settings/loyalty-points/${loyaltyConfig.id}/edit`,
              disabled:
                !hasPermission("/admin/loyalty-points", "PUT") ||
                !hasPermission("/admin/loyalty-points", "POST"),
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
              disabled: !hasPermission("/admin/loyalty-points", "DELETE"),
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
      columnHelper.accessor("id", {
        id: "sl_no",
        header: "Sl.No",
        cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
        enableSorting: false,
      }),
      columnHelper.accessor("region", {
        header: "currency",
        cell: ({ row }) => <span className="font-medium">{row.original.region}</span>,
        enableSorting: true,
      }),
      columnHelper.accessor("conversion_rate", {
        header: "Conversion Rate",
        cell: ({ row }) => <span className="font-medium">{row.original.conversion_rate}</span>,
        enableSorting: true,
      }),
      columnHelper.accessor("updated_at", {
        header: "Updated At",
        cell: ({ row }) =>
          row.original.updated_at ? new Date(row.original.updated_at).toLocaleDateString() : "-",
        enableSorting: true,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <LoyaltyConfigRowActions loyaltyConfig={row.original} />,
      }),
    ],
    []
  );
};
