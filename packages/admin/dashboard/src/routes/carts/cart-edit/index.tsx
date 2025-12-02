import { useParams } from "react-router-dom";
import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

export const CartEdit = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("carts.edit", "Edit Cart")}</Heading>
      </div>
      <div className="px-6 py-4">
        <Text>Cart ID: {id}</Text>
        <Text className="text-ui-fg-muted mt-2">
          {t("carts.editNotImplemented", "Cart editing functionality will be implemented here.")}
        </Text>
      </div>
    </Container>
  );
};

export const Component = CartEdit;
