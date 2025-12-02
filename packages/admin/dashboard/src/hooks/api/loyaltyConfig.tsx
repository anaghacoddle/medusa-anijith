import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CreateRolePayload } from "./rbac";

export interface LoyaltyConfig {
  id: string;
  conversion_rate: number;
  region: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const useLoyaltyConfig = (options?: any) => {
  return useQuery({
    queryKey: ["loyalty-config"],
    queryFn: async (): Promise<LoyaltyConfig[]> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.get(`${baseUrl}/admin/loyalty-config`, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      // ✅ return array directly
      return response.data.loyaltyConfigs;
    },
    ...options,
  });
};

export const useSingleLoyaltyConfig = (id: string, options?: any) => {
  return useQuery({
    queryKey: ["loyalty-config", id],
    queryFn: async (): Promise<LoyaltyConfig[]> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.get(`${baseUrl}/admin/loyalty-config/${id}`, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      // ✅ return array directly
      return response.data.loyaltyConfig;
    },
    ...options,
  });
};

export const useDeleteLoyaltyConfig = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<any> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.delete(`${baseUrl}/admin/loyalty-config/${id}`, {
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

export const useUpdateLoyaltyConfig = () => {
  const querClint = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRolePayload): Promise<LoyaltyConfig> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.put(`${baseUrl}/admin/loyalty-config`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      querClint.invalidateQueries({ queryKey: ["loyalty-config"] });
    },
  });
};
