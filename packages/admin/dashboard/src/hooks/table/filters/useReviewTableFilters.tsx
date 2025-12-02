import { useTranslation } from "react-i18next";
import { Filter } from "../../../components/table/data-table";

export const useReviewTableFilters = () => {
  const { t } = useTranslation();

  const statusFilter: Filter = {
    key: "status",
    label: t("fields.status"),
    type: "select",
    multiple: true,
    options: [
      {
        label: t("reviews.reviewStatus.pending", "Pending"),
        value: "pending",
      },
      {
        label: t("reviews.reviewStatus.approved", "Approved"),
        value: "approved",
      },
      {
        label: t("reviews.reviewStatus.rejected", "Rejected"),
        value: "rejected",
      },
    ],
  };

  const ratingFilter: Filter = {
    key: "rating",
    label: t("fields.rating", "Rating"),
    type: "select",
    multiple: true,
    options: [
      {
        label: "1 Star",
        value: "1",
      },
      {
        label: "2 Stars",
        value: "2",
      },
      {
        label: "3 Stars",
        value: "3",
      },
      {
        label: "4 Stars",
        value: "4",
      },
      {
        label: "5 Stars",
        value: "5",
      },
    ],
  };

  const dateFilters: Filter[] = [
    { label: t("fields.createdAt"), key: "created_at" },
    { label: t("fields.updatedAt"), key: "updated_at" },
  ].map(f => ({
    key: f.key,
    label: f.label,
    type: "date",
  }));

  const filters: Filter[] = [statusFilter, ratingFilter, ...dateFilters];

  return filters;
};
