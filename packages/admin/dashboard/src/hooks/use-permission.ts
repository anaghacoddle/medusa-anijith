import { useMe } from "../hooks/api";
import { hasPermission as baseHasPermission } from "../lib/permissions";

export function usePermission() {
  const { user } = useMe();
  const routePermissions = (user as any)?.role?.routePermissions || {};

  function hasPermission(route: string, method: string = "GET") {
    return baseHasPermission(routePermissions, route, method);
  }

  return {
    hasPermission,
    user, // Optional: expose user if needed
  };
}
