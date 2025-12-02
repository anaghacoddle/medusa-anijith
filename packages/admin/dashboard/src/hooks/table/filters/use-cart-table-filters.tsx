import { useTranslation } from "react-i18next";
import { Filter } from "../../../components/table/data-table";
import { useDateTableFilters } from "./use-date-table-filters";

const excludeableFields = ["currency", "region", "status"] as const;

export const useCartTableFilters = (exclude?: (typeof excludeableFields)[number][]) => {
  const { t } = useTranslation();
  const dateFilters = useDateTableFilters();

  const isCurrencyExcluded = exclude?.includes("currency");
  const isRegionExcluded = exclude?.includes("region");
  const isStatusExcluded = exclude?.includes("status");

  let filters: Filter[] = [];

  if (!isCurrencyExcluded) {
    const currencyFilter: Filter = {
      key: "currency_code",
      label: t("fields.currency"),
      type: "select",
      multiple: true,
      options: [
        { label: "USD", value: "usd" },
        { label: "EUR", value: "eur" },
        { label: "GBP", value: "gbp" },
        { label: "CAD", value: "cad" },
        { label: "AUD", value: "aud" },
        { label: "JPY", value: "jpy" },
      ],
    };
    filters = [...filters, currencyFilter];
  }

  if (!isStatusExcluded) {
    const statusFilter: Filter = {
      key: "status",
      label: t("fields.status"),
      type: "select",
      multiple: true,
      options: [
        { label: t("carts.status.active", "Active"), value: "active" },
        { label: t("carts.status.completed", "Completed"), value: "completed" },
        { label: t("carts.status.abandoned", "Abandoned"), value: "abandoned" },
      ],
    };
    filters = [...filters, statusFilter];
  }

  const hasCustomerFilter: Filter = {
    key: "has_customer",
    label: t("fields.customer"),
    type: "select",
    options: [
      {
        label: t("carts.withCustomer", "With Customer"),
        value: "true",
      },
      {
        label: t("carts.guestCart", "Guest Cart"),
        value: "false",
      },
    ],
  };

  filters = [...filters, hasCustomerFilter, ...dateFilters];

  return filters;
};
