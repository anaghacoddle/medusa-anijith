import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  console.log("session.............", sessionStorage);

  const isVerified = sessionStorage.getItem("admin_verified") === "true";

  const isAccessPage = location.pathname.startsWith("/access");

  if (!isVerified && !isAccessPage) {
    return <Navigate to="/access" replace />;
  }

  return children;
};

export default ProtectedRoute;
