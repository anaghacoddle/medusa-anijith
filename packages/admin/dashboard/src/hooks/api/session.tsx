import axios, { AxiosError } from "axios";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

export interface KeepAliveResponse {
  status: "ok" | "expired" | "error";
  message?: string;
  remainingTime?: number;
}

export interface UseKeepAliveOptions
  extends Omit<UseQueryOptions<KeepAliveResponse, AxiosError>, "queryKey" | "queryFn"> {}

export const useKeepAlive = (options?: UseKeepAliveOptions) => {
  const query = useQuery<KeepAliveResponse, AxiosError>({
    queryKey: ["keep-alive"],
    queryFn: async (): Promise<KeepAliveResponse> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const url = `${baseUrl}/admin/keep-alive`;

      try {
        const response = await axios.get(url, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json", // Add explicit content type
          },
          withCredentials: true,
          timeout: 10000, // Increase timeout
        });

        return response.data;
      } catch (error) {
        // Handle specific CORS errors
        if (axios.isAxiosError(error)) {
          if (error.code === "NETWORK_ERROR" || !error.response) {
            throw new Error("Network error - check CORS configuration");
          }
          // For 403 errors (account suspended/inactive), throw the error to be handled by the hook
          if (error.response?.status === 403) {
            throw error;
          }
        }
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    retry: (failureCount, error) => {
      // Don't retry on CORS errors or 403 errors (account suspended/inactive)
      if (axios.isAxiosError(error)) {
        if (!error.response || error.response.status === 0) {
          return false;
        }
        if (error.response.status === 403) {
          return false; // Don't retry on account suspended/inactive
        }
      }
      return failureCount < 1;
    },
    retryDelay: 1000,
    ...options,
  });

  return {
    status: query.data?.status ?? "unknown",
    remainingTime: query.data?.remainingTime ?? 0,
    message: query.data?.message,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
