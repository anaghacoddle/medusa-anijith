import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { FileType, FileUpload } from "../../../../../components/common/file-upload";
import { Form } from "../../../../../components/common/form";
import { MediaSchema } from "../../../product-create/constants";
import { EditProductMediaSchemaType, ProductCreateSchemaType } from "../../../product-create/types";
import { EmbedVideoFormItem } from "../embed-video-form-item";

type Media = z.infer<typeof MediaSchema>;

const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/svg+xml",
  // Video formats
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/x-flv",
  "video/3gpp",
  "video/x-m4v",
];

const SUPPORTED_FORMATS_FILE_EXTENSIONS = [
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".svg",
  // Video extensions
  ".mp4",
  ".webm",
  ".ogg",
  ".mov",
  ".avi",
  ".wmv",
  ".m4v",
  ".3gp",
  ".flv",
];

export const UploadMediaFormItem = ({
  form,
  append,
  showHint = true,
  productType = "product",
}: {
  form: UseFormReturn<ProductCreateSchemaType> | UseFormReturn<EditProductMediaSchemaType>;
  append: (value: Media) => void;
  showHint?: boolean;
  productType?: "product" | "digital";
}) => {
  const { t } = useTranslation();

  const onUploaded = useCallback(
    (files: FileType[]) => {
      form.clearErrors("media");
      files.forEach(f => append({ ...f, isThumbnail: false, mediaType: "file" }));
    },
    [form, append]
  );

  const onError = useCallback(
    (error: string) => {
      form.setError("media", {
        type: "invalid_file",
        message: error,
      });
    },
    [form]
  );

  return (
    <Form.Field
      control={form.control as UseFormReturn<EditProductMediaSchemaType>["control"]}
      name="media"
      render={() => {
        return (
          <Form.Item>
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-1">
                <Form.Label optional>
                  {productType === "digital"
                    ? t("digitalProducts.media.label")
                    : t("products.media.label")}{" "}
                </Form.Label>
                {showHint && (
                  <Form.Hint>
                    {" "}
                    {productType === "digital"
                      ? t("digitalProducts.media.editHint")
                      : t("products.media.editHint")}
                  </Form.Hint>
                )}
              </div>
              <Form.Control>
                <div className="flex flex-col gap-y-3">
                  <FileUpload
                    label={t("products.media.uploadImagesLabel")}
                    hint={t("products.media.uploadImagesHint")}
                    hasError={!!form.formState.errors.media}
                    formats={SUPPORTED_FORMATS}
                    onUploaded={onUploaded}
                    onError={onError}
                  />
                  <div className="flex items-center gap-x-2">
                    <div className="flex-1 h-px bg-ui-border-base" />
                    <span className="text-ui-fg-muted text-xs px-2">
                      {t("products.media.or", "or")}
                    </span>
                    <div className="flex-1 h-px bg-ui-border-base" />
                  </div>
                  <EmbedVideoFormItem form={form} append={append} showHint={false} />
                </div>
              </Form.Control>
              <Form.ErrorMessage />
            </div>
          </Form.Item>
        );
      }}
    />
  );
};
