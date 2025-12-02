import { PencilSquare, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { toast, usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../../../../../components/common/action-menu";
import { useDeleteCollection } from "../../../../../hooks/api/collections";
import { usePermission } from "../../../../../hooks/use-permission";
export const CollectionRowActions = ({ collection }: { collection: HttpTypes.AdminCollection }) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { hasPermission } = usePermission();

  const { mutateAsync } = useDeleteCollection(collection.id!);

  const handleDeleteCollection = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("collections.deleteWarning", {
        title: collection.title,
      }),
      verificationText: collection.title,
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }
    toast.success("Deleted collection");

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("collections.deleteSuccess", {
            title: collection.title,
          })
        );
      },
      onError: e => {
        toast.error(e.message);
      },
    });
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: `/collections/${collection.id}/edit`,
              icon: <PencilSquare />,
              disabled:
                !hasPermission("/admin/collections", "PUT") ||
                !hasPermission("/admin/collections", "POST"),
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              onClick: handleDeleteCollection,
              icon: <Trash />,
              disabled: !collection.id || !hasPermission("/admin/collections", "DELETE"),
            },
          ],
        },
      ]}
    />
  );
};
