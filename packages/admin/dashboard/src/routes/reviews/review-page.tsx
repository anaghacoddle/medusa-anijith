import { ChatBubbleLeftRight } from "@medusajs/icons";
import { Button, Container, Heading, StatusBadge, Text, Toaster, toast } from "@medusajs/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useCallback, useMemo, useState } from "react";
import { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { _DataTable } from "../../components/table/data-table";
import DetailDrawer from "../../components/modals/DetailDrawer/DetailDrawer";
import { decryptObject } from "../../utils/encryption";
import RejectReasonModal from "./RejectReasonModal";
import { useReviewTableFilters } from "../../hooks/table/filters/useReviewTableFilters";
import { useReviewTableQuery } from "../../hooks/table/query/use-review-table-query";
import { useDataTable } from "../../hooks/use-data-table";

export type Review = {
  id: string;
  title?: string;
  content: string;
  rating: number;
  reject_reason: string;
  product_id: string;
  customer_id?: string;
  order_id?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  product?: { title?: string };
  customer?: {
    last_name: any;
    first_name: any;
    email?: string;
  };
};

const PAGE_SIZE = 20;

const getStatusColor = (status: string) => {
  switch (status) {
    case "approved":
      return "green";
    case "rejected":
      return "red";
    default:
      return "grey";
  }
};

const ReviewsPage = () => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const { t } = useTranslation();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectedForReject, setSelectedForReject] = useState<Review[]>([]);

  // Use the new hook for URL management and API params
  const { searchParams, raw } = useReviewTableQuery({ pageSize: PAGE_SIZE });

  // Add filters
  const filters = useReviewTableFilters();

  const { data, isLoading, isError, error, refetch } = useQuery<{
    reviews: Review[];
    count: number;
    limit: number;
    offset: number;
  }>({
    queryKey: ["reviews", searchParams],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();

        // Add all search params to the URL
        Object.entries(searchParams).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        });

        console.log("API call with params:", params.toString()); // DEBUG: Remove in production

        const res = await fetch(`/admin/reviews?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch reviews: ${res.status} ${errorText}`);
        }

        const result = await res.json();

        const decryptedReviews = await Promise.all(
          (result.reviews || []).map(async (review: Review) => {
            try {
              const decryptedReview = await decryptObject(review, [
                "id",
                "product_id",
                "customer_id",
                "order_id",
                "status",
                "rating",
                "created_at",
                "updated_at",
              ]);
              return decryptedReview as Review;
            } catch (error) {
              console.error(`Failed to decrypt review ${review.id}:`, error);
              return review;
            }
          })
        );

        return {
          reviews: decryptedReviews,
          count: result.count || 0,
          limit: result.limit || PAGE_SIZE,
          offset: result.offset || 0,
        };
      } catch (error) {
        console.error("Reviews fetch error:", error);
        throw error;
      }
    },
    placeholderData: keepPreviousData,
  });

  const handleOpenModal = useCallback((review: Review) => {
    setSelectedReview(review);
  }, []);

  const handleCloseModal = () => setSelectedReview(null);

  // Bulk action handlers
  const handleBulkApprove = async () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    if (!selectedIds.length) {
      toast.error("No reviews selected");
      return;
    }

    try {
      const res = await fetch("/admin/reviews/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: selectedIds, status: "approved" }),
      });

      if (!res.ok) throw new Error("Failed to approve reviews");

      toast.success(`${selectedIds.length} review(s) approved successfully`);
      setRowSelection({});
      refetch();
    } catch (error) {
      toast.error("Failed to approve reviews");
    }
  };

  const handleOpenRejectPopup = () => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    const reviewsToReject = data?.reviews.filter(r => selectedIds.includes(r.id)) || [];
    setSelectedForReject(reviewsToReject);
    setRejectModalOpen(true);
  };

  const handleBulkReject = async (reason?: string) => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    if (!selectedIds.length) {
      toast.error("No reviews selected");
      return;
    }
    if (!reason) {
      setRejectModalOpen(true);
      return;
    }

    try {
      const res = await fetch("/admin/reviews/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ids: selectedIds,
          status: "rejected",
          reject_reason: reason,
        }),
      });

      if (!res.ok) throw new Error("Failed to reject reviews");

      toast.success(`${selectedIds.length} review(s) rejected successfully`);
      setRowSelection({});
      refetch();
    } catch (error) {
      toast.error("Failed to reject reviews");
    }
  };

  const columns = useMemo<ColumnDef<Review>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={e => table.toggleAllPageRowsSelected(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
            aria-label="Select row"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={e => row.toggleSelected(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        header: "ID",
        accessorKey: "id",
        enableSorting: true,
        cell: ({ row }) => {
          const fullId = row.original.id;
          const shortId = fullId.length > 10 ? `${fullId.slice(0, 10)}...` : fullId;

          return (
            <div className="w-20">
              <button
                className="text-blue-600 underline cursor-pointer"
                onClick={() => handleOpenModal(row.original)}
              >
                {shortId}
              </button>
            </div>
          );
        },
      },
      {
        header: "Product",
        accessorKey: "product",
        enableSorting: false,
        cell: ({ row }) => {
          const productTitle = row.original.product?.title ?? "N/A";
          const query = searchParams.q || "";

          const highlightText = (text: string, query: string) => {
            if (!query.trim()) return text;
            const regex = new RegExp(`(${query})`, "gi");
            return text.replace(regex, "<mark>$1</mark>");
          };

          return (
            <Link to={`/products/${row.original.product_id}`}>
              <span
                dangerouslySetInnerHTML={{
                  __html: highlightText(productTitle, query),
                }}
              />
            </Link>
          );
        },
      },
      {
        header: "Content",
        accessorKey: "content",
        enableSorting: true,
        cell: ({ row }) => {
          const content = row.original.content;
          const maxLength = 60;
          const truncated =
            content.length > maxLength ? content.slice(0, maxLength) + "..." : content;
          const query = searchParams.q || "";

          const highlightText = (text: string, query: string) => {
            if (!query.trim()) return text;
            const regex = new RegExp(`(${query})`, "gi");
            return text.replace(regex, "<mark>$1</mark>");
          };

          return (
            <span
              title={content}
              dangerouslySetInnerHTML={{
                __html: highlightText(truncated, query),
              }}
            />
          );
        },
      },
      {
        id: "customer",
        header: "Customer",
        enableSorting: false,
        cell: ({ row }) => {
          const customer = row.original.customer;
          const fallbackFirst = (row.original as any).first_name;
          const fallbackLast = (row.original as any).last_name;
          const fallbackEmail = (row.original as any).email;

          const fullName = customer
            ? [customer.first_name, customer.last_name].filter(Boolean).join(" ")
            : [fallbackFirst, fallbackLast].filter(Boolean).join(" ");

          const email = customer?.email ?? fallbackEmail ?? "";
          const query = searchParams.q || "";

          const highlightText = (text: string, query: string) => {
            if (!query.trim()) return text;
            const regex = new RegExp(`(${query})`, "gi");
            return text.replace(regex, "<mark>$1</mark>");
          };

          return (
            <div>
              <div
                dangerouslySetInnerHTML={{
                  __html: highlightText(fullName || email || "N/A", query),
                }}
              />
              {email && (
                <div
                  className="text-xs text-ui-fg-subtle"
                  dangerouslySetInnerHTML={{
                    __html: highlightText(email, query),
                  }}
                />
              )}
            </div>
          );
        },
      },
      {
        header: "Rating",
        accessorKey: "rating",
        enableSorting: true,
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <StatusBadge color={getStatusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </StatusBadge>
          );
        },
      },
      {
        header: "Created At",
        accessorKey: "created_at",
        enableSorting: true,
        cell: ({ row }) => {
          return new Date(row.original.created_at).toLocaleDateString();
        },
      },
      {
        header: "Updated At",
        accessorKey: "updated_at",
        enableSorting: true,
        cell: ({ row }) => {
          return new Date(row.original.updated_at).toLocaleDateString();
        },
      },
    ],
    [handleOpenModal, searchParams.q]
  );

  // Use the useDataTable hook like in the products page
  const { table } = useDataTable({
    data: (data?.reviews ?? []) as Review[],
    columns,
    count: data?.count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row: Review) => row.id,
    enableRowSelection: true,
    rowSelection: {
      state: rowSelection,
      updater: setRowSelection,
    },
    // onRowSelectionChange: setRowSelection,
  });

  const reviewDrawerData = useMemo(() => {
    if (!selectedReview) return [];

    const customer = selectedReview.customer;
    const fullName = [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "N/A";

    const baseData = [
      { label: "Review ID", value: selectedReview.id },
      { label: "Content", value: selectedReview.content },
      { label: "Rating", value: selectedReview.rating.toString() },
      { label: "Status", value: selectedReview.status },
      { label: "Product ID", value: selectedReview.product_id },
      { label: "Product Title", value: selectedReview.product?.title || "N/A" },
      { label: "Customer Name", value: fullName },
      { label: "Customer Email", value: customer?.email || "N/A" },
      {
        label: "Created At",
        value: new Date(selectedReview.created_at).toLocaleString(),
      },
    ];

    if (selectedReview.status === "rejected") {
      baseData.splice(4, 0, {
        label: "Reject Reason",
        value: selectedReview.reject_reason || "N/A",
      });
    }

    return baseData;
  }, [selectedReview]);

  if (isError) {
    console.error("Reviews query error:", error);
  }

  const selectedCount = Object.keys(rowSelection).filter(key => rowSelection[key]).length;

  const noRecordsMessage = useMemo(() => {
    if (isLoading) return "Loading...";

    if (isError) {
      return "Failed to load reviews. Please try again.";
    }

    if (searchParams.q?.trim()) {
      return `No reviews found matching "${searchParams.q}"`;
    }

    return t("No reviews found", "No reviews found");
  }, [searchParams.q, isLoading, isError, t]);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("reviews.domain", "Reviews")}</Heading>
          {searchParams.q && (
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Searching for: "{searchParams.q}" in content, customer name, email, and product
            </Text>
          )}
        </div>
      </div>

      {selectedCount > 0 && !isError && (
        <div className="flex items-center justify-between px-6 py-3 bg-ui-bg-subtle border-b">
          <Text size="small" className="text-ui-fg-subtle">
            {selectedCount} review{selectedCount > 1 ? "s" : ""} selected
          </Text>
          <div className="flex gap-2">
            <Button variant="secondary" size="small" onClick={handleBulkApprove}>
              Approve Selected
            </Button>
            <Button variant="secondary" size="small" onClick={handleOpenRejectPopup}>
              Reject Selected
            </Button>
          </div>
        </div>
      )}

      <_DataTable<Review>
        table={table}
        columns={columns}
        count={data?.count}
        queryObject={raw}
        pageSize={PAGE_SIZE}
        filters={filters}
        isLoading={isLoading}
        pagination
        search={true}
        searchPlaceholder="Search by content, customer name, email, or product..."
        noRecords={{
          message: noRecordsMessage as string,
        }}
        orderBy={[
          { key: "status", label: t("fields.status") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        reviewTable={true}
      />

      <DetailDrawer open={!!selectedReview} onClose={handleCloseModal} data={reviewDrawerData} />
      <Toaster />

      <style>
        {`
          mark {
            background-color: #fef08a;
            padding: 1px 2px;
            border-radius: 2px;
          }
        `}
      </style>

      <RejectReasonModal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onSubmit={reason => handleBulkReject(reason)}
        selectedReviews={selectedForReject}
      />
    </Container>
  );
};

export const config = {
  label: "Reviews",
  icon: ChatBubbleLeftRight,
};

export default ReviewsPage;
