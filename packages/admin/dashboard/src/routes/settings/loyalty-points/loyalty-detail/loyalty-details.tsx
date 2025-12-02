import { useTranslation } from "react-i18next";
import { useStore } from "../../../../hooks/api";
import { useParams } from "react-router-dom";
import { useSingleLoyaltyConfig } from "../../../../hooks/api/loyaltyConfig";
import { SingleColumnPage } from "../../../../components/layout/pages";
import { LoyaltyGeneralSection } from "./component/loyalty-general-section";
import { useExtension } from "../../../../providers/extension-provider";

export const LoyaltyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { store, isPending: isStoreLoading, isError: isStoreError, error: storeError } = useStore();

  const { getWidgets } = useExtension();

  // Fetch loyalty configuration data
  const {
    data: loyaltyConfig,
    isPending: isLoyaltyLoading,
    isError: isLoyaltyError,
    error: loyaltyError,
  } = useSingleLoyaltyConfig(id!);

  const ready = !!store && !isStoreLoading && !isLoyaltyLoading;

  if (isStoreError) {
    throw storeError;
  }

  if (isLoyaltyError) {
    throw loyaltyError;
  }

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("sales_channel.details.before"),
        after: getWidgets("sales_channel.details.after"),
      }}
      showJSON
      showMetadata
      data={loyaltyConfig}
    >
      {ready && <LoyaltyGeneralSection loyaltyConfig={loyaltyConfig} />}
    </SingleColumnPage>
  );
};
