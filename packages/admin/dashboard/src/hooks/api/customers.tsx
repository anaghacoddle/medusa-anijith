import { FetchError } from "@medusajs/js-sdk";
import { HttpTypes, PaginatedResponse } from "@medusajs/types";
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { sdk } from "../../lib/client";
import { queryClient } from "../../lib/query-client";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { customerGroupsQueryKeys } from "./customer-groups";
import axios from "axios";
import { usePermission } from "../../hooks/use-permission";

const CUSTOMERS_QUERY_KEY = "customers" as const;
export const customersQueryKeys = queryKeysFactory(CUSTOMERS_QUERY_KEY);
export const customerAddressesQueryKeys = queryKeysFactory(`${CUSTOMERS_QUERY_KEY}-addresses`);

const CUSTOMER_LIST_QUERY_KEY = "customer-list" as const;
export const customerListQueryKeys = queryKeysFactory(CUSTOMER_LIST_QUERY_KEY);

export type CombinedCustomer = {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  addresses: {
    id: string;
    customer_id: string;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    country_code: string | null;
    house_no: string | null;
    street_name: string | null;
    location: string | null;
  }[];
};

type CustomersResponse = {
  customers: CombinedCustomer[];
};
type CustomerBasic = {
  id: string;
  has_account: boolean;
  created_at: string;
};

type CustomerBasicResponse = {
  customers: CustomerBasic[];
};

export const useCustomerBasic = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<CustomerBasicResponse, FetchError, CustomerBasicResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: customerListQueryKeys.list(query),
    queryFn: async () => {
      const res = await axios.get<CustomerBasicResponse>("/admin/customers", {
        params: query,
      });
      return res.data;
    },
    ...options,
  });

  return {
    customers: data?.customers ?? [],
    ...rest,
  };
};

export const useCustomerPersonal = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<CustomersResponse, FetchError, CustomersResponse, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  return useQuery({
    queryKey: customerListQueryKeys.list(query),
    queryFn: async () => {
      const res = await axios.get<CustomersResponse>("/admin/get-full-customer-data", {
        params: query,
      });
      return res.data;
    },
    ...options,
  });
};

export const useCustomer = (
  id: string,
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      { customer: HttpTypes.AdminCustomer },
      FetchError,
      { customer: HttpTypes.AdminCustomer },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { user } = usePermission();
  const routePermissions = (user as any)?.role?.routePermissions || {};

  // Check if user has full access to customers route
  const hasFullAccess =
    routePermissions["/admin/customers"]?.includes("full_access") ||
    routePermissions["/admin"]?.includes("ALL");

  const { data, ...rest } = useQuery({
    queryKey: customersQueryKeys.detail(id),
    queryFn: async () => {
      if (hasFullAccess) {
        // Return full customer data if user has full access
        return sdk.admin.customer.retrieve(id, {
          ...query,
          fields: "+*addresses,+customer_sub.middle_name,+customer_address_update.location",
        });
      } else {
        // Return limited customer data if user doesn't have full access
        const limitedQuery = {
          ...query,
          fields: "id,has_account,created_at",
        };
        return sdk.admin.customer.retrieve(id, limitedQuery);
      }
    },
    ...options,
  });

  return { ...data, ...rest };
};

export const useCustomers = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<{ customers: HttpTypes.AdminCustomer[] }>,
      FetchError,
      PaginatedResponse<{ customers: HttpTypes.AdminCustomer[] }>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { user } = usePermission();
  const routePermissions = (user as any)?.role?.routePermissions || {};

  // Check if user has full access to customers route
  const hasFullAccess =
    routePermissions["/admin/customers"]?.includes("full_access") ||
    routePermissions["/admin"]?.includes("ALL");

  const { data, ...rest } = useQuery({
    queryFn: async () => {
      if (hasFullAccess) {
        // Return full customer data if user has full access
        return sdk.admin.customer.list(query);
      } else {
        // Return limited customer data if user doesn't have full access
        const limitedQuery = {
          ...query,
          fields: "id,has_account,created_at",
        };
        return sdk.admin.customer.list(limitedQuery);
      }
    },
    queryKey: customersQueryKeys.list(query),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCreateCustomer = (
  options?: UseMutationOptions<
    { customer: HttpTypes.AdminCustomer },
    FetchError,
    HttpTypes.AdminCreateCustomer
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.customer.create(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreateCustomerWithEmailEncryption = (
  options?: UseMutationOptions<
    { customer: HttpTypes.AdminCustomer },
    FetchError,
    HttpTypes.AdminCreateCustomer
  >
) => {
  return useMutation({
    mutationFn: async payload => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;

      const response = await axios.post(`${baseUrl}/admin/customer-with-email`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      return { customer: response.data[0] };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateCustomer = (
  id: string,
  options?: UseMutationOptions<
    { customer: HttpTypes.AdminCustomer },
    FetchError,
    HttpTypes.AdminUpdateCustomer
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.customer.update(id, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteCustomer = (
  id: string,
  options?: UseMutationOptions<HttpTypes.AdminCustomerDeleteResponse, FetchError, void>
) => {
  return useMutation({
    mutationFn: () => sdk.admin.customer.delete(id),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCustomerLoyaltyPoints = (customerId: string) => {
  return useQuery({
    queryKey: ["customer", customerId, "loyalty-points"],
    queryFn: () =>
      sdk.client.fetch<{ points: number }>(`/admin/customers/${customerId}/loyalty-points`),
  });
};

export const useBatchCustomerCustomerGroups = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCustomerResponse,
    FetchError,
    HttpTypes.AdminBatchLink
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.customer.batchCustomerGroups(id, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.details(),
      });
      queryClient.invalidateQueries({
        queryKey: customerGroupsQueryKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.details(),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useCreateCustomerAddress = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCustomerResponse,
    FetchError,
    HttpTypes.AdminCreateCustomerAddress
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.customer.createAddress(id, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: customerAddressesQueryKeys.list(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateCustomerAddress = (
  id: string,
  addressId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminCustomerResponse,
    FetchError,
    HttpTypes.AdminUpdateCustomerAddress
  >
) => {
  return useMutation({
    mutationFn: payload => sdk.admin.customer.updateAddress(id, addressId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: customerAddressesQueryKeys.list(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteCustomerAddress = (
  id: string,
  options?: UseMutationOptions<HttpTypes.AdminCustomerResponse, FetchError, string>
) => {
  return useMutation({
    mutationFn: (addressId: string) => sdk.admin.customer.deleteAddress(id, addressId),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: customersQueryKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: customersQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: customerAddressesQueryKeys.list(id),
      });

      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useListCustomerAddresses = (
  id: string,
  query?: Record<string, any>,
  options?: UseQueryOptions<
    HttpTypes.AdminCustomerResponse,
    FetchError,
    HttpTypes.AdminCustomerResponse,
    QueryKey
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.customer.listAddresses(id, query),
    queryKey: customerAddressesQueryKeys.list(id),
    ...options,
  });

  return { ...data, ...rest };
};

export const useCustomerAddress = (
  id: string,
  addressId: string,
  options?: UseQueryOptions<
    HttpTypes.AdminCustomerResponse,
    FetchError,
    HttpTypes.AdminCustomerResponse,
    QueryKey
  >
) => {
  const { data, ...rest } = useQuery({
    queryFn: () => sdk.admin.customer.retrieveAddress(id, addressId),
    queryKey: customerAddressesQueryKeys.detail(id),
    ...options,
  });

  return { ...data, ...rest };
};
