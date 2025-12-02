import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface UpdateUserStatusPayload {
  user_id: string;
  is_active: boolean;
}

interface UpdateUserStatusResponse {
  message: string;
  user_details: any;
}

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateUserStatusPayload): Promise<UpdateUserStatusResponse> => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.put(`${baseUrl}/admin/user-details`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      return response.data;
    },
    onSuccess: () => {
      // This will refetch any query related to users after updating
      queryClient.invalidateQueries({ queryKey: ["rbac-users"] });
    },
  });
};
