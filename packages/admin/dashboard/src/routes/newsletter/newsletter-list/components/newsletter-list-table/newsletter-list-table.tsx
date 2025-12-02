import { Container, Heading, toast } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { _DataTable } from "../../../../../components/table/data-table/data-table";
import { useNewsletterTableColumns } from "../../../../../hooks/table/columns/use-newsletter-table-columns";
import { useNewsletterTableFilters } from "../../../../../hooks/table/filters/use-newsletter-table-filters";
import { useNewsletterTableQuery } from "../../../../../hooks/table/query/use-newsletter-table-query";
import { useDataTable } from "../../../../../hooks/use-data-table";
import { usePermission } from "../../../../../hooks/use-permission";
import { useNewsletters } from "../../../../../hooks/api/use-newsletters";

const PAGE_SIZE = 20;

export const NewsletterListTable = () => {
  const { t } = useTranslation();
  const { searchParams, raw } = useNewsletterTableQuery({
    pageSize: PAGE_SIZE,
  });

  // Fetch newsletter data from API
  const searchQuery = searchParams.q || undefined;
  const orderParam = searchParams.order || undefined;
  const { data, isLoading, isError, error, refetch } = useNewsletters(searchQuery, orderParam);

  const newsletters = data?.newsletters || [];
  const count = newsletters.length;

  //const filters = useNewsletterTableFilters();

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/admin/newsletter-subscribers?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Deleted successfully");
        refetch();
      } else {
        toast.error("Failed to delete newsletter subscriber");
      }
    } catch (error) {
      toast.error("Failed to delete newsletter subscriber");
    }
  };

  const handleSubscribe = async (id: string) => {
    try {
      const response = await fetch(`/admin/newsletter-subscribers`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, subscribe: true }),
      });
      if (response.ok) {
        toast.success("Subscribed successfully");
        refetch();
      } else {
        toast.error("Failed to subscribe");
      }
    } catch (error) {
      toast.error("Failed to subscribe");
    }
  };

  const handleUnsubscribe = async (id: string) => {
    try {
      const response = await fetch(`/admin/newsletter-subscribers`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, subscribe: false }),
      });
      if (response.ok) {
        toast.success("Unsubscribed successfully");
        refetch();
      } else {
        toast.error("Failed to unsubscribe");
      }
    } catch (error) {
      toast.error("Failed to unsubscribe");
    }
  };

  const columns = useNewsletterTableColumns({
    onDelete: handleDelete,
    onSubscribe: handleSubscribe,
    onUnsubscribe: handleUnsubscribe,
  });
  const { hasPermission } = usePermission();

  const { table } = useDataTable({
    data: newsletters ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Newsletter Subscription</Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        //filters={filters}
        count={count}
        search
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        orderBy={[
          { key: "email", label: "Email" },
          { key: "subscribe", label: "Status" },
          { key: "created_at", label: "Subscribed At" },
        ]}
        queryObject={raw}
        noRecords={{
          message: "No newsletter subscriptions found",
        }}
      />
    </Container>
  );
};
