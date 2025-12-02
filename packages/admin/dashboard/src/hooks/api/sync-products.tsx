import axios from "axios";
import { useMutation } from "@tanstack/react-query";

export const useFormattedProducts = () => {
  return useMutation({
    mutationFn: async (payload?: any) => {
      const baseUrl = __BACKEND_URL__ === "/" ? "" : __BACKEND_URL__;
      const response = await axios.post(`${baseUrl}/admin/formatted-products`, payload ?? {}, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      return response.data;
    },
  });
};
