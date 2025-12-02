import { DashboardApp } from "./dashboard-app";
import { DashboardPlugin } from "./dashboard-app/types";

import displayModule from "virtual:medusa/displays";
import formModule from "virtual:medusa/forms";
import i18nModule from "virtual:medusa/i18n";
import menuItemModule from "virtual:medusa/menu-items";
import routeModule from "virtual:medusa/routes";
import widgetModule from "virtual:medusa/widgets";

import "./index.css";

// Handle 401 unauthorized responses globally
// const originalFetch = window.fetch;
// window.fetch = async (...args) => {
//   const response = await originalFetch(...args);
//   if (response.status === 401) {
//     const baseUrl = __BASE__ === "/" ? "" : __BASE__;
//     window.location.href = `${baseUrl}/login`;
//   }
//   return response;
// };

const localPlugin = {
  widgetModule,
  routeModule,
  displayModule,
  formModule,
  menuItemModule,
  i18nModule,
};

interface AppProps {
  plugins?: DashboardPlugin[];
}

function App({ plugins = [] }: AppProps) {
  const pathname = window.location.pathname;
  const baseUrl = __BASE__ === "/" ? "" : __BASE__;

  const isLoggedIn = document.cookie.includes("medusa_admin_session");
  const isVerified = sessionStorage.getItem("admin_verified") === "true";

  const isOnLoginPage = pathname.startsWith(`${baseUrl}/login`);
  const isOnAccessPage = pathname.startsWith(`${baseUrl}/access`);

  console.log({ isLoggedIn, isVerified, pathname });

  // 2. Logged in but not MFA verified → Redirect to /access
  if (isLoggedIn && !isVerified && !isOnAccessPage) {
    window.location.href = `${baseUrl}/access`;
  }

  // 3. Logged in & verified → Show dashboard
  const app = new DashboardApp({
    plugins: [localPlugin, ...plugins],
  });

  return <div>{app.render()}</div>;
}

export default App;
