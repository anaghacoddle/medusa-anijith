import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSettingRoutes } from "../../components/layout/settings-layout";

export const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routes = useSettingRoutes();
  const route = routes.length > 0 ? routes[0].to : "/settings/profile";

  useEffect(() => {
    if (location.pathname === "/settings") {
      navigate(route, { replace: true });
    }
  }, [location.pathname, navigate, route]);

  return <Outlet />;
};
