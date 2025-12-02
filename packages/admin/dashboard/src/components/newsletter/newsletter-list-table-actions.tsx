import { PencilSquare, Trash } from "@medusajs/icons";
import { useTranslation } from "react-i18next";
import { ActionMenu } from "../common/action-menu";

type NewsletterListTableActionsProps = {
  newsletter: {
    id: string;
    email: string;
    subscribe: boolean;
  };
  onDelete: (id: string) => void;
  onSubscribe: (id: string) => void;
  onUnsubscribe: (id: string) => void;
};

export const NewsletterListTableActions = ({
  newsletter,
  onDelete,
  onSubscribe,
  onUnsubscribe,
}: NewsletterListTableActionsProps) => {
  const { t } = useTranslation();

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: newsletter.subscribe ? t("actions.unsubscribe") : t("actions.subscribe"),
              onClick: () =>
                newsletter.subscribe ? onUnsubscribe(newsletter.id) : onSubscribe(newsletter.id),
              icon: <PencilSquare />,
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              onClick: () => onDelete(newsletter.id),
              icon: <Trash />,
            },
          ],
        },
      ]}
    />
  );
};
