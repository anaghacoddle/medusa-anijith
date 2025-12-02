import { useQueryParams } from "../../use-query-params";

export const useNewsletterTableQuery = ({
  pageSize = 20,
  prefix,
}: {
  pageSize?: number;
  prefix?: string;
}) => {
  const raw = useQueryParams(["offset", "q", "order", "status"], prefix);

  const searchParams = {
    limit: pageSize,
    offset: raw.offset ? Number(raw.offset) : 0,
    order: raw.order,
    status: raw.status?.split(","),
    q: raw.q,
  };

  return {
    searchParams,
    raw,
  };
};
