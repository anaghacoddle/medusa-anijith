import { SingleColumnPage } from "../../../components/layout/pages";
import { useExtension } from "../../../providers/extension-provider";
import { CartListTable } from "./components/cart-list-table";

export const CartsList = () => {
  const { getWidgets } = useExtension();

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("order.list.after"),
        before: getWidgets("order.list.before"),
      }}
    >
      <CartListTable />
    </SingleColumnPage>
  );
};
