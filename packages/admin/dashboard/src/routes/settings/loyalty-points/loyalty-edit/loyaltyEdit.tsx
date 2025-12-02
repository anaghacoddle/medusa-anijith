import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useStore } from "../../../../hooks/api";
import { RouteDrawer } from "../../../../components/modals";
import { LoyaltyEditForm } from "./component/loyaltyEditForm";
import { useParams } from "react-router-dom";
import { useLoyaltyConfig, useSingleLoyaltyConfig } from "../../../../hooks/api/loyaltyConfig";

export const LoyaltyEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { store, isPending: isStoreLoading, isError: isStoreError, error: storeError } = useStore();

  // Fetch loyalty configuration data
  const {
    data: loyaltyConfig,
    isPending: isLoyaltyLoading,
    isError: isLoyaltyError,
    error: loyaltyError,
  } = useSingleLoyaltyConfig(id!); // Pass the id if needed

  const ready = !!store && !isStoreLoading && !isLoyaltyLoading;

  if (isStoreError) {
    throw storeError;
  }

  if (isLoyaltyError) {
    throw loyaltyError;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{"Edit Loyalty Points"}</Heading>
      </RouteDrawer.Header>
      {ready && <LoyaltyEditForm loyaltyConfig={loyaltyConfig} />}
    </RouteDrawer>
  );
};
