import { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "../../../../lib/query-client";
import axios from "axios";

const rbacRoleQuery = (id: string) => ({
  queryKey: ["rbac-role", id],
  queryFn: async () => {
    const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;

    const response = await axios.get(`${baseUrl}/admin/rbac/roles/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    });
    return response.data;
  },
});

export const userLoader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;
  const query = rbacRoleQuery(id!);

  const data = await queryClient.ensureQueryData(query);

  return {
    role: data,
  };
};
