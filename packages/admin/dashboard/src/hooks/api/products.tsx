import { FetchError } from "@medusajs/js-sdk";
import { HttpTypes } from "@medusajs/types";
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { inventoryItemsQueryKeys } from "./inventory.tsx";

const PRODUCTS_QUERY_KEY = "products" as const;
export const productsQueryKeys = queryKeysFactory(PRODUCTS_QUERY_KEY);

const VARIANTS_QUERY_KEY = "product_variants" as const;
export const variantsQueryKeys = queryKeysFactory(VARIANTS_QUERY_KEY);

const OPTIONS_QUERY_KEY = "product_options" as const;
export const optionsQueryKeys = queryKeysFactory(OPTIONS_QUERY_KEY);

export const useCreateProductOption = (
  productId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateProductOption) =>
      sdk.admin.product.createOption(productId, payload),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: optionsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductOption = (
  productId: string,
  optionId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminUpdateProductOption) =>
      sdk.admin.product.updateOption(productId, optionId, payload),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: optionsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.detail(optionId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteProductOption = (
  productId: string,
  optionId: string,
  options?: UseMutationOptions<any, FetchError, void>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.product.deleteOption(productId, optionId),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: optionsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: optionsQueryKeys.detail(optionId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProductVariant = (
  productId: string,
  variantId: string,
  query?: HttpTypes.AdminProductVariantParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductVariantResponse,
      FetchError,
      HttpTypes.AdminProductVariantResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.product.retrieveVariant(productId, variantId, query),
    queryKey: variantsQueryKeys.detail(variantId, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProductVariants = (
  productId: string,
  query?: HttpTypes.AdminProductVariantParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductVariantListResponse,
      FetchError,
      HttpTypes.AdminProductVariantListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.product.listVariants(productId, query),
    queryKey: variantsQueryKeys.list({ productId, ...query }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateProductVariant = (
  productId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminCreateProductVariant) =>
      sdk.admin.product.createVariant(productId, payload),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminUpdateProductVariant) =>
      sdk.admin.product.updateVariant(productId, variantId, payload),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variantId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProductVariantsBatch = (
  productId: string,
  options?: UseMutationOptions<any, FetchError, any>
) => {
  return useMutation({
    mutationFn: (payload: HttpTypes.AdminBatchProductVariantRequest["update"]) =>
      sdk.admin.product.batchVariants(productId, {
        update: payload,
      }),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.details() });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProductVariantsInventoryItemsBatch = (
  productId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminBatchProductVariantInventoryItemResponse,
    FetchError,
    HttpTypes.AdminBatchProductVariantInventoryItemRequest
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.product.batchVariantInventoryItems(productId, payload),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.details() });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteVariant = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<any, FetchError, void>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.product.deleteVariant(productId, variantId),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variantId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteVariantLazy = (
  productId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductVariantDeleteResponse,
    FetchError,
    { variantId: string }
  >
) => {
  return useMutation({
    mutationFn: ({ variantId }) => sdk.admin.product.deleteVariant(productId, variantId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variables.variantId),
      });
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useProduct = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductResponse,
      FetchError,
      HttpTypes.AdminProductResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.product.retrieve(id, query),
    queryKey: productsQueryKeys.detail(id, query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useProducts = (
  query?: HttpTypes.AdminProductListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductListResponse,
      FetchError,
      HttpTypes.AdminProductListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.product.list(query),
    queryKey: productsQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateProduct = (
  options?: UseMutationOptions<
    HttpTypes.AdminProductResponse,
    FetchError,
    HttpTypes.AdminCreateProduct
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.product.create(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      // if `manage_inventory` is true on created variants that will create inventory items automatically
      queryClient.invalidateQueries({
        queryKey: inventoryItemsQueryKeys.lists(),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateProduct = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductResponse,
    FetchError,
    HttpTypes.AdminUpdateProduct
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.product.update(id, payload),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteProduct = (
  id: string,
  options?: UseMutationOptions<HttpTypes.AdminProductDeleteResponse, FetchError, void>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.product.delete(id),
    onSuccess: (data: any, variables: any, context: any) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });
      // Also invalidate digital products cache since digital products are linked to products
      queryClient.invalidateQueries({ queryKey: ["digital-products"] });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useExportProducts = (
  query?: HttpTypes.AdminProductListParams,
  options?: UseMutationOptions<
    HttpTypes.AdminExportProductResponse,
    FetchError,
    HttpTypes.AdminExportProductRequest
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.product.export(payload, query),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useImportProducts = (
  options?: UseMutationOptions<
    HttpTypes.AdminImportProductResponse,
    FetchError,
    HttpTypes.AdminImportProductRequest
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.product.createImport(payload),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useConfirmImportProducts = (options?: UseMutationOptions<{}, FetchError, string>) => {
  return useMutation({
    mutationFn: payload => sdk.admin.product.confirmImport(payload),
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
export const useDeletedProducts = (
  query?: HttpTypes.AdminProductListParams & { deleted_at?: any },
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminProductListResponse,
      FetchError,
      HttpTypes.AdminProductListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  console.log("query", query);
  const { data, ...rest } = useQuery({
    queryFn: () => {
      // Construct query with all parameters including search, filters, and sorting
      const deletedQuery = {
        ...query,
        with_deleted: true,
        // Ensure deleted_at filter is always included for soft-deleted products
        deleted_at: query?.deleted_at || {
          $ne: null, // Get products where deleted_at is not null
        },
      };

      return sdk.admin.product.list(deletedQuery);
    },
    queryKey: productsQueryKeys.list({ ...query, _deleted: true }),
    ...options,
  });

  return { ...data, ...rest };
};

export const useRestoreProduct = (
  id: string,
  options?: UseMutationOptions<HttpTypes.AdminProductResponse, FetchError, void>
) =>
  useMutation({
    mutationFn: async () => {
      const response = await fetch(`/admin/products/${id}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(
            Object.entries((sdk.client as any).config?.headers || {}).filter(
              ([key]) => key.toLowerCase().includes("auth") || key.toLowerCase().includes("cookie")
            )
          ),
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to restore" }));
        throw new Error(errorData.message);
      }

      return response.json();
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.detail(id) });

      // refresh deleted list
      queryClient.invalidateQueries({
        predicate: q => {
          const key = q.queryKey as any[];
          return key[0] === "products" && key[1] === "list" && key[2]?._deleted === true;
        },
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });

export const useBatchImageVariants = (
  productId: string,
  imageId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminBatchImageVariantResponse,
    FetchError,
    HttpTypes.AdminBatchImageVariantRequest
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.product.batchImageVariants(productId, imageId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: variantsQueryKeys.details() });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useBatchVariantImages = (
  productId: string,
  variantId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminBatchVariantImagesResponse,
    FetchError,
    HttpTypes.AdminBatchVariantImagesRequest
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.product.batchVariantImages(productId, variantId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: productsQueryKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.list({ productId }),
      });
      queryClient.invalidateQueries({
        queryKey: variantsQueryKeys.detail(variantId),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
