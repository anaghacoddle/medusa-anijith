import { AdminOrder } from "@medusajs/types";
import { Heading, StatusBadge, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useOrderPreorders } from "../../../../../hooks/api/preorders";
import { Thumbnail } from "../../../../../components/common/thumbnail";
import { LinkButton } from "../../../../../components/common/link-button";

type OrderPreorderSectionProps = {
  order: AdminOrder;
};

export const OrderPreorderSection = ({ order }: OrderPreorderSectionProps) => {
  console.log("order", order);
  const { t } = useTranslation();
  const { data, isLoading } = useOrderPreorders(order.id);

  const preorders = data?.preorders || [];
  console.log("preorders", preorders);
  // Don't show section if no preorders
  if (!isLoading && preorders.length === 0) {
    return null;
  }

  // Format date for display (M/D/YYYY format like in the image)
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "fulfilled":
        return "green";
      case "cancelled":
        return "red";
      case "pending":
      default:
        return "orange";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "fulfilled":
        return "Fulfilled";
      case "cancelled":
        return "Cancelled";
      case "pending":
      default:
        return "Pending";
    }
  };

  return (
    <div className="shadow-elevation-card-rest bg-ui-bg-base w-full rounded-lg flex flex-col gap-y-4 px-6 py-4">
      {/* Header */}
      <div className="mb-0">
        <Heading level="h2" className="font-sans font-medium h2-core pb-4">
          {t("orders.preorder.header")}
        </Heading>
        <Text className="font-normal font-sans txt-compact-small text-ui-fg-subtle">
          {t("orders.preorder.description")}
        </Text>
      </div>

      {/* Preorder Items */}
      {isLoading ? (
        <div className="py-4">
          <Text className="text-ui-fg-subtle">Loading...</Text>
        </div>
      ) : (
        <div className="space-y-3">
          {preorders.map((preorder: any) => {
            console.log("preorderIDD", preorder);
            // Find the order item that matches this preorder's variant_id
            const orderItem = (order.items || []).find(
              i => i.variant?.preorder_variant?.id === preorder.item_id
            );

            if (!orderItem) {
              console.warn(`Order item not found for variant_id: ${preorder.variant_id}`);
              return null;
            }

            // Get preorder variant data from the order item's variant
            const preorderVariant = (orderItem.variant as any)?.preorder_variant as
              | { available_date?: string }
              | undefined;
            console.log("preorderVariant", preorderVariant);
            // Use preorder_variant.available_date from order data, fallback to preorder record
            const availableDate = preorderVariant?.available_date || preorder.available_date;

            // Get product ID from the order item
            const productId = orderItem.product_id;
            const variantId = orderItem.variant_id || preorder.variant_id;
            // Get variant options like in Summary section
            const variantOptions = orderItem.variant?.options?.map((o: any) => o.value).join(" · ");

            return (
              <div key={preorder.id} className="rounded-lg">
                <div className="flex items-center gap-3">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <Thumbnail src={orderItem.thumbnail} size="xlarge" />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: Variant name and Status badge */}
                    <div className="flex items-center justify-between mb-1">
                      <Text className="text-ui-fg-base font-medium text-sm">
                        {variantOptions || orderItem.title}
                      </Text>
                      <StatusBadge color={getStatusColor(preorder.status)} className="text-nowrap">
                        {getStatusLabel(preorder.status)}
                      </StatusBadge>
                    </div>

                    {/* Available date */}
                    <div className="mb-1">
                      <Text className="text-ui-fg-muted text-xs">
                        {t("orders.preorder.availableDate")}:{" "}
                        {availableDate ? formatDateForDisplay(availableDate) : "-"}
                      </Text>
                    </div>

                    {/* View variant link */}
                    <div>
                      <LinkButton
                        to={`/products/${productId}/variants/${variantId}`}
                        variant="interactive"
                        className="text-xs"
                      >
                        {t("orders.preorder.viewVariant")}
                      </LinkButton>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
