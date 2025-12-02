import { useLoaderData, useParams } from "react-router-dom";

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton";
import { TwoColumnPage } from "../../../components/layout/pages";
import { useProduct } from "../../../hooks/api/products";
import { ProductAttributeSection } from "./components/product-attribute-section";
import { ProductBrandSection } from "./components/product-brand-section";
import { ProductGeneralSection } from "./components/product-general-section";
import { ProductMediaSection } from "./components/product-media-section";
import { ProductOptionSection } from "./components/product-option-section";
import { ProductOrganizationSection } from "./components/product-organization-section";
import { ProductSalesChannelSection } from "./components/product-sales-channel-section";
import { ProductVariantSection } from "./components/product-variant-section";
import { PRODUCT_DETAIL_FIELDS } from "./constants";
import { productLoader } from "./loader";
import { ProductDetailInfoSection } from "./components/product-detail-info-section";
import { DigitalProductFilesSection } from "./components/digital-products-file-section";

import { useExtension } from "../../../providers/extension-provider";
import { ProductShippingProfileSection } from "./components/product-shipping-profile-section";

export const ProductDetail = () => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof productLoader>>;

  const { id } = useParams();
  const { product, isLoading, isError, error } = useProduct(
    id!,
    { fields: PRODUCT_DETAIL_FIELDS },
    {
      initialData: initialData,
    }
  );

  // Get digital product from the first variant (or iterate through all variants)
  const digitalProduct = product?.variants?.[0]?.digital_product;
  const medias = digitalProduct?.medias || [];

  // Separate main and preview files
  const mainFiles = medias.filter(media => media.type === "main");
  const previewFiles = medias.filter(media => media.type === "preview");

  const { getWidgets } = useExtension();

  const after = getWidgets("product.details.after");
  const before = getWidgets("product.details.before");
  const sideAfter = getWidgets("product.details.side.after");
  const sideBefore = getWidgets("product.details.side.before");

  if (isLoading || !product) {
    return <TwoColumnPageSkeleton mainSections={4} sidebarSections={3} showJSON showMetadata />;
  }

  if (isError) {
    throw error;
  }

  return (
    <TwoColumnPage
      widgets={{
        after,
        before,
        sideAfter,
        sideBefore,
      }}
      showJSON
      showMetadata
      data={product}
    >
      <TwoColumnPage.Main>
        <ProductGeneralSection product={product} />
        <DigitalProductFilesSection
          mainFiles={mainFiles}
          previewFiles={previewFiles}
          productId={product.id}
          digitalProductId={digitalProduct?.id}
        />

        <ProductMediaSection product={product} />
        <ProductOptionSection product={product} />
        <ProductVariantSection product={product} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <ProductBrandSection product={product} />
        <ProductSalesChannelSection product={product} />
        <ProductShippingProfileSection product={product} />
        <ProductOrganizationSection product={product} />
        <ProductAttributeSection product={product} />
        <ProductDetailInfoSection product={product} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};
