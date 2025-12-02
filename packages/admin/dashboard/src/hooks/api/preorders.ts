import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query Keys
export const preordersQueryKeys = {
  all: ["preorders"] as const,
  lists: () => [...preordersQueryKeys.all, "list"] as const,
  list: (filters: Record<string, any> = {}) =>
    [...preordersQueryKeys.lists(), { filters }] as const,
  details: () => [...preordersQueryKeys.all, "detail"] as const,
  detail: (id: string, filters: Record<string, any> = {}) =>
    [...preordersQueryKeys.details(), id, { filters }] as const,
  variantPreorder: (variantId: string) =>
    [...preordersQueryKeys.all, "variant", variantId] as const,
  orderPreorders: (orderId: string) => [...preordersQueryKeys.all, "order", orderId] as const,
};

// Hook to get all preorders
export const usePreorders = () => {
  return useQuery({
    queryKey: preordersQueryKeys.lists(),
    queryFn: async () => {
      // This would typically fetch from the API, but for now we'll return empty data
      // since we need to implement the actual API call
      return { preorders: [], count: 0 };
    },
  });
};

// Hook to get preorder configuration for a variant
export const useVariantPreorder = (variantId: string) => {
  return useQuery({
    queryKey: preordersQueryKeys.variantPreorder(variantId),
    queryFn: async () => {
      const response = await fetch(`/admin/variants/${variantId}/preorders`);
      if (!response.ok) {
        throw new Error("Failed to fetch variant preorder config");
      }
      const data = await response.json();
      return data.preorder_variant;
    },
    enabled: !!variantId,
  });
};

// Hook to get preorders for an order
export const useOrderPreorders = (orderId: string) => {
  return useQuery({
    queryKey: preordersQueryKeys.orderPreorders(orderId),
    queryFn: async () => {
      const response = await fetch(`/admin/orders/${orderId}/preorders`);
      if (!response.ok) {
        throw new Error("Failed to fetch order preorders");
      }
      return response.json();
    },
    enabled: !!orderId,
  });
};

// Hook to enable preorder for a variant
export const useEnablePreorder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variantId,
      availableDate,
    }: {
      variantId: string;
      availableDate: string;
    }) => {
      const response = await fetch(`/admin/variants/${variantId}/preorders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          available_date: availableDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enable preorder");
      }

      return response.json();
    },
    onSuccess: (_, { variantId }) => {
      queryClient.invalidateQueries({
        queryKey: preordersQueryKeys.variantPreorder(variantId),
      });
    },
  });
};

// Hook to disable preorder for a variant
export const useDisablePreorder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ variantId }: { variantId: string }) => {
      const response = await fetch(`/admin/variants/${variantId}/preorders`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disable preorder");
      }

      return response.json();
    },
    onSuccess: (_, { variantId }) => {
      queryClient.invalidateQueries({
        queryKey: preordersQueryKeys.variantPreorder(variantId),
      });
    },
  });
};
