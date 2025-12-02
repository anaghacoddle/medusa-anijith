import { PencilSquare } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { SectionRow } from "../../../../../components/common/section";
import { usePermission } from "../../../../../hooks/use-permission";

type ProductBrandSectionProps = {
  product: HttpTypes.AdminProduct & {
    brand?: {
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
  };
};

export const ProductBrandSection = ({ product }: ProductBrandSectionProps) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.brand.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "brand",
                  icon: <PencilSquare />,
                  disabled: !hasPermission("/admin/products", "PUT"),
                },
              ],
            },
          ]}
        />
      </div>

      <SectionRow title={t("products.fields.brand.label")} value={product?.brand?.name} />
    </Container>
  );
};
