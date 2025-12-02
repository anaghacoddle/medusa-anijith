import { usePermission } from "../../hooks/use-permission";

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredMethod?: string;
}

export const PermissionRoute = ({
  children,
  requiredPermission,
  requiredMethod = "GET",
}: PermissionRouteProps) => {
  const { hasPermission } = usePermission();

  // If no specific permission is required, just render children
  if (!requiredPermission) {
    return <>{children}</>;
  }

  // Check if user has permission for this route
  if (!hasPermission(requiredPermission, requiredMethod)) {
    // Create a custom permission error to trigger the ErrorBoundary with 403 status
    const error = new Error("Access Denied") as any;
    error.status = 403;
    error.isPermissionError = true;
    throw error;
  }

  return <>{children}</>;
};
