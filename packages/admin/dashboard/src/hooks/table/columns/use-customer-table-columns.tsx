import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

import { EmailCell, EmailHeader } from "../../../components/table/table-cells/common/email-cell";
import { NameCell, NameHeader } from "../../../components/table/table-cells/common/name-cell";
import {
  AccountCell,
  AccountHeader,
} from "../../../components/table/table-cells/customer/account-cell/account-cell";
import {
  FirstSeenCell,
  FirstSeenHeader,
} from "../../../components/table/table-cells/customer/first-seen-cell";
import { HttpTypes } from "@medusajs/types";
import { usePermission } from "../../../hooks/use-permission";

const columnHelper = createColumnHelper<HttpTypes.AdminCustomer>();

export const useCustomerTableColumns = () => {
  const { user } = usePermission();
  const routePermissions = (user as any)?.role?.routePermissions || {};

  // Check if user has full access to customers route
  const hasFullAccess =
    routePermissions["/admin/customers"]?.includes("full_access") ||
    routePermissions["/admin"]?.includes("ALL");

  return useMemo(() => {
    if (hasFullAccess) {
      // Return full columns: email, name, Account, created
      return [
        columnHelper.accessor("email", {
          header: () => <EmailHeader />,
          cell: ({ getValue }) => <EmailCell email={getValue()} />,
        }),
        columnHelper.display({
          id: "name",
          header: () => <NameHeader />,
          cell: ({
            row: {
              original: { first_name, last_name },
            },
          }) => <NameCell firstName={first_name} lastName={last_name} />,
        }),
        columnHelper.accessor("has_account", {
          header: () => <AccountHeader />,
          cell: ({ getValue }) => <AccountCell hasAccount={getValue()} />,
        }),
        columnHelper.accessor("created_at", {
          header: () => <FirstSeenHeader />,
          cell: ({ getValue }) => <FirstSeenCell createdAt={getValue()} />,
        }),
      ];
    } else {
      // Return limited columns: Id, Account, created
      return [
        columnHelper.accessor("id", {
          header: () => <span>Id</span>,
          cell: ({ getValue }) => <span>{getValue()}</span>,
        }),
        columnHelper.accessor("has_account", {
          header: () => <AccountHeader />,
          cell: ({ getValue }) => <AccountCell hasAccount={getValue()} />,
        }),
        columnHelper.accessor("created_at", {
          header: () => <FirstSeenHeader />,
          cell: ({ getValue }) => <FirstSeenCell createdAt={getValue()} />,
        }),
      ];
    }
  }, [hasFullAccess]);
};
