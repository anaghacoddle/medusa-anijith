import { HttpTypes } from "@medusajs/types";
import { UIMatch } from "react-router-dom";
import { useRbacRole } from "../../../../hooks/api/rbac";

type UserDetailBreadcrumbProps = UIMatch<HttpTypes.AdminUserResponse>;

export const UserDetailBreadcrumb = (props: UserDetailBreadcrumbProps) => {
  const { id } = props.params || {};

  const { data: roleData } = useRbacRole(id!, {
    initialData: props.data,
    enabled: Boolean(id),
  });

  if (!roleData) {
    return null;
  }

  const display = roleData?.role?.name;

  return <span>{display}</span>;
};
