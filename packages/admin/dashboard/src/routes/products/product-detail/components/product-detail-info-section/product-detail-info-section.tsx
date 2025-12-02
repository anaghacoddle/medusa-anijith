import { PencilSquare } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { Container, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useExtension } from "../../../../../providers/extension-provider";
import { usePermission } from "../../../../../hooks/use-permission";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { SectionRow } from "../../../../../components/common/section";

import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

type ProductDetailInfoSectionProps = {
  product: HttpTypes.AdminProduct;
};

type ProductDescription = {
  warning?: string;
  ingredients?: string;
  sustainability?: string;
  allergens?: string;
};

export const ProductDetailInfoSection = ({ product }: ProductDetailInfoSectionProps) => {
  const { t } = useTranslation();
  const { getDisplays } = useExtension();
  const { hasPermission } = usePermission();
  const displays = getDisplays("product", "general");

  const [additionalInfo, setAdditionalInfo] = useState<ProductDescription | null>(null);
  const [loading, setLoading] = useState(true);

  // 🧠 Extract product_id from the URL (e.g., /app/products/:id)
  const location = useLocation();
  const productIdFromUrl = location.pathname.split("/").pop(); // gets last segment
  //   const segments = location.pathname.split("/");
  // const productIdFromUrl = segments[segments.length - 2]; // ✅ This gives the product ID

  useEffect(() => {
    const fetchProductDescription = async () => {
      try {
        const response = await axios.get(
          `/admin/product_description?product_id=${productIdFromUrl}`,
          {
            withCredentials: true, // ✅ Include cookies for admin session
          }
        );

        setAdditionalInfo(response.data.product_descriptions?.[0] ?? null);
        console.log(
          "✔---------------->>>>>>Additional Info:",
          response.data.product_descriptions?.[0]
        );
      } catch (error) {
        console.error("Failed to fetch product description", error);
        setAdditionalInfo(null);
      } finally {
        setLoading(false);
      }
    };

    if (productIdFromUrl) {
      fetchProductDescription();
    }
  }, [productIdFromUrl]);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("Additional Information", "Additional Information")}</Heading>
        <div className="flex items-center gap-x-4">
          <ActionMenu
            groups={[
              {
                actions:
                  additionalInfo &&
                  (additionalInfo.warning ||
                    additionalInfo.ingredients ||
                    additionalInfo.sustainability ||
                    additionalInfo.allergens)
                    ? [
                        {
                          label: t("actions.edit"),
                          to: "additional-info-edit",
                          icon: <PencilSquare />,
                          disabled: !product.id || !hasPermission("/admin/products", "PUT"),
                        },
                      ]
                    : [
                        {
                          label: t("actions.create"),
                          to: "additional-info-create",
                          icon: <PencilSquare />,
                          disabled: !product.id || !hasPermission("/admin/products", "POST"),
                        },
                      ],
              },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <SectionRow title="Loading..." />
      ) : (
        <>
          <SectionRow
            title={t("products.fields.warnings.label")}
            value={additionalInfo?.warning || "-"}
          />
          <SectionRow
            title={t("products.fields.Ingredients.label")}
            value={additionalInfo?.ingredients || "-"}
          />
          <SectionRow
            title={t("products.fields.Sustainability.label")}
            value={additionalInfo?.sustainability || "-"}
          />
          <SectionRow
            title={t("products.fields.Allergens.label")}
            value={additionalInfo?.allergens || "-"}
          />
        </>
      )}

      {displays.map((Component, index) => (
        <Component key={index} data={product} />
      ))}
    </Container>
  );
};
