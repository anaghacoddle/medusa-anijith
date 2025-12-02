import { SingleColumnPage } from "../../components/layout/pages";
import { useExtension } from "../../providers/extension-provider";
import { DeletedProductsSection } from "./components/DeletedProductsSection";

export const ProductList = () => {
  const { getWidgets } = useExtension();

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("product.list.after"),
        before: getWidgets("product.list.before"),
      }}
    >
      <DeletedProductsSection />
    </SingleColumnPage>
  );
};
