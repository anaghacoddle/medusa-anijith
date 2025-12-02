import { PencilSquare, Plus, Trash } from "@medusajs/icons";
import { Badge, Container, Heading, toast, usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { SectionRow } from "../../../../../components/common/section";
import { useDeleteProductOption } from "../../../../../hooks/api/products";
import { HttpTypes } from "@medusajs/types";
import { usePermission } from "../../../../../hooks/use-permission";

const OptionActions = ({
  product,
  option,
}: {
  product: HttpTypes.AdminProduct;
  option: HttpTypes.AdminProductOption;
}) => {
  const { t } = useTranslation();
  const { mutateAsync } = useDeleteProductOption(product.id, option.id);
  const prompt = usePrompt();

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.options.deleteWarning", {
        title: option.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    try {
      await mutateAsync();
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error("Failed to delete. Please try again.");
      console.error(error);
    }
  };

  const { hasPermission } = usePermission();
  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: `options/${option.id}/edit`,
              icon: <PencilSquare />,
              disabled:
                !product.id ||
                !hasPermission("/admin/products", "PUT") ||
                !hasPermission("/admin/products", "POST"),
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              onClick: handleDelete,
              icon: <Trash />,
              disabled: !product.id || !hasPermission("/admin/products", "DELETE"),
            },
          ],
        },
      ]}
    />
  );
};

type ProductOptionSectionProps = {
  product: HttpTypes.AdminProduct;
};

export const ProductOptionSection = ({ product }: ProductOptionSectionProps) => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.options.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.create"),
                  to: "options/create",
                  icon: <Plus />,
                  disabled: !product.id || !hasPermission("/admin/products", "POST"),
                },
              ],
            },
          ]}
        />
      </div>

      {product.options?.map(option => {
        return (
          <SectionRow
            title={option.title}
            key={option.id}
            value={option.values?.map(val => {
              return (
                <Badge
                  key={val.value}
                  size="2xsmall"
                  className="flex min-w-[20px] items-center justify-center"
                >
                  {val.value}
                </Badge>
              );
            })}
            actions={<OptionActions product={product} option={option} />}
          />
        );
      })}
    </Container>
  );
};
