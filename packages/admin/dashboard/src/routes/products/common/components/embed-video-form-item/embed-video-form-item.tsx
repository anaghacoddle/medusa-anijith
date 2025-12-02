import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Button, Text, clx } from "@medusajs/ui";
import { Form } from "../../../../../components/common/form";
import { MediaSchema } from "../../../product-create/constants";
import { EditProductMediaSchemaType, ProductCreateSchemaType } from "../../../product-create/types";
import { getEmbedVideoThumbnail, getEmbedVideoTitle } from "../../../../../lib/embed-video-utils";

type Media = z.infer<typeof MediaSchema>;

export const EmbedVideoFormItem = ({
  form,
  append,
  showHint = true,
}: {
  form: UseFormReturn<ProductCreateSchemaType> | UseFormReturn<EditProductMediaSchemaType>;
  append: (value: Media) => void;
  showHint?: boolean;
}) => {
  const { t } = useTranslation();
  const [embedCode, setEmbedCode] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleEmbedVideo = () => {
    if (!embedCode.trim()) {
      return;
    }

    // Generate a unique ID for the embed
    const id = Math.random().toString(36).substring(7);

    // Extract thumbnail URL and title from embed code
    const thumbnailUrl = getEmbedVideoThumbnail(embedCode.trim());
    const videoTitle = getEmbedVideoTitle(embedCode.trim());

    const embedMedia: Media = {
      id,
      url: thumbnailUrl || `embed://${id}`, // Use thumbnail URL if available, fallback to placeholder
      isThumbnail: false,
      file: null,
      embedCode: embedCode.trim(),
      mediaType: "embed",
      thumbnailUrl, // Add thumbnail URL if available
      videoTitle, // Add video title
    };

    append(embedMedia);
    setEmbedCode("");
    setIsExpanded(false);
  };

  const isValidEmbedCode = (code: string) => {
    return code.trim().length > 0;
  };

  return (
    <Form.Field
      control={form.control as UseFormReturn<EditProductMediaSchemaType>["control"]}
      name="media"
      render={() => {
        return (
          <Form.Item>
            <div className="flex flex-col gap-y-2">
              <div className="flex flex-col gap-y-1">
                <Form.Label optional>
                  {t("products.media.embedVideoLabel", "Embed Video")}
                </Form.Label>
                {showHint && (
                  <Form.Hint>
                    {t(
                      "products.media.embedVideoHint",
                      "Paste embed code from YouTube, Vimeo, or other video platforms"
                    )}
                  </Form.Hint>
                )}
              </div>
              <Form.Control>
                <div className="flex flex-col gap-y-2">
                  {!isExpanded ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      onClick={() => setIsExpanded(true)}
                      className="w-fit"
                    >
                      {t("products.media.addEmbedVideo", "Add Embed Video")}
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-y-3 p-4 border border-ui-border-base rounded-lg bg-ui-bg-component">
                      <div className="flex items-center justify-between">
                        <Text size="small" weight="plus">
                          {t("products.media.embedVideoTitle", "Embed Video")}
                        </Text>
                        <Button
                          type="button"
                          variant="transparent"
                          size="small"
                          onClick={() => {
                            setIsExpanded(false);
                            setEmbedCode("");
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                      <textarea
                        value={embedCode}
                        onChange={e => setEmbedCode(e.target.value)}
                        placeholder={t(
                          "products.media.embedCodePlaceholder",
                          "Paste your embed code here..."
                        )}
                        className={clx(
                          "min-h-[100px] w-full resize-none rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-ui-fg-base",
                          "placeholder:text-ui-fg-muted",
                          "focus:border-ui-border-interactive focus:outline-none focus:ring-1 focus:ring-ui-border-interactive",
                          "disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled"
                        )}
                      />
                      <div className="flex items-center gap-x-2">
                        <Button
                          type="button"
                          size="small"
                          onClick={handleEmbedVideo}
                          disabled={!embedCode.trim() || !isValidEmbedCode(embedCode)}
                        >
                          {t("products.media.addEmbed", "Add Embed")}
                        </Button>
                        <Text size="small" className="text-ui-fg-muted">
                          {t(
                            "products.media.embedSupported",
                            "Supports YouTube, Vimeo, and other video platforms"
                          )}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
              </Form.Control>
            </div>
          </Form.Item>
        );
      }}
    />
  );
};
