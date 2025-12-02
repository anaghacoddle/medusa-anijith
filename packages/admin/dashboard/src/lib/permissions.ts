export function hasPermission(routePermissions: any, route: string, method: string = "GET") {
  return routePermissions["/admin"]?.includes("ALL") || routePermissions[route]?.includes(method);
}
