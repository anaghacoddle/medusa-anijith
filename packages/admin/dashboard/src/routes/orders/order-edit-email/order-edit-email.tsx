import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { decryptObject } from "../../../utils/encryption";
import { useEffect, useState } from "react";
import { RouteDrawer } from "../../../components/modals";
import { useOrder } from "../../../hooks/api";
import { DEFAULT_FIELDS } from "../order-detail/constants";
import { EditOrderEmailForm } from "./components/edit-order-email-form";

export const OrderEditEmail = () => {
  const { t } = useTranslation();
  const params = useParams();

  const { order, isPending, isError, error } = useOrder(params.id!, {
    fields: DEFAULT_FIELDS,
  });

  const [decryptedOrder, setDecryptedOrder] = useState(null);

  useEffect(() => {
    const run = async () => {
      if (order) {
        try {
          const result = await decryptObject(order);
          const [encryptedEmailLocal, domain] = result.email.split("@");
          const decryptedEmailLocal = await decryptObject(encryptedEmailLocal);
          const decryptedEmail = `${decryptedEmailLocal}@${domain}`;
          result.email = decryptedEmail;
          setDecryptedOrder(result as any);
        } catch (err) {
          console.error("Error decrypting order:", err);
        }
      }
    };
    run();
  }, [order]);

  if (!isPending && isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("orders.edit.email.title")}</Heading>
      </RouteDrawer.Header>
      {decryptedOrder && <EditOrderEmailForm order={decryptedOrder} />}
    </RouteDrawer>
  );
};
