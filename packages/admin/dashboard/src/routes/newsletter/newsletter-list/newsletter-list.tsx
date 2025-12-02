import { NewsletterListTable } from "./components/newsletter-list-table";

import { SingleColumnPage } from "../../../components/layout/pages";
import { useExtension } from "../../../providers/extension-provider";

export const NewsletterList = () => {
  const { getWidgets } = useExtension();

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("newsletter.list.after" as any),
        before: getWidgets("newsletter.list.before" as any),
      }}
      hasOutlet={false}
    >
      <NewsletterListTable />
    </SingleColumnPage>
  );
};
