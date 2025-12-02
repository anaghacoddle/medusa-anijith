import { HttpTypes } from "@medusajs/types";
import { UIMatch } from "react-router-dom";

import { useCustomer } from "../../../hooks/api";
import { decryptObject } from "../../../utils/encryption";
import { useState, useEffect } from "react";

type CustomerDetailBreadcrumbProps = UIMatch<HttpTypes.AdminCustomerResponse>;

export const CustomerDetailBreadcrumb = (props: CustomerDetailBreadcrumbProps) => {
  // const { id } = props.params || {};
  const id = props.params?.id;

  const [decryptedCustomer, setDecryptedCustomer] = useState<HttpTypes.AdminCustomer | null>(null);

  const { customer } = useCustomer(id!, undefined, {
    initialData: props.data,
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (customer) {
      decryptObject(customer).then(result => {
        setDecryptedCustomer(result as HttpTypes.AdminCustomer);
      });
    }
  }, [customer]);

  if (!customer) {
    return null;
  }

  const name = [decryptedCustomer?.first_name, decryptedCustomer?.last_name]
    .filter(Boolean)
    .join(" ");

  const display = name || decryptedCustomer?.email;

  return <span>{display}</span>;
};
