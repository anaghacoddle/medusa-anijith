import { PencilSquare, ThumbnailBadge } from "@medusajs/icons";
import {
  Button,
  Checkbox,
  CommandBar,
  Container,
  Heading,
  Text,
  Tooltip,
  clx,
  toast,
  usePrompt,
} from "@medusajs/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { useUpdateProduct } from "../../../../../hooks/api/products";
import { HttpTypes } from "@medusajs/types";
import { usePermission } from "../../../../../hooks/use-permission";

type ProductMedisaSectionProps = {
  product: HttpTypes.AdminProduct;
};

// Helper function to detect if a file is a video based on URL or file extension
const isVideoFile = (url: string): boolean => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".wmv", ".m4v", ".3gp", ".flv"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes("video/");
};

export const ProductMediaSection = ({ product }: ProductMedisaSectionProps) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const navigate = useNavigate();

  const [selection, setSelection] = useState<Record<string, boolean>>({});

  const media = getMedia(product);

  const handleCheckedChange = (id: string) => {
    setSelection(prev => {
      if (prev[id]) {
        const { [id]: _, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [id]: true };
      }
    });
  };

  const { mutateAsync } = useUpdateProduct(product.id);
  const { hasPermission } = usePermission();
  const handleDelete = async () => {
    if (!hasPermission("/admin/products", "DELETE")) return;
    const ids = Object.keys(selection);
    const includingThumbnail = ids.some(id => media.find(m => m.id === id)?.isThumbnail);

    const res = await prompt({
      title: t("general.areYouSure"),
      description: includingThumbnail
        ? t("products.media.deleteWarningWithThumbnail", {
            count: ids.length,
          })
        : t("products.media.deleteWarning", {
            count: ids.length,
          }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    // Separate file-based images from embed videos
    const selectedMedia = media.filter(m => ids.includes(m.id));
    const selectedEmbedVideos = selectedMedia.filter(m => m.mediaType === "embed");
    const selectedFileImages = selectedMedia.filter(m => m.mediaType === "file" || !m.mediaType);

    // Keep file-based images that are not selected for deletion
    const mediaToKeep = product?.images
      ?.filter(i => !selectedFileImages.some(m => m.id === i.id))
      .map(i => ({ id: i.id, url: i.url }));

    // Handle embed video deletion by updating metadata
    const existingMetadata = product.metadata || {};
    const nonEmbedMetadata = Object.entries(existingMetadata).reduce(
      (acc, [key, value]) => {
        if (!key.startsWith("embed_video_")) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    // Get current embed videos from metadata
    const currentEmbedVideos = (existingMetadata.embed_video as any[]) || [];

    // Remove selected embed videos from the array
    const updatedEmbedVideos = currentEmbedVideos.filter(
      (embedVideo: any) => !selectedEmbedVideos.some(selected => selected.id === embedVideo.id)
    );

    // Create final metadata with updated embed_video array
    const finalMetadata = {
      ...nonEmbedMetadata,
      embed_video: updatedEmbedVideos,
    };

    await mutateAsync(
      {
        images: mediaToKeep,
        thumbnail: includingThumbnail ? "" : undefined,
        metadata: finalMetadata, // Always send metadata to ensure embed_video array is updated
      },
      {
        onSuccess: () => {
          setSelection({});
          toast.success("Deleted successfully");
        },
      }
    );
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.media.label")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.editImages"),
                  to: "media?view=edit",
                  icon: <PencilSquare />,
                  disabled:
                    !product.id ||
                    !hasPermission("/admin/products", "PUT") ||
                    !hasPermission("/admin/products", "POST"),
                },
              ],
            },
          ]}
        />
      </div>
      {media.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-4 px-6 py-4">
          {media.map((i, index) => {
            const isSelected = selection[i.id];
            const isVideo = isVideoFile(i.url);

            return (
              <div
                className="shadow-elevation-card-rest hover:shadow-elevation-card-hover transition-fg group relative aspect-square size-full cursor-pointer overflow-hidden rounded-[8px]"
                key={i.id}
              >
                <div
                  className={clx(
                    "transition-fg invisible absolute right-2 top-2 opacity-0 group-hover:visible group-hover:opacity-100",
                    {
                      "visible opacity-100": isSelected,
                    }
                  )}
                >
                  <Checkbox
                    checked={selection[i.id] || false}
                    onCheckedChange={() => handleCheckedChange(i.id)}
                  />
                </div>
                {i.isThumbnail && (
                  <div className="absolute left-2 top-2">
                    <Tooltip content={t("fields.thumbnail")}>
                      <ThumbnailBadge />
                    </Tooltip>
                  </div>
                )}
                <Link to={`media`} state={{ curr: index }}>
                  {i.mediaType === "embed" && i.embedCode ? (
                    i.thumbnailUrl ? (
                      <img
                        src={i.thumbnailUrl}
                        alt={`${product.title} embed video thumbnail`}
                        className="size-full object-cover"
                        onError={e => {
                          // Fallback to embed icon if thumbnail fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback = target.parentElement?.querySelector(".embed-fallback");
                          if (fallback) {
                            (fallback as HTMLElement).style.display = "flex";
                          }
                        }}
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center bg-ui-bg-subtle">
                        <div className="text-ui-fg-muted text-xs text-center px-1">
                          <div className="mb-0.5">📺</div>
                          <div className="text-[6px]">{i.videoTitle || "Embed"}</div>
                        </div>
                      </div>
                    )
                  ) : isVideo ? (
                    <video
                      src={i.url}
                      className="size-full object-cover pointer-events-none"
                      muted
                      preload="metadata"
                      onContextMenu={e => e.preventDefault()}
                    />
                  ) : (
                    <img
                      src={i.url}
                      alt={`${product.title} image`}
                      className="size-full object-cover"
                    />
                  )}
                  {/* Fallback for embed videos when thumbnail fails */}
                  {i.mediaType === "embed" && i.embedCode && i.thumbnailUrl && (
                    <div
                      className="embed-fallback size-full flex items-center justify-center bg-ui-bg-subtle absolute inset-0"
                      style={{ display: "none" }}
                    >
                      <div className="text-ui-fg-muted text-xs text-center px-1">
                        <div className="mb-0.5">📺</div>
                        <div className="text-[6px]">{i.videoTitle || "Embed"}</div>
                      </div>
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-y-4 pb-8 pt-6">
          <div className="flex flex-col items-center">
            <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle">
              {t("products.media.emptyState.header")}
            </Text>
            <Text size="small" className="text-ui-fg-muted">
              {t("products.media.emptyState.description")}
            </Text>
          </div>
          {hasPermission("/admin/products", "PUT") ||
            (!hasPermission("/admin/products", "POST") && (
              <Button size="small" variant="secondary" asChild>
                <Link to="media?view=edit">{t("products.media.emptyState.action")}</Link>
              </Button>
            ))}
        </div>
      )}
      <CommandBar open={!!Object.keys(selection).length}>
        <CommandBar.Bar>
          <CommandBar.Value>
            {t("general.countSelected", {
              count: Object.keys(selection).length,
            })}
          </CommandBar.Value>
          <CommandBar.Seperator />
          <CommandBar.Command
            action={handleDelete}
            label={t("actions.delete")}
            shortcut="d"
            style={
              !hasPermission("/admin/products", "DELETE")
                ? { opacity: 0.5, pointerEvents: "none" }
                : {}
            }
          />
          {Object.keys(selection).length === 1 && (
            <CommandBar.Command
              action={() => {
                navigate(`images/${Object.keys(selection)[0]}/variants`);
                setSelection({});
              }}
              label={t("products.media.manageImageVariants")}
              shortcut="m"
            />
          )}
        </CommandBar.Bar>
      </CommandBar>
    </Container>
  );
};

type Media = {
  id: string;
  url: string;
  isThumbnail: boolean;
  embedCode?: string;
  mediaType?: "file" | "embed";
  thumbnailUrl?: string;
  videoTitle?: string;
};

const getMedia = (product: any) => {
  const { images = [], thumbnail, metadata } = product;

  const media: Media[] = [];

  // Add file-based images
  images.forEach((image: { id: any; url: any }) => {
    media.push({
      id: image.id,
      url: image.url,
      isThumbnail: image.url === thumbnail,
      mediaType: "file",
    });
  });

  // Add embed videos from metadata - handle both old and new structure
  if (metadata) {
    // Handle new array structure
    if (metadata.embed_video && Array.isArray(metadata.embed_video)) {
      metadata.embed_video.forEach((value: any) => {
        if (
          typeof value === "object" &&
          value !== null &&
          "embedCode" in value &&
          typeof value.embedCode === "string"
        ) {
          const embedValue = value as {
            id?: string;
            embedCode: string;
            url?: string;
            isThumbnail?: boolean;
            thumbnailUrl?: string;
            videoTitle?: string;
          };
          media.push({
            id: embedValue.id || `embed_video_${Math.random().toString(36).substring(7)}`,
            url: embedValue.thumbnailUrl || embedValue.url || `embed://${embedValue.id}`, // Use thumbnail URL if available
            isThumbnail: embedValue.isThumbnail || false,
            mediaType: "embed",
            embedCode: embedValue.embedCode,
            thumbnailUrl: embedValue.thumbnailUrl, // Load thumbnail URL from metadata
            videoTitle: embedValue.videoTitle, // Load video title from metadata
          });
        }
      });
    } else {
      // Handle old structure for backward compatibility
      Object.entries(metadata).forEach(([key, value]) => {
        if (
          key.startsWith("embed_video_") &&
          typeof value === "object" &&
          value !== null &&
          "embedCode" in value &&
          typeof value.embedCode === "string"
        ) {
          const embedValue = value as {
            id?: string;
            embedCode: string;
            url?: string;
            isThumbnail?: boolean;
            thumbnailUrl?: string;
            videoTitle?: string;
          };
          media.push({
            id: key,
            url: embedValue.thumbnailUrl || embedValue.url || `embed://${key}`, // Use thumbnail URL if available
            isThumbnail: embedValue.isThumbnail || false,
            mediaType: "embed",
            embedCode: embedValue.embedCode,
            thumbnailUrl: embedValue.thumbnailUrl, // Load thumbnail URL from metadata
            videoTitle: embedValue.videoTitle, // Load video title from metadata
          });
        }
      });
    }
  }

  // Add thumbnail if not already included and it's a valid URL (not a placeholder)
  if (
    thumbnail &&
    !media.some(mediaItem => mediaItem.url === thumbnail) &&
    !thumbnail.startsWith("data:") &&
    !thumbnail.includes("placeholder") &&
    !thumbnail.startsWith("blob:") &&
    thumbnail.length > 10
  ) {
    // Ensure it's a real URL, not a placeholder
    media.unshift({
      id: "img_thumbnail",
      url: thumbnail,
      isThumbnail: true,
      mediaType: "file",
    });
  }

  return media;
};
