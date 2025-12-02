import { useQueryParams } from "../../../../../hooks/use-query-params";

export const useCategoryTableQuery = ({
  pageSize = 20,
  prefix,
}: {
  pageSize?: number;
  prefix?: string;
}) => {
  const raw = useQueryParams(["q", "offset", "order"], prefix);
  // Sanitize raw.q by removing leading slashes
  const sanitizedQ = raw.q ? raw.q.replace(/^\/+/, "") : raw.q;

  const searchParams = {
    q: sanitizedQ,
    limit: pageSize,
    offset: raw.offset ? Number(raw.offset) : 0,
    order: raw.order,
  };

  return {
    raw: { ...raw, q: sanitizedQ },
    searchParams,
  };
};
