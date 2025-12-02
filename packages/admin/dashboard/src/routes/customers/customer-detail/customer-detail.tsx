import { useLoaderData, useParams } from "react-router-dom";

import { SingleColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
import { useCustomer } from "../../../hooks/api/customers";
import { useExtension } from "../../../providers/extension-provider";
import { CustomerAddressSection } from "./components/customer-address-section/customer-address-section";
import { CustomerGeneralSection } from "./components/customer-general-section";
// import { CustomerGroupSection } from "./components/customer-group-section";
import { CustomerOrderSection } from "./components/customer-order-section";
import { customerLoader } from "./loader";
import { decryptObject } from "../../../utils/encryption";
import { useState, useEffect } from "react";
import type { HttpTypes } from "@medusajs/types";
import { usePermission } from "../../../hooks/use-permission";
import CustomerLoyaltySection from "./components/customer-loyalty-section/customer-loyalty-section";

export const CustomerDetail = () => {
  const { id } = useParams();

  const initialData = useLoaderData() as Awaited<ReturnType<typeof customerLoader>>;
  const { customer, isLoading, isError, error } = useCustomer(
    id!,
    { fields: "+*addresses" },
    { initialData }
  );

  const [decryptedCustomer, setDecryptedCustomer] = useState<HttpTypes.AdminCustomer | null>(null);

  // Get user permissions to determine access level
  const { user } = usePermission();
  const routePermissions = (user as any)?.role?.routePermissions || {};

  // Check if user has full access to customers route
  const hasFullAccess =
    routePermissions["/admin/customers"]?.includes("full_access") ||
    routePermissions["/admin"]?.includes("ALL");

  useEffect(() => {
    if (customer) {
      decryptObject(customer).then(result => {
        setDecryptedCustomer(result as HttpTypes.AdminCustomer);
      });
    }
  }, [customer]);

  const { getWidgets } = useExtension();

  if (isLoading || !customer) {
    return <SingleColumnPageSkeleton sections={2} showJSON={true} showMetadata={true} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <TwoColumnPage
      widgets={{
        before: getWidgets("customer.details.before"),
        after: getWidgets("customer.details.after"),
        sideAfter: getWidgets("customer.details.side.after"),
        sideBefore: getWidgets("customer.details.side.before"),
      }}
      data={customer}
      hasOutlet
      showJSON={true}
      showMetadata={true}
    >
      <TwoColumnPage.Main>
        {decryptedCustomer && (
          <>
            <CustomerGeneralSection customer={decryptedCustomer} partialAccess={!hasFullAccess} />

            <CustomerOrderSection customer={decryptedCustomer} />
          </>
        )}
      </TwoColumnPage.Main>

      <TwoColumnPage.Sidebar>
        {hasFullAccess && decryptedCustomer && (
          <CustomerAddressSection customer={decryptedCustomer} />
        )}
        <CustomerLoyaltySection customer={decryptedCustomer} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};
