import { AdminSalesChannel, ProductVariantDTO } from "@medusajs/types";

export enum MediaType {
  MAIN = "main",
  PREVIEW = "preview",
}

export type DigitalProductMedia = {
  id: string;
  type: MediaType;
  fileId: string;
  mimeType: string;
  digitalProducts?: DigitalProduct;
};

export type DigitalProduct = {
  collection: string;
  id: string;
  name: string;
  medias?: DigitalProductMedia[];
  product_variant?: ProductVariantDTO & {
    sales_channels?: AdminSalesChannel[];
  };
  created_at: string;
  updated_at: string;
};
