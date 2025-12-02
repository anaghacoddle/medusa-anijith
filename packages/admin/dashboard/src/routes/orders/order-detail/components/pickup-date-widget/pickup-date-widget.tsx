import { DetailWidgetProps, HttpTypes } from "@medusajs/types";

// Define widget config helper locally
const defineWidgetConfig = (config: any) => config;

import { Container, Heading, Text } from "@medusajs/ui";

const PickupDateWidget = ({ data: order }: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const pickupDates = order.shipping_methods
    .map(method => method.data?.pickup_date as string | undefined)
    .filter(Boolean);

  if (!pickupDates.length) return null;

  return (
    <Container>
      <Heading level="h2">Pickup Dates</Heading>
      {pickupDates.map((date, idx) => (
        <Text key={idx}>Pickup Date: {date || "N/A"}</Text>
      ))}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
});
export default PickupDateWidget;
