import { Buildings, XCircle } from "@medusajs/icons";
import {
  AdminOrder,
  AdminOrderFulfillment,
  AdminOrderLineItem,
  HttpTypes,
  OrderLineItemDTO,
} from "@medusajs/types";
import {
  Button,
  Container,
  Copy,
  Heading,
  StatusBadge,
  Text,
  Tooltip,
  toast,
  usePrompt,
} from "@medusajs/ui";
import { Info } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { Skeleton } from "../../../../../components/common/skeleton";
import { Thumbnail } from "../../../../../components/common/thumbnail";
import {
  useCancelOrderFulfillment,
  useMarkOrderFulfillmentAsDelivered,
} from "../../../../../hooks/api/orders";
import { useStockLocation } from "../../../../../hooks/api/stock-locations";
import { formatProvider } from "../../../../../lib/format-provider";
import { getLocaleAmount } from "../../../../../lib/money-amount-helpers";
import { FulfillmentSetType } from "../../../../locations/common/constants";

// Extended types to match actual API response
type ExtendedOrderFulfillment = AdminOrderFulfillment & {
  labels?: Array<{
    tracking_number: string;
    tracking_url?: string;
    label_url?: string;
  }>;
  shipping_option?: {
    service_zone: {
      fulfillment_set: {
        type: string;
      };
    };
  };
  items: Array<{
    line_item_id: string;
    quantity: number;
    title: string;
  }>;
};

type OrderFulfillmentSectionProps = {
  order: AdminOrder;
};

export const OrderFulfillmentSection = ({ order }: OrderFulfillmentSectionProps) => {
  const fulfillments = (order.fulfillments || []) as ExtendedOrderFulfillment[];
  return (
    <div className="flex flex-col gap-y-3">
      <UnfulfilledItemBreakdown order={order} />
      {fulfillments.map((f, index) => (
        <Fulfillment key={f.id} index={index} fulfillment={f} order={order} />
      ))}
    </div>
  );
};

// Health Info Modal Component
const HealthInfoModal = ({
  isOpen,
  onClose,
  healthInfo,
  item,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  healthInfo: any;
  item: any;
  order: any;
}) => {
  const [pharmacistNotes, setPharmacistNotes] = useState("");

  if (!isOpen || !healthInfo) return null;

  const form = healthInfo.form_data || {};
  const productTitle = item?.title || "Unknown Product";
  const variantTitle = item?.variant?.title || "Unknown Variant";

  const handleAccept = async () => {
    try {
      const res = await fetch(`/admin/customer-health-info/${healthInfo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacist_status: "ACCEPTED",
          pharmacist_notes: pharmacistNotes || null,
          order_item_id: item.id,
          order_id: order.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Health info accepted successfully!");
      onClose();
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async () => {
    if (!pharmacistNotes || pharmacistNotes.trim() === "") {
      toast.warning("Rejection note is required.");
      return;
    }

    try {
      toast.info("Step 1/5: Creating order edit...");
      const orderEditResponse = await fetch(`/admin/order-edits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
        }),
      });

      if (!orderEditResponse.ok) {
        throw new Error("Failed to create order edit");
      }

      const orderEditData = await orderEditResponse.json();
      const orderEditId = orderEditData.order_change.id;

      toast.info("Step 2/5: Removing item from order...");
      const removeItemResponse = await fetch(
        `/admin/order-edits/${order.id}/items/item/${item.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quantity: 0,
          }),
        }
      );

      if (!removeItemResponse.ok) {
        throw new Error("Failed to remove item from order");
      }

      toast.info("Step 3/5: Requesting confirmation...");
      const requestResponse = await fetch(`/admin/order-edits/${order.id}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!requestResponse.ok) {
        console.warn("Request confirmation failed, proceeding to force confirm");
      }

      toast.info("Step 4/5: Confirming order changes...");
      const confirmResponse = await fetch(`/admin/order-edits/${order.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!confirmResponse.ok) {
        throw new Error("Failed to confirm order edit");
      }

      toast.info("Step 5/5: Updating health info...");
      const healthInfoResponse = await fetch(`/admin/customer-health-info/${healthInfo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pharmacist_status: "REJECTED",
          pharmacist_notes: pharmacistNotes,
          order_item_id: item.id,
          order_id: order.id,
        }),
      });

      if (!healthInfoResponse.ok) {
        throw new Error("Failed to update health info status");
      }

      toast.success("Item rejected and removed from order successfully!");
      onClose();

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Failed to process rejection");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative  bg-ui-bg-subtle text-ui-fg-subtle shadow-elevation-card-rest rounded-lg  max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-3 pb-2 border-b border-lightgray">
            Customer Health Information
          </h2>

          <div className="flex flex-col overflow-y-auto max-h-[62vh]">
            {/* Product & Order Info */}
            <div className="border-b pb-4 mb-4">
              <p className="mb-2">
                <strong>Product:</strong> {productTitle}
              </p>
              <p className="mb-2">
                <strong>Variant:</strong> {variantTitle}
              </p>
              <p className="mb-2">
                <strong>Order ID:</strong>{" "}
                <span className="px-2 py-1  rounded text-xs">{order.id}</span>
              </p>
              <p>
                <strong>Order Item ID:</strong>{" "}
                <span className="px-2 py-1  rounded text-xs">{item.id}</span>
              </p>
            </div>

            {/* Customer Details */}
            <div className="mb-4">
              <p className="font-semibold mb-2">Customer Details</p>
              <ul className="list-disc ml-6 space-y-1 text-sm">
                <li>
                  <strong>Name:</strong> {form.name || "-"}
                </li>
                <li>
                  <strong>Age:</strong> {form.age || "-"}
                </li>
                <li>
                  <strong>Gender:</strong> {form.gender || "-"}
                </li>
                <li>
                  <strong>Height:</strong> {form.height || "-"}
                </li>
                <li>
                  <strong>Weight:</strong> {form.weight || "-"}
                </li>
                <li>
                  <strong>Blood Type:</strong> {form.blood_type || "-"}
                </li>
                <li>
                  <strong>Date of Birth:</strong> {form.date_of_birth || "-"}
                </li>
                <li>
                  <strong>Other Details:</strong> {form.other_details || "-"}
                </li>
              </ul>
            </div>

            <div className="mb-4">
              <p>
                <strong>Pharmacist Status:</strong> {healthInfo.pharmacist_status || "PENDING"}
              </p>
              <p>
                <strong>Collected Flag:</strong>{" "}
                {healthInfo.collected_flag_id?.toUpperCase() || "-"}
              </p>
            </div>

            {/* Notes Textarea */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Pharmacist Notes</label>
              <textarea
                className="w-full p-2 border rounded-md text-sm resize-none"
                rows={3}
                placeholder="Add notes here (required for rejection)..."
                value={pharmacistNotes}
                onChange={e => setPharmacistNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-5">
            <Button size="small" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button size="small" variant="danger" onClick={handleReject}>
              Reject
            </Button>
            <Button size="small" variant="primary" onClick={handleAccept}>
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UnfulfilledItem = ({
  item,
  currencyCode,
  order,
}: {
  item: (OrderLineItemDTO & { variant: HttpTypes.AdminProductVariant }) | AdminOrderLineItem;
  currencyCode: string;
  order: AdminOrder;
}) => {
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthInfoData, setHealthInfoData] = useState<any>(null);

  const handleInfoClick = async () => {
    try {
      if (!item.variant) {
        toast.warning("No variant available for this product.");
        return;
      }

      // Fetch health info for the product & variant
      const response = await fetch(
        `/admin/customer-health-info/${item.product_id}/${item.variant.id}`,
        { method: "GET" }
      );

      if (!response.ok) throw new Error("Failed to fetch health info");

      const data = await response.json();
      const healthInfo = data?.customer_health_info?.[0];

      if (!healthInfo) {
        toast.warning("No customer health info found for this product variant.");
        return;
      }

      setHealthInfoData(healthInfo);
      setShowHealthModal(true);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong while fetching health info");
    }
  };

  const isS3Enabled = item?.variant?.metadata?.s3 === true;

  return (
    <>
      <div key={item.id} className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
        <div className="flex items-start gap-x-4">
          <Thumbnail src={item.thumbnail} />
          <div>
            <Text size="small" leading="compact" weight="plus" className="text-ui-fg-base">
              {item.title}
            </Text>
            {item.variant_sku && (
              <div className="flex items-center gap-x-1">
                <Text size="small">{item.variant_sku}</Text>
                <Copy content={item.variant_sku} className="text-ui-fg-muted" />
              </div>
            )}
            <Text size="small">{item.variant?.options?.map(o => o.value).join(" · ") || "-"}</Text>
          </div>
        </div>
        <div className="grid grid-cols-3 items-center gap-x-4">
          <div className="flex items-center justify-end">
            <Text size="small">{getLocaleAmount(item.unit_price, currencyCode)}</Text>
          </div>
          <div className="flex items-center justify-end">
            <Text>
              <span className="tabular-nums">{item.quantity - item.detail.fulfilled_quantity}</span>
              x
            </Text>
          </div>
          <div className="flex items-center justify-end">
            <Text size="small">{getLocaleAmount(Number(item.subtotal) || 0, currencyCode)}</Text>
            {isS3Enabled && (
              <div className="ml-2 mt-2">
                <button onClick={handleInfoClick} type="button">
                  <Info className="w-4 h-4 text-ui-fg-muted cursor-pointer hover:text-ui-fg-base transition-colors" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Health Info Modal */}
      {showHealthModal && (
        <HealthInfoModal
          isOpen={showHealthModal}
          onClose={() => setShowHealthModal(false)}
          healthInfo={healthInfoData}
          item={item}
          order={order}
        />
      )}
    </>
  );
};

const UnfulfilledItemBreakdown = ({ order }: { order: AdminOrder }) => {
  // Create an array of order items that haven't been fulfilled or at least not fully fulfilled
  const unfulfilledItemsWithShipping = order.items!.filter(
    i => i.requires_shipping && i.detail.fulfilled_quantity < i.quantity
  );

  const unfulfilledItemsWithoutShipping = order.items!.filter(
    i => !i.requires_shipping && i.detail.fulfilled_quantity < i.quantity
  );

  return (
    <>
      {!!unfulfilledItemsWithShipping.length && (
        <UnfulfilledItemDisplay
          order={order}
          unfulfilledItems={unfulfilledItemsWithShipping}
          requiresShipping={true}
        />
      )}

      {!!unfulfilledItemsWithoutShipping.length && (
        <UnfulfilledItemDisplay
          order={order}
          unfulfilledItems={unfulfilledItemsWithoutShipping}
          requiresShipping={false}
        />
      )}
    </>
  );
};

const UnfulfilledItemDisplay = ({
  order,
  unfulfilledItems,
  requiresShipping = false,
}: {
  order: AdminOrder;
  unfulfilledItems: AdminOrderLineItem[];
  requiresShipping: boolean;
}) => {
  const { t } = useTranslation();

  if (order.status === "canceled") {
    return;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("orders.fulfillment.unfulfilledItems")}</Heading>
        <div className="flex items-center gap-x-4">
          {requiresShipping && (
            <StatusBadge color="red" className="text-nowrap">
              {t("orders.fulfillment.requiresShipping")}
            </StatusBadge>
          )}
          <StatusBadge color="red" className="text-nowrap">
            {t("orders.fulfillment.awaitingFulfillmentBadge")}
          </StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("orders.fulfillment.fulfillItems"),
                    icon: <Buildings />,
                    to: `/orders/${order.id}/fulfillment?requires_shipping=${requiresShipping}`,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <div>
        {unfulfilledItems.map((item: AdminOrderLineItem) => (
          <UnfulfilledItem
            key={item.id}
            item={item}
            currencyCode={order.currency_code}
            order={order}
          />
        ))}
      </div>
    </Container>
  );
};

const Fulfillment = ({
  fulfillment,
  order,
  index,
}: {
  fulfillment: ExtendedOrderFulfillment;
  order: AdminOrder;
  index: number;
}) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const navigate = useNavigate();

  const showLocation = !!fulfillment.location_id;

  const isPickUpFulfillment =
    fulfillment.shipping_option?.service_zone.fulfillment_set.type === FulfillmentSetType.Pickup;

  const { stock_location, isError, error } = useStockLocation(fulfillment.location_id!, undefined, {
    enabled: showLocation,
  });

  let statusText = fulfillment.requires_shipping
    ? isPickUpFulfillment
      ? "Awaiting pickup"
      : "Awaiting shipping"
    : "Awaiting delivery";
  let statusColor: "blue" | "green" | "red" = "blue";
  let statusTimestamp = fulfillment.created_at;

  if (fulfillment.canceled_at) {
    statusText = "Canceled";
    statusColor = "red";
    statusTimestamp = fulfillment.canceled_at;
  } else if (fulfillment.delivered_at) {
    statusText = "Delivered";
    statusColor = "green";
    statusTimestamp = fulfillment.delivered_at;
  } else if (fulfillment.shipped_at) {
    statusText = "Shipped";
    statusColor = "green";
    statusTimestamp = fulfillment.shipped_at;
  }

  const { mutateAsync } = useCancelOrderFulfillment(order.id, fulfillment.id);
  const { mutateAsync: markAsDelivered } = useMarkOrderFulfillmentAsDelivered(
    order.id,
    fulfillment.id
  );

  const showShippingButton =
    !fulfillment.canceled_at &&
    !fulfillment.shipped_at &&
    !fulfillment.delivered_at &&
    fulfillment.requires_shipping &&
    !isPickUpFulfillment;

  const showDeliveryButton = !fulfillment.canceled_at && !fulfillment.delivered_at;

  const handleMarkAsDelivered = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("orders.fulfillment.markAsDeliveredWarning"),
      confirmText: t("actions.continue"),
      cancelText: t("actions.cancel"),
      variant: "confirmation",
    });

    if (res) {
      await markAsDelivered(undefined, {
        onSuccess: () => {
          toast.success(
            t(
              isPickUpFulfillment
                ? "orders.fulfillment.toast.fulfillmentPickedUp"
                : "orders.fulfillment.toast.fulfillmentDelivered"
            )
          );
        },
        onError: e => {
          toast.error(e.message);
        },
      });
    }
  };

  const handleCancel = async () => {
    if (fulfillment.shipped_at) {
      toast.warning(t("orders.fulfillment.toast.fulfillmentShipped"));
      return;
    }

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("orders.fulfillment.cancelWarning"),
      confirmText: t("actions.continue"),
      cancelText: t("actions.cancel"),
    });

    if (res) {
      await mutateAsync(undefined, {
        onSuccess: () => {
          toast.success(t("orders.fulfillment.toast.canceled"));
        },
        onError: e => {
          toast.error(e.message);
        },
      });
    }
  };

  if (isError) {
    throw error;
  }

  const isValidUrl = (url?: string) => url && url.length > 0 && url !== "#";

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">
          {t("orders.fulfillment.number", {
            number: index + 1,
          })}
        </Heading>
        <div className="flex items-center gap-x-4">
          <Tooltip content={format(new Date(statusTimestamp), "dd MMM, yyyy, HH:mm:ss")}>
            <StatusBadge color={statusColor} className="text-nowrap">
              {statusText}
            </StatusBadge>
          </Tooltip>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.cancel"),
                    icon: <XCircle />,
                    onClick: handleCancel,
                    disabled:
                      !!fulfillment.canceled_at ||
                      !!fulfillment.shipped_at ||
                      !!fulfillment.delivered_at,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("orders.fulfillment.itemsLabel")}
        </Text>
        <ul>
          {fulfillment.items.map(
            (f_item: { line_item_id: string; quantity: number; title: string }) => (
              <li key={f_item.line_item_id}>
                <Text size="small" leading="compact">
                  {f_item.quantity}x {f_item.title}
                </Text>
              </li>
            )
          )}
        </ul>
      </div>
      {showLocation && (
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("orders.fulfillment.shippingFromLabel")}
          </Text>
          {stock_location ? (
            <Link
              to={`/settings/locations/${stock_location.id}`}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg"
            >
              <Text size="small" leading="compact">
                {stock_location.name}
              </Text>
            </Link>
          ) : (
            <Skeleton className="w-16" />
          )}
        </div>
      )}
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.provider")}
        </Text>

        <Text size="small" leading="compact">
          {formatProvider(fulfillment.provider_id)}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("orders.fulfillment.trackingLabel")}
        </Text>
        <div>
          {fulfillment.labels && fulfillment.labels.length > 0 ? (
            <ul>
              {fulfillment.labels.map(tlink => {
                const hasTrackingUrl = isValidUrl(tlink.tracking_url);
                const hasLabelUrl = isValidUrl(tlink.label_url);

                if (hasTrackingUrl || hasLabelUrl) {
                  return (
                    <li key={tlink.tracking_number}>
                      {hasTrackingUrl && (
                        <a
                          href={tlink.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg"
                        >
                          <Text size="small" leading="compact" as="span">
                            {tlink.tracking_number}
                          </Text>
                        </a>
                      )}
                      {hasTrackingUrl && hasLabelUrl && " - "}
                      {hasLabelUrl && (
                        <a
                          href={tlink.label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg"
                        >
                          <Text size="small" leading="compact" as="span">
                            Label
                          </Text>
                        </a>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={tlink.tracking_number}>
                    <Text size="small" leading="compact">
                      {tlink.tracking_number}
                    </Text>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Text size="small" leading="compact">
              -
            </Text>
          )}
        </div>
      </div>

      {(showShippingButton || showDeliveryButton) && (
        <div className="bg-ui-bg-subtle flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
          {showDeliveryButton && (
            <Button onClick={handleMarkAsDelivered} variant="secondary">
              {t(
                isPickUpFulfillment
                  ? "orders.fulfillment.markAsPickedUp"
                  : "orders.fulfillment.markAsDelivered"
              )}
            </Button>
          )}

          {showShippingButton && (
            <Button
              onClick={() => navigate(`./${fulfillment.id}/create-shipment`)}
              variant="secondary"
            >
              {t("orders.fulfillment.markAsShipped")}
            </Button>
          )}
        </div>
      )}
    </Container>
  );
};
