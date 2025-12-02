import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { RouteDrawer } from "../../../components/modals";
import { useCustomer } from "../../../hooks/api/customers";
import { EditCustomerForm } from "./components/edit-customer-form";
import { decryptObject } from "../../../utils/encryption";
import { useState, useEffect } from "react";
import { HttpTypes } from "@medusajs/types";

export const CustomerEdit = () => {
  const { t } = useTranslation();

  const { id } = useParams();
  const { customer, isLoading, isError, error } = useCustomer(id!);

  if (isError) {
    throw error;
  }

  const [decryptedCustomer, setDecryptedCustomer] = useState<HttpTypes.AdminCustomer | null>(null);

  useEffect(() => {
    if (customer) {
      decryptObject(customer).then(result => {
        setDecryptedCustomer(result as HttpTypes.AdminCustomer);
      });
    }
  }, [customer]);

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("customers.edit.header")}</Heading>
      </RouteDrawer.Header>
      {!isLoading && decryptedCustomer && <EditCustomerForm customer={decryptedCustomer} />}
    </RouteDrawer>
  );
};
