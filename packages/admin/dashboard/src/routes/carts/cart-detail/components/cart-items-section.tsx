import { Container, Heading, Text, Table } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

interface CartItemsSectionProps {
  cart: any; // Replace with proper Cart type
}

export const CartItemsSection = ({ cart }: CartItemsSectionProps) => {
  const { t } = useTranslation();
  const items = cart.items || [];

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("carts.items", "Cart Items")}</Heading>
      </div>
      <div>
        {items.length > 0 ? (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t("fields.title", "Title")}</Table.HeaderCell>
                <Table.HeaderCell>{t("fields.sku", "SKU")}</Table.HeaderCell>
                <Table.HeaderCell>{t("fields.quantity", "Quantity")}</Table.HeaderCell>
                <Table.HeaderCell>{t("fields.unitPrice", "Unit Price")}</Table.HeaderCell>
                <Table.HeaderCell>{t("fields.total", "Total")}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item: any, index: number) => (
                <Table.Row key={item.id || index}>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <Text weight="plus">{item.title || "-"}</Text>
                      {item.subtitle && (
                        <Text size="small" className="text-ui-fg-muted">
                          {item.subtitle}
                        </Text>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="font-mono">{item.variant?.sku || "-"}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>{item.quantity || 0}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>
                      {item.unit_price !== undefined
                        ? `${cart.currency_code?.toUpperCase() || ""} ${(item.unit_price / 100).toFixed(2)}`
                        : "-"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text weight="plus">
                      {item.total !== undefined
                        ? `${cart.currency_code?.toUpperCase() || ""} ${(item.total / 100).toFixed(2)}`
                        : "-"}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <Text className="text-ui-fg-muted">{t("carts.noItems", "This cart has no items")}</Text>
          </div>
        )}
      </div>
    </Container>
  );
};
