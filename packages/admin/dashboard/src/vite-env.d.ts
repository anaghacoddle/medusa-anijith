// / <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEDUSA_BACKEND_URL: string;
  readonly VITE_MEDUSA_STOREFRONT_URL: string;
  readonly VITE_MEDUSA_V2: "true" | "false";
  readonly VITE_FILE_SIZE_LIMIT_MB: string;
  readonly VITE_SUPPORT_EMAIL: string;
  readonly STOCK_MONITOR_THRESHOLD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot: {
    accept: () => void;
  };
}

declare const __BACKEND_URL__: string | undefined;
declare const __STOREFRONT_URL__: string | undefined;
declare const __BASE__: string;
declare const __ENCRYPTION_KEY__: string | undefined;
declare const __FILE_SIZE_LIMIT_MB__: string;
declare const __SUPPORT_EMAIL__: string | undefined;
declare const __STOCK_MONITOR_THRESHOLD__: string | undefined;
