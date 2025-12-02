import { SingleColumnPage } from "../../../../components/layout/pages";
import { useExtension } from "../../../../providers/extension-provider";
import { LoyaltyListTable } from "./components/loyalty-list-table";

export const LoyaltyList = () => {
  const { getWidgets } = useExtension();

  return (
    <SingleColumnPage
      widgets={{
        before: getWidgets("region.list.before"),
        after: getWidgets("region.list.after"),
      }}
    >
      <LoyaltyListTable />
    </SingleColumnPage>
  );
};
