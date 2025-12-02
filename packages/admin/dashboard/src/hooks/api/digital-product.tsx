import { useQuery, QueryKey, UseQueryOptions } from "@tanstack/react-query";
import { FetchError } from "@medusajs/js-sdk";
import { DigitalProduct } from "../../routes/digital-products/digital-products-list/components/types";

// Digital Products Hook - following the pattern from brands, rbac, and loyalty config
type DigitalProductsListResponse = {
  digital_products: DigitalProduct[];
  count: number;
};

interface UseDigitalProductsParams {
  q?: string;
  order?: string;
  offset?: number;
  limit?: number;
}
export const useDigitalProducts = (
  params: UseDigitalProductsParams = {},
  options?: Omit<
    UseQueryOptions<DigitalProductsListResponse, FetchError, DigitalProductsListResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { q, order, offset = 0, limit = 20 } = params;

  const queryParams = new URLSearchParams();
  if (q) queryParams.append("q", q);
  if (order) queryParams.append("order", order);
  queryParams.append("offset", offset.toString());
  queryParams.append("limit", limit.toString());

  const query = useQuery({
    queryKey: ["digital-products", { q, order, offset, limit }],
    queryFn: async (): Promise<DigitalProductsListResponse> => {
      const response = await fetch(`/admin/digital-products?${queryParams.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch digital products");
      }

      return response.json();
    },
    ...options,
  });

  return {
    digital_products: query.data?.digital_products || [],
    count: query.data?.count || 0,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
  };
};
