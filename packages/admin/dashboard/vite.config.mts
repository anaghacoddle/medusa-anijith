import inject from "@medusajs/admin-vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import inspect from "vite-plugin-inspect";
import * as path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const BASE = env.VITE_MEDUSA_BASE || "/app";
  const BACKEND_URL = env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";
  const STOREFRONT_URL =
    env.VITE_MEDUSA_STOREFRONT_URL || "http://localhost:8000";
  const ENCRYPTION_KEY = env.VITE_MEDUSA_ENCRYPTION_KEY;
  const FILE_SIZE_LIMIT_MB = env.VITE_FILE_SIZE_LIMIT_MB || "10";
  const SUPPORT_EMAIL = env.VITE_SUPPORT_EMAIL || "admin@botanical.com";
  const STOCK_MONITOR_THRESHOLD = env.STOCK_MONITOR_THRESHOLD || "10";

  const MEDUSA_PROJECT = env.VITE_MEDUSA_PROJECT || null;
  const sources = MEDUSA_PROJECT ? [MEDUSA_PROJECT] : [];

  return {
    base: BASE,
    plugins: [
      inspect(),
      react(),
      inject({
        sources,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"), // ✅ Add this block
      },
    },
    define: {
      __BASE__: JSON.stringify(BASE),
      __BACKEND_URL__: JSON.stringify(BACKEND_URL),
      __STOREFRONT_URL__: JSON.stringify(STOREFRONT_URL),
      __ENCRYPTION_KEY__: JSON.stringify(ENCRYPTION_KEY),
      __FILE_SIZE_LIMIT_MB__: JSON.stringify(FILE_SIZE_LIMIT_MB),
      __SUPPORT_EMAIL__: JSON.stringify(SUPPORT_EMAIL),
      __STOCK_MONITOR_THRESHOLD__: JSON.stringify(STOCK_MONITOR_THRESHOLD),
    },
    server: {
      open: true,
      proxy: {
        // 👇 Add this block to forward `/admin` API requests to your Medusa backend
        "/admin": {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
