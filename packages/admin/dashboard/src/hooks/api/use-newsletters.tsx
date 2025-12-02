import { useQuery, keepPreviousData } from "@tanstack/react-query";

type Newsletter = {
  id: string;
  email: string;
  subscribe: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type NewsletterResponse = {
  newsletters: Newsletter[];
};

export const useNewsletters = (searchQuery?: string, order?: string) => {
  return useQuery<NewsletterResponse>({
    queryKey: ["newsletters", searchQuery, order],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (order) params.append("order", order);

      const url = `/admin/newsletter-subscribers${params.toString() ? "?" + params.toString() : ""}`;

      const res = await fetch(url, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch newsletters: ${res.status}`);
      }

      return res.json();
    },
    enabled: !searchQuery || searchQuery.length > 0,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};
