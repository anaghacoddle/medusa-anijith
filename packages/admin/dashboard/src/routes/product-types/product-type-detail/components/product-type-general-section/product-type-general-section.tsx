import { PencilSquare, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { useDeleteProductTypeAction } from "../../../common/hooks/use-delete-product-type-action";
import { usePermission } from "../../../../../hooks/use-permission";

type ProductTypeGeneralSectionProps = {
  productType: HttpTypes.AdminProductType;
};

export const ProductTypeGeneralSection = ({ productType }: ProductTypeGeneralSectionProps) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  const handleDelete = useDeleteProductTypeAction(productType.id, productType.value);

  return (
    <Container className="flex items-center justify-between">
      <Heading>{productType.value}</Heading>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                label: t("actions.edit"),
                icon: <PencilSquare />,
                to: "edit",
                disabled:
                  !hasPermission("/admin/product-types", "PUT") ||
                  !hasPermission("/admin/product-types", "POST"),
              },
            ],
          },
          {
            actions: [
              {
                label: t("actions.delete"),
                icon: <Trash />,
                onClick: handleDelete,
                disabled: !hasPermission("/admin/product-types", "DELETE"),
              },
            ],
          },
        ]}
      />
    </Container>
  );
};
