import { z } from "zod";
import { i18n } from "../../../components/utilities/i18n/i18n";
import { optionalFloat, optionalInt } from "../../../lib/validation";
import { decorateVariantsWithDefaultValues } from "./utils";

export const MediaSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  isThumbnail: z.boolean(),
  file: z.any().nullable(), // File
  embedCode: z.string().optional(), // For embedded videos
  mediaType: z.enum(["file", "embed"]).default("file"), // To distinguish between file uploads and embeds
  thumbnailUrl: z.string().optional(), // For embed video thumbnails
  videoTitle: z.string().optional(), // For embed video titles
});

const ProductCreateVariantSchema = z.object({
  should_create: z.boolean(),
  is_default: z.boolean().optional(),
  title: z.string(),
  upc: z.string().optional(),
  ean: z.string().optional(),
  barcode: z.string().optional(),
  mid_code: z.string().optional(),
  hs_code: z.string().optional(),
  width: optionalInt,
  height: optionalInt,
  length: optionalInt,
  weight: optionalInt,
  material: z.string().optional(),
  origin_country: z.string().optional(),
  sku: z.string().optional(),
  manage_inventory: z.boolean().optional(),
  allow_backorder: z.boolean().optional(),
  inventory_kit: z.boolean().optional(),
  options: z.record(z.string(), z.string()),
  variant_rank: z.number(),
  prices: z.record(z.string(), optionalFloat).optional(),
  inventory: z
    .array(
      z.object({
        inventory_item_id: z.string(),
        required_quantity: optionalInt,
      })
    )
    .optional(),
});

export type ProductCreateVariantSchema = z.infer<typeof ProductCreateVariantSchema>;

const ProductCreateOptionSchema = z.object({
  title: z.string(),
  values: z.array(z.string()).min(1),
});

export type ProductCreateOptionSchema = z.infer<typeof ProductCreateOptionSchema>;

export enum MediaType {
  MAIN = "main",
  PREVIEW = "preview",
}

// Schema for the form input (before upload)
const DigitalProductMediaInputSchema = z.object({
  id: z.string(),
  type: z.enum(["preview", "main"]),
  file: z.any().optional(), // ✅ allows placeholder
  mimeType: z.string().optional(),
});

// Schema for the API payload (after upload)
export const DigitalProductMediaSchema = z.object({
  type: z.nativeEnum(MediaType),
  file_id: z.string(),
  mime_type: z.string(),
});

export const DigitalProductCreateSchema = z.object({
  title: z.string().min(1, "Name is required"),
  // Accept raw media input with files
  medias: z
    .array(DigitalProductMediaInputSchema)
    .refine(
      medias =>
        medias.some(m => m.type === "main" && m.file) &&
        medias.some(m => m.type === "preview" && m.file) &&
        medias.every(m => m.file),
      { message: "Preview and main files are required" }
    ),
  product: z
    .object({
      title: z
        .union([
          z.string().min(1, "Title is required").max(50, "Title must be 50 characters or less"),
          z.literal(""),
        ])
        .optional(),
      subtitle: z.string().max(50, "Subtitle must be 50 characters or less").optional(),
      handle: z.string().max(50, "Handle must be 50 characters or less").optional(),
      brand: z.string().min(1, "Brand is required").max(50, "Brand must be 50 characters or less"),
      description: z.string().max(160, "Description must be 160 characters or less").optional(),
      discountable: z.boolean(),
      type_id: z.string().optional(),
      collection_id: z.string().optional(),
      shipping_profile_id: z.string().optional(),
      categories: z.array(z.string()),
      tags: z.array(z.string()).optional(),
      sales_channels: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
          })
        )
        .optional(),
      origin_country: z.string().optional(),
      material: z.string().optional(),
      width: z.string().optional(),
      length: z.string().optional(),
      height: z.string().optional(),
      weight: z.string().optional(),
      mid_code: z.string().optional(),
      hs_code: z.string().optional(),
      options: z.array(ProductCreateOptionSchema).min(1),
      enable_variants: z.boolean(),
      variants: z.array(ProductCreateVariantSchema).min(1),
      media: z.array(MediaSchema).optional(),
    })
    .superRefine((data, ctx) => {
      // Ensure at least one variant should be created
      if (data.variants.every(v => !v.should_create)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message: "invalid_length",
        });
      }

      // Ensure SKUs are unique
      const skus = new Set<string>();
      data.variants.forEach((v, index) => {
        if (v.sku) {
          if (skus.has(v.sku)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [`variants.${index}.sku`],
              message: i18n.t("products.create.errors.uniqueSku"),
            });
          }
          skus.add(v.sku);
        }
      });
    }),
});

export const EditProductMediaSchema = z.object({
  media: z.array(MediaSchema),
});

export const PRODUCT_CREATE_FORM_DEFAULTS: Partial<z.infer<typeof DigitalProductCreateSchema>> = {
  title: "",
  medias: [],
  product: {
    discountable: true,
    tags: [],
    sales_channels: [],
    options: [
      {
        title: "Default option",
        values: ["Default option value"],
      },
    ],
    variants: decorateVariantsWithDefaultValues([
      {
        title: "Default variant",
        should_create: true,
        variant_rank: 0,
        options: {
          "Default option": "Default option value",
        },
        inventory: [{ inventory_item_id: "", required_quantity: "" }],
        is_default: true,
      },
    ]),
    enable_variants: false,
    media: [],
    categories: [],
    collection_id: "",
    shipping_profile_id: "",
    description: "",
    handle: "",
    brand: "",
    height: "",
    hs_code: "",
    length: "",
    material: "",
    mid_code: "",
    origin_country: "",
    subtitle: "",
    title: "",
    type_id: "",
    weight: "",
    width: "",
  },
};
