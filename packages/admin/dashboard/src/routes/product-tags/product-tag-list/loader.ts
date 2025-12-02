import { HttpTypes } from "@medusajs/types";
import { LoaderFunctionArgs } from "react-router-dom";

import { productTagsQueryKeys } from "../../../hooks/api";
import { sdk } from "../../../lib/client";
import { queryClient } from "../../../lib/query-client";

const productTagListQuery = (query?: HttpTypes.AdminProductTagListParams) => ({
  queryKey: productTagsQueryKeys.list(query),
  queryFn: async () => sdk.admin.productTag.list(query),
});

export const productTagListLoader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  if (!searchParams.has("order")) {
    searchParams.set("order", "-updated_at");
    return Response.redirect(`${url.pathname}?${searchParams.toString()}`, 302);
  }

  const queryObject: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    try {
      queryObject[key] = JSON.parse(value);
    } catch (_e) {
      queryObject[key] = value;
    }
  });

  const query = productTagListQuery(queryObject as HttpTypes.AdminProductTagListParams);

  return queryClient.getQueryData<any>(query.queryKey) ?? (await queryClient.fetchQuery(query));
};
