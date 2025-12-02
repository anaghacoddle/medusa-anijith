import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { decryptObject } from "../../../../utils/encryption";

interface CartGeneralSectionProps {
  cart: any; // Replace with proper Cart type
}

export const CartGeneralSection = ({ cart }: CartGeneralSectionProps) => {
  const { t } = useTranslation();
  const [decryptedCart, setDecryptedCart] = useState<any>({});

  useEffect(() => {
    const decryptCartData = async () => {
      try {
        // Define keys to exclude from decryption (keys that should remain as-is)
        const excludeKeys = [
          "id",
          "customer_id",
          "region_id",
          "sales_channel_id",
          "currency_code",
          "created_at",
          "updated_at",
          "completed_at",
          "metadata",
          "items",
          "shipping_address",
          "billing_address",
          "shipping_methods",
          "region",
          "sales_channel",
          "promotions",
          "summary",
        ];

        const decrypted = await decryptObject(cart, excludeKeys);
        setDecryptedCart(decrypted);
      } catch (error) {
        console.error("Error decrypting cart data:", error);
        // Fallback to original cart data if decryption fails
        setDecryptedCart(cart);
      }
    };

    if (cart) {
      decryptCartData();
    }
  }, [cart]);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("carts.general", "General Information")}</Heading>
      </div>
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          {/* <div>
            <Text size="small" className="text-ui-fg-muted mb-1">
              {t("fields.id", "Cart ID")}
            </Text>
            <Text className="font-mono">{decryptedCart.id}</Text>
          </div> */}
          <div>
            <Text size="small" className="text-ui-fg-muted mb-1">
              {t("fields.phone", "Customer Phone")}
            </Text>
            <Text>{decryptedCart.customer?.phone || decryptedCart.phone || "-"}</Text>
          </div>
          <div>
            <Text size="small" className="text-ui-fg-muted mb-1">
              {t("fields.customerEmail", "Customer Email")}
            </Text>
            <Text>{decryptedCart.customer?.email || decryptedCart.email || "-"}</Text>
          </div>
          <div>
            <Text size="small" className="text-ui-fg-muted mb-1">
              {t("fields.customerName", "Customer Name")}
            </Text>
            <Text>
              {decryptedCart.customer?.first_name && decryptedCart.customer?.last_name
                ? `${decryptedCart.customer.first_name} ${decryptedCart.customer.last_name}`
                : "-"}
            </Text>
          </div>
          <div>
            <Text size="small" className="text-ui-fg-muted mb-1">
              {t("fields.currency", "Currency")}
            </Text>
            <Badge color="blue">{decryptedCart.currency_code?.toUpperCase() || "-"}</Badge>
          </div>
          <div>
            <Text size="small" className="text-ui-fg-muted mb-1">
              {t("fields.region", "Region")}
            </Text>
            <Text>{decryptedCart.region?.name || "-"}</Text>
          </div>
          {/* <div>
            <Text size="small" className="text-ui-fg-muted mb-1">
              {t("fields.salesChannel", "Sales Channel")}
            </Text>
            <Text>{cart.sales_channel?.name || "-"}</Text>
          </div> */}
          <div>
            <Text size="small" className="text-ui-fg-muted mb-1">
              {t("fields.createdAt", "Created At")}
            </Text>
            <Text>
              {decryptedCart.created_at ? new Date(decryptedCart.created_at).toLocaleString() : "-"}
            </Text>
          </div>
        </div>
      </div>
    </Container>
  );
};
