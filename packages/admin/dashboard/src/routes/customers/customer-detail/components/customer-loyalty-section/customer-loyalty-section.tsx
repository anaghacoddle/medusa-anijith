import { Container, Heading } from "@medusajs/ui";
import { useCustomerLoyaltyPoints } from "../../../../../hooks/api";

const CustomerLoyaltyPointsPage = ({ customer }: { customer: any }) => {
  // Call the hook unconditionally
  const { data, isLoading, error } = useCustomerLoyaltyPoints(customer?.id || "");

  // Check if customer is null or undefined
  if (!customer) {
    return (
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Customer Loyalty Points</Heading>
          <span>Loading customer data...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Customer Loyalty Points</Heading>
        {isLoading && <span>Loading...</span>}
        {error && <span>Error loading loyalty points</span>}
        {data && <span>{data.points} points</span>}
      </div>
    </Container>
  );
};

export default CustomerLoyaltyPointsPage;
