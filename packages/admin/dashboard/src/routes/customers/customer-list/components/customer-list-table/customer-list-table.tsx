import { ArrowPath } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { HttpTypes } from "@medusajs/types";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { _DataTable } from "../../../../../components/table/data-table";
import { useCustomers } from "../../../../../hooks/api/customers";
import { useCustomerTableColumns } from "../../../../../hooks/table/columns/use-customer-table-columns";
import { useCustomerTableFilters } from "../../../../../hooks/table/filters/use-customer-table-filters";
import { useCustomerTableQuery } from "../../../../../hooks/table/query/use-customer-table-query";
import { useDataTable } from "../../../../../hooks/use-data-table";
import { usePermission } from "../../../../../hooks/use-permission";
import { decryptObject } from "../../../../../utils/encryption";
import { toast, usePrompt } from "@medusajs/ui";
import { useDataTableDateColumns } from "../../../../../components/data-table/helpers/general/use-data-table-date-columns";

const PAGE_SIZE = 20;
export const maskEmail = (email: string) => {
  if (!email) return "";
  const [localPart, domain] = email.split("@");
  if (!domain) return email;

  const visibleChars = Math.min(3, localPart.length);

  const maskCount = Math.min(localPart.length - visibleChars, 5);

  const maskedLocal = localPart.slice(0, visibleChars) + "*".repeat(maskCount);

  return `${maskedLocal}@${domain}`;
};

export const CustomerListTable = () => {
  const [decryptedCustomers, setDecryptedCustomers] = useState<HttpTypes.AdminCustomer[]>([]);

  const { t } = useTranslation();
  const prompt = usePrompt();
  const { searchParams, raw } = useCustomerTableQuery({ pageSize: PAGE_SIZE });
  const { customers, count, isLoading, isError, error } = useCustomers(
    {
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    }
  );

  const resetQrCode = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/admin/reset_customer?customer_id=${userId}`, {
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
    },
    [t]
  );

  const handleResetQrCode = useCallback(
    async (customer: HttpTypes.AdminCustomer) => {
      const email = customer.email;
      const res = await prompt({
        title: t("general.areYouSure"),
        description: t("users.resetQrWarning", {
          email,
        }),
        verificationText: email,
        verificationInstruction: t("general.typeToConfirm"),
        confirmText: t("actions.resetqr"),
        cancelText: t("actions.cancel"),
      });

      if (!res) {
        return;
      }

      await resetQrCode(customer.id);
    },
    [prompt, t, resetQrCode]
  );

  const filters = useCustomerTableFilters();
  const { hasPermission, user } = usePermission();
  const routePermissions = (user as any)?.role?.routePermissions || {};
  const columns = useColumns(handleResetQrCode, hasPermission);
  // only customers with account will show in the user list filter is done for the same.
  useEffect(() => {
    if (customers) {
      Promise.all(
        customers
          .filter(customer => customer.has_account === true)
          .map(async customer => {
            const decrypted = await decryptObject(customer);

            if (decrypted.email) {
              decrypted.email = maskEmail(decrypted.email);
            }

            return decrypted;
          })
      ).then(result => {
        setDecryptedCustomers(result as HttpTypes.AdminCustomer[]);
      });
    } else {
      setDecryptedCustomers([]);
    }
  }, [customers]);

  const { table } = useDataTable({
    data: decryptedCustomers ?? [],
    columns,
    count,
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
        <Heading>{t("customers.domain")}</Heading>
        {/* {hasPermission("/admin/customers", "POST") && (
          <Button size="small" variant="secondary" asChild>
            <Link to="create">{t("actions.create")}</Link>
          </Button>
        )} */}
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count}
        filters={filters}
        orderBy={
          hasPermission("/admin/customers", "GET") &&
          (routePermissions["/admin/customers"]?.includes("full_access") ||
            routePermissions["/admin"]?.includes("ALL"))
            ? [
                { key: "email", label: t("fields.email") },
                { key: "first_name", label: t("fields.name") },
                { key: "has_account", label: t("customers.hasAccount") },
                { key: "created_at", label: t("fields.createdAt") },
              ]
            : [
                { key: "id", label: "Id" },
                { key: "has_account", label: t("customers.hasAccount") },
                { key: "created_at", label: t("fields.createdAt") },
              ]
        }
        isLoading={isLoading}
        navigateTo={row => row.original.id}
        search
        queryObject={raw}
        noRecords={{
          message: t("customers.list.noRecordsMessage"),
        }}
      />
    </Container>
  );
};

const CustomerActions = ({
  customer,
  onResetQrCode,
  hasPermission,
}: {
  customer: HttpTypes.AdminCustomer;
  onResetQrCode: (customer: HttpTypes.AdminCustomer) => void;
  hasPermission: (resource: string, action: string) => boolean;
}) => {
  const { t } = useTranslation();

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            // {
            //   icon: <PencilSquare />,
            //   label: t("actions.edit"),
            //   to: `/customers/${customer.id}/edit`,
            //   disabled:
            //     !hasPermission("/admin/customers", "PUT") ||
            //     !hasPermission("/admin/customers", "POST"),
            // },
            {
              icon: <ArrowPath />,
              label: t("actions.resetqr"),
              onClick: () => onResetQrCode(customer),
              disabled: !hasPermission("/admin/customers", "PUT"),
            },
          ],
        },
      ]}
    />
  );
};

const columnHelper = createColumnHelper<HttpTypes.AdminCustomer>();

const useColumns = (
  onResetQrCode: (customer: HttpTypes.AdminCustomer) => void,
  hasPermission: (resource: string, action: string) => boolean
) => {
  const columns = useCustomerTableColumns();
  const dateColumns = useDataTableDateColumns<HttpTypes.AdminCustomer>();

  return useMemo(
    () => [
      ...columns,
      ...dateColumns,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <CustomerActions
            customer={row.original}
            onResetQrCode={onResetQrCode}
            hasPermission={hasPermission}
          />
        ),
      }),
    ],
    [columns, onResetQrCode, hasPermission, dateColumns]
  );
};
