import { QueryClient } from "@tanstack/react-query";

export const MEDUSA_BACKEND_URL = __BACKEND_URL__ ?? "/";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // refetchOnWindowFocus: false,
      refetchOnWindowFocus: true,
      // staleTime: 90000,
      staleTime: 0,
      retry: 1,
    },
  },
});
