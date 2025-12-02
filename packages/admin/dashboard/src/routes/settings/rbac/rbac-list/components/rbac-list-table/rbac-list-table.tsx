import { Container, createDataTableColumnHelper } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PencilSquare } from "@medusajs/icons";

import { DataTable } from "../../../../../../components/data-table";
import { useDataTableDateColumns } from "../../../../../../components/data-table/helpers/general/use-data-table-date-columns";
import { useDataTableDateFilters } from "../../../../../../components/data-table/helpers/general/use-data-table-date-filters";
import { useRbacRoles, AdminRole } from "../../../../../../hooks/api/rbac";
import { useQueryParams } from "../../../../../../hooks/use-query-params";
import { usePermission } from "../../../../../../hooks/use-permission";

const PAGE_SIZE = 20;

export const RbacListTable = () => {
  const { t } = useTranslation();
  const { q, order, offset } = useQueryParams(["q", "order", "offset"]);
  const { roles, count, isPending, isError, error } = useRbacRoles(
    {
      q,
      order,
      offset: offset ? parseInt(offset) : 0,
      limit: PAGE_SIZE,
    },
    {
      placeholderData: keepPreviousData,
    }
  );
  const { hasPermission } = usePermission();
  const columns = useColumns();
  const filters = useFilters();

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0">
      <DataTable
        data={roles}
        columns={columns}
        filters={filters}
        getRowId={row => row.id}
        rowCount={count}
        pageSize={PAGE_SIZE}
        heading={"RBAC"}
        rowHref={row => `${row.id}`}
        isLoading={isPending}
        action={
          hasPermission("/admin/rbac", "POST") && {
            label: "Add Role",
            to: "create",
          }
        }
        emptyState={{
          empty: {
            heading: "No roles available",
            description: "There are currently no roles to display.",
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

const columnHelper = createDataTableColumnHelper<AdminRole>();

const useColumns = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const dateColumns = useDataTableDateColumns<AdminRole>();

  return useMemo(
    () =>
      [
        columnHelper.accessor("name", {
          header: t("fields.name"),
          cell: ({ row }) => {
            return (
              <span className="truncate max-w-[200px] block" title={row.original.name || "-"}>
                {row.original.name || "-"}
              </span>
            );
          },
          enableSorting: true,
          sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
          sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
        }),
        ...dateColumns,
        hasPermission("/admin/rbac", "PUT") &&
          columnHelper.action({
            actions: [
              {
                label: t("actions.edit"),
                icon: <PencilSquare />,
                onClick: ctx => {
                  navigate(`${ctx.row.original.id}/edit`);
                },
              },
            ],
          }),
      ].filter(Boolean),
    [t, dateColumns, navigate, hasPermission]
  );
};

const useFilters = () => {
  const dateFilters = useDataTableDateFilters();

  return useMemo(() => {
    return dateFilters;
  }, [dateFilters]);
};
