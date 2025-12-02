import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminRole {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RbacRolesResponse {
  roles: AdminRole[];
  count: number;
  offset: number;
  limit: number;
}

export interface UseRbacRolesParams {
  q?: string;
  order?: string;
  offset?: number;
  limit?: number;
}

export interface RbacRoute {
  id: number;
  name: string;
  module: string;
  path?: string;
  method?: string;
  description?: string;
}

export interface RbacRoutesResponse {
  routes: RbacRoute[];
  count: number;
}

export interface CreateRolePayload {
  name: string | undefined;
  modules: string[] | undefined;
  module_control: {
    id: string;
    can_read: boolean;
    can_create: boolean;
    can_update: boolean;
    can_delete: boolean;
  }[];
}

export interface CreateRoleResponse {
  role: AdminRole;
}

export const useRbacRoles = (params: UseRbacRolesParams = {}, options?: any) => {
  const { q, order, offset = 0, limit = 20 } = params;
  const hasParams = q || order || offset !== 0 || limit !== 20;

  const queryParams = new URLSearchParams();
  if (q) queryParams.append("q", q);
  if (order) queryParams.append("order", order);
  queryParams.append("offset", offset.toString());
  queryParams.append("limit", limit.toString());

  const query = useQuery<RbacRolesResponse>({
    queryKey: ["rbac-roles", { q, order, offset, limit }],
    queryFn: async (): Promise<RbacRolesResponse> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const url = `${baseUrl}/admin/rbac/roles${hasParams ? `?${queryParams.toString()}` : ""}`;
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      return response.data;
    },
    ...options,
  });

  return {
    roles: query.data?.roles || [],
    count: query.data?.count || 0,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  };
};

export const useRbacRole = (id?: string, options?: any) => {
  return useQuery({
    queryKey: ["rbac-role", id],
    queryFn: async (): Promise<AdminRole> => {
      if (!id) throw new Error("Role ID is required");

      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.get(`${baseUrl}/admin/rbac/roles/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

export const useRbacRoutes = (options?: any) => {
  const query = useQuery<RbacRoutesResponse>({
    queryKey: ["rbac-routes"],
    queryFn: async (): Promise<RbacRoutesResponse> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;

      const response = await axios.get(`${baseUrl}/admin/rbac/routes`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      return response.data;
    },
    ...options,
  });

  return {
    routes: query.data?.routes || [],
    count: query.data?.count || 0,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  };
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRolePayload): Promise<CreateRoleResponse> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.post(`${baseUrl}/admin/rbac/roles`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac-roles"] });
    },
  });
};

export const useUpdateRole = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateRolePayload): Promise<CreateRoleResponse> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.put(`${baseUrl}/admin/rbac/roles/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac-roles"] });
    },
  });
};

export const useDeleteRole = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<CreateRoleResponse> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.delete(`${baseUrl}/admin/rbac/roles/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac-roles"] });
    },
  });
};
