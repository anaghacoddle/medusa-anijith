import { ArrowDownTray } from "@medusajs/icons";
import { Text, clx } from "@medusajs/ui";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getFileSizeLimit, formatFileSize } from "../../../lib/env-config";

export interface FileType {
  id: string;
  url: string;
  file: File;
}

export interface FileUploadProps {
  label: string;
  multiple?: boolean;
  hint?: string;
  hasError?: boolean;
  formats: string[];
  onUploaded: (files: FileType[]) => void;
  onError?: (error: string) => void;
}

export const FileUpload = ({
  label,
  hint,
  multiple = true,
  hasError,
  formats,
  onUploaded,
  onError,
}: FileUploadProps) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLButtonElement>(null);

  const fileSizeLimit = getFileSizeLimit();

  const validateFiles = (files: FileList): { valid: FileType[]; errors: string[] } => {
    const valid: FileType[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      // Check file size
      if (file.size > fileSizeLimit) {
        errors.push(
          t("products.media.fileSizeExceeded", {
            name: file.name,
            limit: formatFileSize(fileSizeLimit),
          })
        );
        return;
      }

      // Check file format
      if (!formats.includes(file.type)) {
        errors.push(
          t("products.media.invalidFileType", {
            name: file.name,
            types: formats.join(", "),
          })
        );
        return;
      }

      const id = Math.random().toString(36).substring(7);
      const previewUrl = URL.createObjectURL(file);

      valid.push({
        id,
        url: previewUrl,
        file,
      });
    });

    return { valid, errors };
  };

  const handleOpenFileSelector = () => {
    inputRef.current?.click();
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (!files) {
      return;
    }

    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!dropZoneRef.current || dropZoneRef.current.contains(event.relatedTarget as Node)) {
      return;
    }

    setIsDragOver(false);
  };

  const handleUploaded = (files: FileList | null) => {
    if (!files) {
      return;
    }

    const { valid, errors } = validateFiles(files);

    // Report errors if any
    if (errors.length > 0) {
      onError?.(errors.join("\n"));
      return;
    }

    // Process valid files
    if (valid.length > 0) {
      onUploaded(valid);
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragOver(false);

    handleUploaded(event.dataTransfer?.files);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    handleUploaded(event.target.files);
    // Reset input value to allow selecting the same file again
    event.target.value = "";
  };

  return (
    <div>
      <button
        ref={dropZoneRef}
        type="button"
        onClick={handleOpenFileSelector}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={clx(
          "bg-ui-bg-component border-ui-border-strong transition-fg group flex w-full flex-col items-center gap-y-2 rounded-lg border border-dashed p-8",
          "hover:border-ui-border-interactive focus:border-ui-border-interactive",
          "focus:shadow-borders-focus outline-none focus:border-solid",
          {
            "!border-ui-border-error": hasError,
            "!border-ui-border-interactive": isDragOver,
          }
        )}
      >
        <div className="text-ui-fg-subtle group-disabled:text-ui-fg-disabled flex items-center gap-x-2">
          <ArrowDownTray />
          <Text>{label}</Text>
        </div>
        {!!hint && (
          <Text
            size="small"
            leading="compact"
            className="text-ui-fg-muted group-disabled:text-ui-fg-disabled"
          >
            {hint}
          </Text>
        )}
        <Text
          size="small"
          leading="compact"
          className="text-ui-fg-muted group-disabled:text-ui-fg-disabled"
        >
          {t("products.media.fileSizeLimit", { limit: formatFileSize(fileSizeLimit) })}
        </Text>
      </button>
      <input
        hidden
        ref={inputRef}
        onChange={handleFileChange}
        type="file"
        accept={formats.join(",")}
        multiple={multiple}
      />
    </div>
  );
};
