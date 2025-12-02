import { useState, useEffect, useRef } from "react";
import { FileText, Plus, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button, Text, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

type MediaType = "preview" | "main";

type CreateMedia = {
  id: string;
  type: MediaType;
  file?: File;
  mimeType?: string;
};

type ProductCreateFileSectionProps = {
  form: any; // Form from react-hook-form
};

const getFileTypeLabel = (mimeType?: string) => {
  if (!mimeType) return "File";
  if (mimeType.includes("image/")) return "Image";
  if (mimeType.includes("video/")) return "Video";
  if (mimeType.includes("audio/")) return "Audio";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "Archive";
  return "File";
};

export const ProductCreateFileSection = ({ form }: ProductCreateFileSectionProps) => {
  const { t } = useTranslation();

  const [medias, setMedias] = useState<CreateMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Get form errors
  const mediasError = form.formState.errors.medias;

  // Generate a unique ID for each media item
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // // Sync medias state with form
  // useEffect(() => {
  //   form.setValue("medias", medias);
  // }, [medias, form]);

  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender) {
      // First render: just set the value without validation
      form.setValue("medias", medias);
      isInitialRender.current = false;
    } else {
      // Subsequent updates: validate
      form.setValue("medias", medias, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [medias, form, isInitialRender]);

  const onAddMedia = () => {
    setMedias(prev => [
      ...prev,
      {
        id: generateId(),
        type: "preview",
      },
    ]);
  };

  const handleFileChange = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setMedias(prev => [
        ...prev.slice(0, index),
        {
          ...prev[index],
          file,
          mimeType: file.type,
        },
        ...prev.slice(index + 1),
      ]);
      // ✅ Only trigger validation after file is uploaded
      // Use setTimeout to ensure state is updated first
      setTimeout(() => {
        form.trigger("medias");
      }, 0);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = (index: number) => {
    setMedias(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
  };

  const changeMediaType = (index: number, type: MediaType) => {
    setMedias(prev => [
      ...prev.slice(0, index),
      {
        ...prev[index],
        type,
      },
      ...prev.slice(index + 1),
    ]);
  };

  const renderFileInput = (media: CreateMedia, index: number) => {
    const inputId = `file-upload-${media.id}`;

    return (
      <div key={media.id} className="bg-ui-bg-base shadow-borders-base rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <Text className="text-ui-fg-base font-medium">
            {t("digitalProducts.files.addMedia")} {index + 1}
          </Text>
          <Button
            variant="transparent"
            size="small"
            type="button"
            onClick={() => removeMedia(index)}
            className="hover:text-ui-fg-error"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-y-2">
            <Text className="text-ui-fg-subtle text-sm">{t("digitalProducts.files.type")}</Text>
            <select
              value={media.type}
              onChange={e => changeMediaType(index, e.target.value as MediaType)}
              className="bg-ui-bg-field hover:bg-ui-bg-field-hover shadow-buttons-neutral transition-fg flex h-8 w-full items-center justify-between rounded-md px-2 py-0.5 text-left text-sm outline-none"
            >
              <option value="preview">{t("digitalProducts.files.fileTypes.preview")}</option>
              <option value="main"> {t("digitalProducts.files.fileTypes.main")}</option>
            </select>
          </div>

          <div className="flex flex-col gap-y-2">
            <Text className="text-ui-fg-subtle text-sm"> {t("digitalProducts.files.file")}</Text>
            {!media.file ? (
              <label
                htmlFor={inputId}
                className="bg-ui-bg-field hover:bg-ui-bg-field-hover shadow-buttons-neutral flex h-8 w-full cursor-pointer items-center justify-between rounded-md px-2 py-0.5 text-sm transition-colors"
              >
                <span className="text-ui-fg-subtle">{t("digitalProducts.files.selectFile")}</span>
                <Upload size={16} className="text-ui-fg-muted" />
                <input
                  id={inputId}
                  type="file"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      handleFileChange(index, e.target.files[0]);
                    }
                  }}
                />
              </label>
            ) : (
              <div className="bg-ui-bg-field flex items-center justify-between rounded-md p-2">
                <div className="flex items-center gap-x-3">
                  <div className="bg-ui-bg-component flex h-8 w-8 items-center justify-center rounded-md">
                    <FileText className="text-ui-fg-muted" size={16} />
                  </div>
                  <div className="flex flex-col">
                    <Text className="text-ui-fg-base text-sm font-medium">{media.file.name}</Text>
                    <Text className="text-ui-fg-subtle text-xs">
                      {getFileTypeLabel(media.mimeType)}
                      {media.mimeType ? ` • ${media.mimeType}` : ""}
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <Heading level="h2" className="text-ui-fg-base">
          {t("digitalProducts.files.label")}*
        </Heading>
        <Button
          variant="secondary"
          size="small"
          type="button"
          onClick={onAddMedia}
          disabled={isUploading}
        >
          <Plus size={16} className="mr-1" />
          {t("digitalProducts.files.addMedia")}
        </Button>
      </div>

      {/* Error message display */}
      {mediasError?.message && (
        <div className="bg-ui-bg-error-subtle border-ui-border-error rounded-md border px-3 py-2">
          <Text size="small" className="text-ui-fg-error">
            {mediasError.message}
          </Text>
        </div>
      )}

      {medias.length === 0 ? (
        <div className="bg-ui-bg-component border-ui-border-strong flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
          <Upload size={24} className="text-ui-fg-muted mb-2" />
          <Text className="text-ui-fg-subtle mb-1">
            {t("digitalProducts.files.emptyState.header")}
          </Text>
          <Text className="text-ui-fg-muted text-sm">
            {t("digitalProducts.files.emptyState.description")}
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-y-4">
          {medias.map((media, index) => renderFileInput(media, index))}
        </div>
      )}
    </div>
  );
};

export default ProductCreateFileSection;
