import { Heading } from "@medusajs/ui";
import { useParams } from "react-router-dom";
import { RouteDrawer } from "../../../../components/modals";
import { useRbacRole } from "../../../../hooks/api/rbac";
import { EditRbacForm } from "./components/edit-rbac-form";

export const RbacEdit = () => {
  const { id } = useParams();
  const { data: role, isPending: isLoading, isError, error } = useRbacRole(id!);

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{"Edit Role"}</Heading>
      </RouteDrawer.Header>
      {!isLoading && role && <EditRbacForm roleData={role} />}
    </RouteDrawer>
  );
};
