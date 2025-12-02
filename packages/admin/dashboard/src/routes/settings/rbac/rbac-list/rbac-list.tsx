import { SingleColumnPage } from "../../../../components/layout/pages";
import { useExtension } from "../../../../providers/extension-provider";
import { RbacListTable } from "./components/rbac-list-table";

export const RbacList = () => {
  const { getWidgets } = useExtension();

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("user.list.after"),
        before: getWidgets("user.list.before"),
      }}
    >
      <RbacListTable />
    </SingleColumnPage>
  );
};
