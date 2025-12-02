import { useQueryParams } from "../../use-query-params";

type UseReviewTableQueryProps = {
  prefix?: string;
  pageSize?: number;
};

export const useReviewTableQuery = ({ prefix, pageSize = 20 }: UseReviewTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "limit",
      "order",
      "sort_by",
      "sort_order",
      "q",
      "search_fields",
      "status",
      "rating",
      "created_at",
      "updated_at",
      "created_at_from",
      "created_at_to",
      "updated_at_from",
      "updated_at_to",
    ],
    prefix
  );

  const {
    offset,
    limit,
    order,
    sort_by,
    sort_order,
    q,
    search_fields,
    status,
    rating,
    created_at,
    updated_at,
    created_at_from,
    created_at_to,
    updated_at_from,
    updated_at_to,
  } = queryObject;

  const searchParams = {
    offset: offset ? Number(offset) : 0,
    limit: limit ? Number(limit) : pageSize,
    order:
      order ||
      (sort_by && sort_order ? `${sort_order === "desc" ? "-" : ""}${sort_by}` : "-created_at"),
    q: q || undefined,
    search_fields:
      search_fields ||
      (q ? "content,first_name,last_name,customer.email,product.title" : undefined),
    status: status?.split(","),
    rating: rating?.split(","),
    created_at_from: created_at_from || undefined,
    created_at_to: created_at_to || undefined,
    updated_at_from: updated_at_from || undefined,
    updated_at_to: updated_at_to || undefined,
  };

  // Remove undefined values to clean up the API call
  const cleanedSearchParams = Object.entries(searchParams).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        // Handle arrays - only include if they have items
        if (Array.isArray(value) && value.length === 0) {
          return acc;
        }
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>
  );

  return {
    searchParams: cleanedSearchParams,
    raw: queryObject,
  };
};
