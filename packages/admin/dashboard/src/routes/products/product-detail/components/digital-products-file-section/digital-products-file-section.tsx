import { useState } from "react";
import { FileText, Download, Trash2, Plus, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button, Container, Heading, Text } from "@medusajs/ui";

type Media = {
  id: string;
  mimeType: string;
  type: "main" | "preview";
  fileId: string;
  digital_product_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type DigitalProductFilesSectionProps = {
  mainFiles: Media[];
  previewFiles: Media[];
  productId: string;
  digitalProductId?: string;
  onFilesUpdated?: () => void;
};

const getFileTypeLabel = (mimeType: string) => {
  if (mimeType.includes("image/")) return "Image";
  if (mimeType.includes("video/")) return "Video";
  if (mimeType.includes("audio/")) return "Audio";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return "Archive";
  return "File";
};

const getFileName = (fileId: string) => {
  const cleanId = fileId.startsWith("private-") ? fileId.replace("private-", "") : fileId;
  const parts = cleanId.split("-");
  return parts.length > 1 ? parts.slice(1).join("-") : cleanId;
};

export const DigitalProductFilesSection = ({
  mainFiles = [],
  previewFiles = [],
  productId,
  digitalProductId,
  onFilesUpdated,
}: DigitalProductFilesSectionProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const handleDeleteFile = async (fileId: string, digitalProductId: string) => {
    try {
      setIsDeleting(prev => ({ ...prev, [fileId]: true }));

      const response = await fetch(
        `/admin/digital-products/${digitalProductId}/files/${fileId}/delete`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete file");
      }

      toast.success("File deleted successfully");
      onFilesUpdated?.();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file. Please try again.");
    } finally {
      setIsDeleting(prev => {
        const newState = { ...prev };
        delete newState[fileId];
        return newState;
      });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "main" | "preview"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("files", file);
    formData.append("type", type);

    try {
      const response = await fetch(`/admin/digital-products/${digitalProductId}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      toast.success("File uploaded successfully");
      onFilesUpdated?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
    }
  };

  const handleDownload = async (file: Media, isPreview: boolean) => {
    try {
      const endpoint = `/admin/digital-products/${productId}/files/${file.fileId}/download${
        isPreview ? "?preview=true" : ""
      }`;

      const response = await fetch(endpoint, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getFileName(file.fileId);
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const renderFileList = (files: Media[], isPreview = false) => {
    return (
      <div className="flex flex-col gap-y-2">
        {files.map(file => (
          <div
            key={file.id}
            className="bg-ui-bg-base shadow-borders-base hover:bg-ui-bg-base-hover flex items-center justify-between rounded-lg p-3 transition-colors"
          >
            <div className="flex items-center gap-x-3">
              <div className="bg-ui-bg-component flex h-8 w-8 items-center justify-center rounded-md">
                <FileText className="text-ui-fg-muted" size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-ui-fg-base text-sm font-medium">
                  {getFileName(file.fileId)}
                </span>
                <span className="text-ui-fg-subtle text-xs">
                  {getFileTypeLabel(file.mimeType)} • {file.mimeType}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              <button
                onClick={() => handleDownload(file, isPreview)}
                className="text-ui-fg-muted hover:text-ui-fg-subtle transition-colors"
                title="Download"
              >
                <Download size={16} />
              </button>
              {isEditing && (
                <button
                  onClick={() => handleDeleteFile(file.fileId, file.digital_product_id)}
                  className="text-ui-fg-muted hover:text-ui-fg-error transition-colors"
                  disabled={isDeleting[file.id]}
                  title="Delete file"
                >
                  {isDeleting[file.id] ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
        {isEditing && (
          <label className="flex cursor-pointer items-center gap-x-2 rounded-lg border-2 border-dashed border-ui-border-strong p-3 text-center hover:bg-ui-bg-subtle-hover">
            <Plus size={16} className="text-ui-fg-muted" />
            <Text className="text-ui-fg-subtle text-sm">
              Add {isPreview ? "preview" : "main"} file
            </Text>
            <input
              type="file"
              className="hidden"
              onChange={e => handleFileUpload(e, isPreview ? "preview" : "main")}
              onClick={e => ((e.target as HTMLInputElement).value = "")}
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Digital product files</Heading>
        <Button variant="secondary" size="small" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? (
            <>
              <Check size={16} className="mr-1" /> Done
            </>
          ) : mainFiles.length === 0 && previewFiles.length === 0 ? (
            "Add Files"
          ) : (
            "Edit Files"
          )}
        </Button>
      </div>

      {mainFiles.length === 0 && previewFiles.length === 0 ? (
        // 🪶 Show this only once
        <div className="flex flex-col items-center pb-8 pt-6">
          <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle">
            No files yet
          </Text>
          <Text size="small" className="text-ui-fg-muted text-center">
            Add preview files for your storefront and main files for customer delivery after
            purchase.
          </Text>
        </div>
      ) : (
        // ✅ Show file lists if available
        <div className="flex flex-col divide-y">
          {previewFiles.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-ui-fg-base text-sm font-medium mb-4">
                {t("digitalProducts.fields.previewFiles")}
              </h3>
              {renderFileList(previewFiles, true)}
            </div>
          )}

          {mainFiles.length > 0 && (
            <div className="px-6 py-4">
              <h3 className="text-ui-fg-base text-sm font-medium mb-4">
                {t("digitalProducts.fields.mainFiles")}
              </h3>
              {renderFileList(mainFiles, false)}
            </div>
          )}
        </div>
      )}
    </Container>
  );
};

export default DigitalProductFilesSection;
