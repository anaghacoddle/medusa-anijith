import { PencilSquare, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { useDeleteProductTagAction } from "../../../common/hooks/use-delete-product-tag-action";
import { usePermission } from "../../../../../hooks/use-permission";

type ProductTagGeneralSectionProps = {
  productTag: HttpTypes.AdminProductTag;
};

export const ProductTagGeneralSection = ({ productTag }: ProductTagGeneralSectionProps) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const handleDelete = useDeleteProductTagAction({ productTag });

  return (
    <Container className="flex items-center justify-between">
      <div className="flex items-center gap-x-1.5">
        <span className="text-ui-fg-muted h1-core">#</span>
        <Heading>{productTag.value}</Heading>
      </div>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                icon: <PencilSquare />,
                label: t("actions.edit"),
                to: "edit",
                disabled:
                  !hasPermission("/admin/product-tags", "PUT") ||
                  !hasPermission("/admin/product-tags", "POST"),
              },
            ],
          },
          {
            actions: [
              {
                icon: <Trash />,
                label: t("actions.delete"),
                onClick: handleDelete,
                disabled: !hasPermission("/admin/product-tags", "DELETE"),
              },
            ],
          },
        ]}
      />
    </Container>
  );
};
