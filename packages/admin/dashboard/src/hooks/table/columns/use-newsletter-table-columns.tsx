import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { StatusCell } from "../../../components/table/table-cells/common/status-cell";
import { TextCell, TextHeader } from "../../../components/table/table-cells/common/text-cell";
import { NewsletterListTableActions } from "../../../components/newsletter/newsletter-list-table-actions";

type Newsletter = {
  id: string;
  email: string;
  subscribe: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const columnHelper = createColumnHelper<Newsletter>();

export const useNewsletterTableColumns = ({
  onDelete,
  onSubscribe,
  onUnsubscribe,
}: {
  onDelete: (id: string) => void;
  onSubscribe: (id: string) => void;
  onUnsubscribe: (id: string) => void;
}) => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("email", {
        header: () => <TextHeader text="Email" />,
        cell: info => <TextCell text={info.getValue()} />,
      }),
      columnHelper.accessor("subscribe", {
        header: "Status",
        cell: ({ row }) => {
          const isSubscribed = row.original.subscribe;
          const color = isSubscribed ? "green" : "red";
          const text = isSubscribed ? "Subscribed" : "Unsubscribed";

          return <StatusCell color={color}>{text}</StatusCell>;
        },
      }),
      columnHelper.accessor("created_at", {
        header: "Subscribed Date",
        cell: info => {
          const date = info.getValue();
          return <TextCell text={date ? new Date(date).toLocaleDateString() : "-"} />;
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <NewsletterListTableActions
            newsletter={row.original}
            onDelete={onDelete}
            onSubscribe={onSubscribe}
            onUnsubscribe={onUnsubscribe}
          />
        ),
      }),
    ],
    [onDelete, onSubscribe, onUnsubscribe]
  );
};
