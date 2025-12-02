import { getLinkedFields } from "../../../dashboard-app";

export const PRODUCT_DETAIL_FIELDS = getLinkedFields(
  "product",
  "*categories,*shipping_profile,-variants,*brand,+variants.digital_product.*,+variants.digital_product.medias.*,+variants.digital_product.brand.*"
);
