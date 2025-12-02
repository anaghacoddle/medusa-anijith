import { HttpTypes } from "@medusajs/types";
import { Container, createDataTableColumnHelper } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowPath, CircleMinus, PencilSquare, Trash } from "@medusajs/icons";
import { DataTable } from "../../../../../components/data-table";
import { useDataTableDateColumns } from "../../../../../components/data-table/helpers/general/use-data-table-date-columns";
import { useDataTableDateFilters } from "../../../../../components/data-table/helpers/general/use-data-table-date-filters";
import { useUsers } from "../../../../../hooks/api/users";
import { useQueryParams } from "../../../../../hooks/use-query-params";
import { usePermission } from "../../../../../hooks/use-permission";
import { toast, usePrompt } from "@medusajs/ui";
import { decryptObject } from "../../../../../utils/encryption";
import { useState, useEffect } from "react";

const PAGE_SIZE = 20;

export const UserListTable = () => {
  const { q, order, offset } = useQueryParams(["q", "order", "offset"]);
  const { users, count, isPending, isError, error } = useUsers(
    {
      q,
      order,
      offset: offset ? parseInt(offset) : 0,
      limit: PAGE_SIZE,
      fields: "+user_details.is_active",
    },
    {
      placeholderData: keepPreviousData,
    }
  );

  const { hasPermission } = usePermission();
  const { t } = useTranslation();
  const prompt = usePrompt();

  // Function to reset QR code
  const resetQrCode = async (userId: string) => {
    try {
      const res = await fetch(`/admin/reset-user?user_id=${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast.success(t("users.resetQrSuccess"));
    } catch (error: any) {
      toast.error(error.message || "Failed to reset QR code.");
    }
  };

  // Confirmation handler before resetting QR code
  const handleResetQrCode = async (user: HttpTypes.AdminUser) => {
    //const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    const email = user.email;
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("users.resetQrWarning", {
        email: email || user.email,
      }),
      verificationText: email || user.email,
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: t("actions.resetqr"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await resetQrCode(user.id);
  };

  const columns = useColumns(handleResetQrCode);

  const filters = useFilters();

  if (isError) {
    throw error;
  }

  const [decryptedUsers, setDecryptedUsers] = useState<HttpTypes.AdminUser[]>([]);

  useEffect(() => {
    if (users) {
      Promise.all(users.map(user => decryptObject(user))).then(result => {
        setDecryptedUsers(result as HttpTypes.AdminUser[]);
      });
    } else {
      setDecryptedUsers([]);
    }
  }, [users]);

  return (
    <Container className="divide-y p-0">
      <DataTable
        data={decryptedUsers}
        columns={columns}
        filters={filters}
        getRowId={row => row.id}
        rowCount={count}
        pageSize={PAGE_SIZE}
        heading={t("users.domain")}
        rowHref={row => `${row.id}`}
        isLoading={isPending}
        action={
          hasPermission("/admin/users", "POST")
            ? {
                label: t("users.invite"),
                to: "invite",
              }
            : undefined
        }
        emptyState={{
          empty: {
            heading: t("users.list.empty.heading"),
            description: t("users.list.empty.description"),
          },
          filtered: {
            heading: t("users.list.filtered.heading"),
            description: t("users.list.filtered.description"),
          },
        }}
      />
    </Container>
  );
};

const columnHelper = createDataTableColumnHelper<HttpTypes.AdminUser>();

const useColumns = (handleResetQrCode: (user: HttpTypes.AdminUser) => void) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = usePermission();

  const dateColumns = useDataTableDateColumns<HttpTypes.AdminUser>();

  return useMemo(
    () => [
      columnHelper.accessor("email", {
        header: t("fields.email"),
        cell: ({ row }) => row.original.email,
        enableSorting: true,
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      columnHelper.accessor("first_name", {
        header: t("fields.firstName"),
        cell: ({ row }) => row.original.first_name || "-",
        enableSorting: true,
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      columnHelper.accessor("last_name", {
        header: t("fields.lastName"),
        cell: ({ row }) => row.original.last_name || "-",
        enableSorting: true,
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      columnHelper.accessor("is_active", {
        header: t("Active / Suspended"),
        cell: ({ row }) => {
          const userDetails = row.original?.user_details;

          // Handle rows without user_details gracefully
          if (!userDetails) {
            console.log("No user_details found for:", row.original);
            return "N/A"; // or return "" if you want it empty
          }

          // Log inactive users (for debugging)
          if (userDetails.is_active === false) {
            console.log("Inactive user detected:", row.original);
          }

          return userDetails.is_active ? "Active" : "Suspended";
        },
        enableSorting: false,
        sortAscLabel: t("filters.sorting.alphabeticallyAsc"),
        sortDescLabel: t("filters.sorting.alphabeticallyDesc"),
      }),
      ...dateColumns,
      columnHelper.action({
        actions: [
          {
            label: t("actions.edit"),
            icon: <PencilSquare />,
            onClick: ctx => {
              navigate(`${ctx.row.original.id}/edit`);
            },
            disabled:
              !hasPermission("/admin/users", "PUT") || !hasPermission("/admin/users", "POST"),
          },
          {
            label: t("actions.resetqr"),
            icon: <ArrowPath />,
            onClick: ctx => handleResetQrCode(ctx.row.original),
            disabled: !hasPermission("/admin/users", "GET"),
            // tooltip: t("actions.resetqr"),
          },
        ],
      }),
      // columnHelper.action({
      //   actions: [
      //     {
      //       label: t("actions.edit"),
      //       icon: <PencilSquare />,
      //       onClick: ctx => {
      //         navigate(`${ctx.row.original.id}/edit`);
      //       },
      //       disabled:
      //         !hasPermission("/admin/users", "PUT") || !hasPermission("/admin/users", "POST"),
      //     },
      //     {
      //       label: t("actions.resetqr"),
      //       icon: <Trash />,
      //       onClick: ctx => handleResetQrCode(ctx.row.original),
      //       disabled: !hasPermission("/admin/users", "GET"),
      //       // Only show if qr_code exists
      //       hidden: (ctx: { row: { original: HttpTypes.AdminUser } }) => !ctx.row.original.id,
      //       // tooltip: t("actions.resetqr"),
      //     },
      //   ],
      // }),
    ],
    [t, navigate, dateColumns, hasPermission, handleResetQrCode]
  );
};

const useFilters = () => {
  const dateFilters = useDataTableDateFilters();

  return useMemo(() => dateFilters, [dateFilters]);
};
