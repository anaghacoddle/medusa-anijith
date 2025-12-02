import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { decryptObject } from "../../../utils/encryption";
import { useEffect, useState } from "react";

import { RouteDrawer } from "../../../components/modals";
import { useOrder } from "../../../hooks/api";
import { DEFAULT_FIELDS } from "../order-detail/constants";
import { EditOrderBillingAddressForm } from "./components/edit-order-billing-address-form";

export const OrderEditBillingAddress = () => {
  const { t } = useTranslation();
  const params = useParams();

  const { order, isPending, isError, error } = useOrder(params.id!, {
    fields: DEFAULT_FIELDS,
  });

  const [decryptedOrder, setDecryptedOrder] = useState<any>(null);

  useEffect(() => {
    const run = async () => {
      if (order) {
        const result = await decryptObject(order);
        console.log("Decrypted order for Edit Billing Address:", result);
        setDecryptedOrder(result);
      }
    };
    run();
  }, [order]);

  // Handle error state
  if (!isPending && isError) {
    throw error;
  }

  // Loading state while decrypting
  if (!decryptedOrder) {
    return (
      <RouteDrawer>
        <RouteDrawer.Header>
          <Heading>{t("orders.edit.billingAddress.title")}</Heading>
        </RouteDrawer.Header>

        <div className="px-6 py-4 text-ui-fg-muted">Loading…</div>
      </RouteDrawer>
    );
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("orders.edit.billingAddress.title")}</Heading>
      </RouteDrawer.Header>

      <EditOrderBillingAddressForm order={decryptedOrder} />
    </RouteDrawer>
  );
};
