import { FetchError } from "@medusajs/js-sdk";
import { FindParams } from "@medusajs/types";
import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";
import { queryKeysFactory } from "../../lib/query-key-factory";

const BRAND_QUERY_KEY = "brands" as const;
export const brandsQueryKeys = queryKeysFactory(BRAND_QUERY_KEY);

type Brand = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type BrandListResponse = {
  brands: Brand[];
  search_query: string | null;
  total_count: number;
  limit: number | null;
  offset: number | null;
};

export const useBrands = (
  query?: FindParams & { q?: string },
  options?: Omit<
    UseQueryOptions<BrandListResponse, FetchError, BrandListResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: brandsQueryKeys.list(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query?.q) {
        params.append("q", query.q);
      }
      if (query?.limit) {
        params.append("limit", query.limit.toString());
      }
      if (query?.offset) {
        params.append("offset", query.offset.toString());
      }

      const response = await fetch(`/admin/brand?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch brands");
      }

      return response.json();
    },
    ...options,
  });
  return { ...data, ...rest };
};
