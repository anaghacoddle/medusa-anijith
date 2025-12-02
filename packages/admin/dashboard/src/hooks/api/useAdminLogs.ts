import axios from "axios";
import { useQuery } from "@tanstack/react-query";

export interface AdminLog {
  _id: string;
  level: string;
  message: string;
  timestamp: string;
  meta: Record<string, any>;
}

export interface AdminLogsResponse {
  logs: AdminLog[];
  count: number;
  limit: number;
  offset: number;
}

export interface UseAdminLogsParams {
  limit?: number;
  offset?: number;
  level?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  method?: string;
  requestId?: string;
  userType?: string;
  select?: string[];
}

export const useAdminLogs = (params: UseAdminLogsParams = {}, options?: any) => {
  const {
    limit = 20,
    offset = 0,
    level,
    type,
    search,
    startDate,
    endDate,
    method,
    requestId,
    userType,
    select,
  } = params;

  const queryParams = new URLSearchParams();
  queryParams.append("limit", limit.toString());
  queryParams.append("offset", offset.toString());

  if (level) queryParams.append("level", level);
  if (type) queryParams.append("type", type);
  if (search) queryParams.append("search", search);
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  if (requestId) queryParams.append("requestId", requestId);
  if (userType) queryParams.append("userType", userType);
  if (method) queryParams.append("method", method);
  if (select && select.length > 0) {
    select.forEach(field => queryParams.append("select", field));
  }

  const query = useQuery<AdminLogsResponse>({
    queryKey: ["admin-logs", params],
    queryFn: async (): Promise<AdminLogsResponse> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const url = `${baseUrl}/admin/logs?${queryParams.toString()}`;
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
    logs: query.data?.logs || [],
    count: query.data?.count || 0,
    limit: query.data?.limit || limit,
    offset: query.data?.offset || offset,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};
