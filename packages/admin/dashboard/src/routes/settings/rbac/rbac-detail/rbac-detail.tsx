import { useLoaderData, useParams } from "react-router-dom";

import { useRbacRole } from "../../../../hooks/api/rbac";
import { RbacGeneralSection } from "./components/rbac-general-section";
import { userLoader } from "./loader";

import { SingleColumnPageSkeleton } from "../../../../components/common/skeleton";
import { SingleColumnPage } from "../../../../components/layout/pages";
import { useExtension } from "../../../../providers/extension-provider";

export const RbacDetail = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof userLoader>>;
  const { id } = useParams();

  const { data: role, isPending: isLoading } = useRbacRole(id, {
    initialData: initialData?.role,
    enabled: !!id,
  });

  const { getWidgets } = useExtension();

  // Handle missing loader data
  if (!initialData && !id) {
    throw new Error("Role ID not found in URL or loader data");
  }

  // Show skeleton while loading
  if (isLoading || !role) {
    return <SingleColumnPageSkeleton sections={1} showJSON showMetadata />;
  }

  return (
    <SingleColumnPage
      data={role}
      widgets={{
        after: getWidgets("user.details.after"),
        before: getWidgets("user.details.before"),
      }}
    >
      <RbacGeneralSection roleData={role} />
    </SingleColumnPage>
  );
};
