import { SingleColumnPage } from "../../../components/layout/pages";
import { useExtension } from "../../../providers/extension-provider";
import { DigitalProductsListTable } from "./components/digital-products-list-table";

export const DigitalProductsList = () => {
  const { getWidgets } = useExtension();

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("user.list.after"),
        before: getWidgets("user.list.before"),
      }}
    >
      <DigitalProductsListTable />
    </SingleColumnPage>
  );
};
