import { HttpTypes, PaginatedResponse } from "@medusajs/types";
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { pricePreferencesQueryKeys } from "./price-preferences";
import { FetchError } from "@medusajs/js-sdk";
import axios from "axios";

const REGIONS_QUERY_KEY = "regions" as const;
export const regionsQueryKeys = queryKeysFactory(REGIONS_QUERY_KEY);

export const useRegion = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      { region: HttpTypes.AdminRegion },
      FetchError,
      { region: HttpTypes.AdminRegion },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: regionsQueryKeys.detail(id, query),
    queryFn: async () => sdk.admin.region.retrieve(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useRegions = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<{ regions: HttpTypes.AdminRegion[] }>,
      FetchError,
      PaginatedResponse<{ regions: HttpTypes.AdminRegion[] }>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.region.list(query),
    queryKey: regionsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useUpdateLoyaltyConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.post(`${baseUrl}/admin/loyalty-config`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-config"] });
    },
  });
};

// Chained hook for creating a region and then updating loyalty config
export const useCreateRegion = (
  options?: any // Use the correct type for your options if needed
) => {
  const queryClient = useQueryClient();
  const updateLoyaltyConfig = useUpdateLoyaltyConfig();

  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateRegion) => sdk.admin.region.create(payload),
    onSuccess: async (data, variables, context) => {
      // Invalidate region and price preferences queries
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      queryClient.invalidateQueries({ queryKey: ["price-preferences-list"] });
      queryClient.invalidateQueries({ queryKey: ["price-preferences-details"] });

      // Call the loyalty config update API with the new region's ID
      await updateLoyaltyConfig.mutateAsync({
        region: data.region.currency_code,
        conversion_rate: 1,
        // Add other fields as needed for your loyalty config
      });

      // Call any additional onSuccess logic passed in options
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};

export const useUpdateRegion = (
  id: string,
  options?: UseMutationOptions<
    { region: HttpTypes.AdminRegion },
    FetchError,
    HttpTypes.AdminUpdateRegion
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.region.update(id, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: regionsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regionsQueryKeys.details() });

      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.list(),
      });
      queryClient.invalidateQueries({
        queryKey: pricePreferencesQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteRegion = (
  id: string,
  options?: UseMutationOptions<HttpTypes.AdminRegionDeleteResponse, FetchError, void>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.region.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: regionsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: regionsQueryKeys.detail(id) });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
