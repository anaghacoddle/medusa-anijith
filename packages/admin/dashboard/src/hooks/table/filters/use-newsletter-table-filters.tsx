import { useDateTableFilters } from "./use-date-table-filters";

export const useNewsletterTableFilters = () => {
  const dateFilters = useDateTableFilters();

  return dateFilters;
};
