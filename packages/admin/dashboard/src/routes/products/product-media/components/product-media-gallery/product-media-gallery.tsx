import {
  ArrowDownTray,
  ThumbnailBadge,
  Trash,
  TriangleLeftMini,
  TriangleRightMini,
} from "@medusajs/icons";
import { Button, IconButton, Text, Tooltip, clx, usePrompt } from "@medusajs/ui";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

import { HttpTypes } from "@medusajs/types";
import { RouteFocusModal } from "../../../../../components/modals";
import { EmbedVideoDisplay } from "../../../../../components/common/embed-video-display";
import { useUpdateProduct } from "../../../../../hooks/api/products";
import { usePermission } from "../../../../../hooks/use-permission";

type ProductMediaGalleryProps = {
  product: HttpTypes.AdminProduct;
};

// Helper function to detect if a file is a video based on URL or file extension
const isVideoFile = (url: string): boolean => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".wmv"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes("video/");
};

export const ProductMediaGallery = ({ product }: ProductMediaGalleryProps) => {
  const { state } = useLocation();
  const [curr, setCurr] = useState<number>(state?.curr || 0);

  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync, isPending } = useUpdateProduct(product.id);

  const media = getMedia(product.images, product.thumbnail, product.metadata || undefined);

  const next = useCallback(() => {
    if (isPending) {
      return;
    }

    setCurr(prev => (prev + 1) % media.length);
  }, [media, isPending]);

  const prev = useCallback(() => {
    if (isPending) {
      return;
    }

    setCurr(prev => (prev - 1 + media.length) % media.length);
  }, [media, isPending]);

  const goTo = useCallback(
    (index: number) => {
      if (isPending) {
        return;
      }

      setCurr(index);
    },
    [isPending]
  );

  const handleDownloadCurrent = () => {
    if (isPending) {
      return;
    }

    const currentMedia = media[curr];

    // Don't allow downloading embed videos
    if (currentMedia.mediaType === "embed") {
      return;
    }

    const a = document.createElement("a") as HTMLAnchorElement & {
      download: string;
    };

    a.href = currentMedia.url;
    a.download = "image";
    a.target = "_blank";

    a.click();
  };

  const handleDeleteCurrent = async () => {
    const current = media[curr];

    const res = await prompt({
      title: t("general.areYouSure"),
      description: current.isThumbnail
        ? t("products.media.deleteWarningWithThumbnail", { count: 1 })
        : t("products.media.deleteWarning", { count: 1 }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    // Check if this is an embed video
    const isEmbedVideo = current.mediaType === "embed";

    if (isEmbedVideo) {
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

      // Remove the selected embed video from the array
      const updatedEmbedVideos = currentEmbedVideos.filter(
        (embedVideo: any) => embedVideo.id !== current.id
      );

      // Create final metadata with updated embed_video array
      const finalMetadata = {
        ...nonEmbedMetadata,
        embed_video: updatedEmbedVideos,
      };

      if (curr === media.length - 1) {
        setCurr(prev => prev - 1);
      }

      await mutateAsync({
        images: product.images || [], // Keep existing images unchanged
        thumbnail: current.isThumbnail ? "" : undefined,
        metadata: finalMetadata, // Send updated metadata
      });
    } else {
      // Handle file-based image deletion
      const mediaToKeep =
        product.images?.filter(i => i.id !== current.id).map(i => ({ id: i.id, url: i.url })) || [];

      if (curr === media.length - 1) {
        setCurr(prev => prev - 1);
      }

      await mutateAsync({
        images: mediaToKeep,
        thumbnail: current.isThumbnail ? "" : undefined,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "ArrowLeft") {
        prev();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [next, prev]);

  const noMedia = !media.length;
  const { hasPermission } = usePermission();
  return (
    <div className="flex size-full flex-col overflow-hidden">
      <RouteFocusModal.Header>
        <div className="flex items-center justify-end gap-x-2">
          <IconButton
            size="small"
            type="button"
            onClick={handleDeleteCurrent}
            disabled={noMedia || !hasPermission("/admin/products", "DELETE")}
          >
            <Trash />
            <span className="sr-only">{t("products.media.deleteImageLabel")}</span>
          </IconButton>
          <IconButton
            size="small"
            type="button"
            onClick={handleDownloadCurrent}
            disabled={noMedia || media[curr]?.mediaType === "embed"}
          >
            <ArrowDownTray />
            <span className="sr-only">{t("products.media.downloadImageLabel")}</span>
          </IconButton>
          <Button variant="secondary" size="small" asChild>
            <Link to={{ pathname: ".", search: "view=edit" }}>{t("actions.edit")}</Link>
          </Button>
        </div>
      </RouteFocusModal.Header>
      <RouteFocusModal.Body className="flex flex-col overflow-hidden">
        <Canvas curr={curr} media={media} />
        <Preview curr={curr} media={media} prev={prev} next={next} goTo={goTo} />
      </RouteFocusModal.Body>
    </div>
  );
};

const Canvas = ({ media, curr }: { media: Media[]; curr: number }) => {
  const { t } = useTranslation();

  if (media.length === 0) {
    return (
      <div className="bg-ui-bg-subtle flex size-full flex-col items-center justify-center gap-y-4 pb-8 pt-6">
        <div className="flex flex-col items-center">
          <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle">
            {t("products.media.emptyState.header")}
          </Text>
          <Text size="small" className="text-ui-fg-muted">
            {t("products.media.emptyState.description")}
          </Text>
        </div>
        <Button size="small" variant="secondary" asChild>
          <Link to="?view=edit">{t("products.media.emptyState.action")}</Link>
        </Button>
      </div>
    );
  }

  const currentMedia = media[curr];
  const isVideo = isVideoFile(currentMedia.url);
  const isEmbedVideo = currentMedia.mediaType === "embed" && currentMedia.embedCode;

  return (
    <div className="bg-ui-bg-subtle relative size-full overflow-hidden">
      <div className="flex size-full items-center justify-center p-4">
        <div className="relative inline-block max-h-full max-w-full">
          {currentMedia.isThumbnail && (
            <div className="absolute left-2 top-2">
              <Tooltip content={t("products.media.thumbnailTooltip")}>
                <ThumbnailBadge />
              </Tooltip>
            </div>
          )}
          {isEmbedVideo ? (
            <div className="shadow-elevation-card-rest rounded-xl overflow-hidden min-w-[600px] min-h-[400px] max-w-[calc(100vw-200px)] max-h-[calc(100vh-100px)]">
              <EmbedVideoDisplay embedCode={currentMedia.embedCode!} className="w-full h-full" />
            </div>
          ) : isVideo ? (
            <video
              src={currentMedia.url}
              controls
              className="object-fit shadow-elevation-card-rest max-h-[calc(100vh-200px)] w-auto rounded-xl object-contain"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={currentMedia.url}
              alt=""
              className="object-fit shadow-elevation-card-rest max-h-[calc(100vh-200px)] w-auto rounded-xl object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const MAX_VISIBLE_ITEMS = 8;

const Preview = ({
  media,
  curr,
  prev,
  next,
  goTo,
}: {
  media: Media[];
  curr: number;
  prev: () => void;
  next: () => void;
  goTo: (index: number) => void;
}) => {
  if (!media.length) {
    return null;
  }

  const getVisibleItems = (media: Media[], index: number) => {
    if (media.length <= MAX_VISIBLE_ITEMS) {
      return media;
    }

    const half = Math.floor(MAX_VISIBLE_ITEMS / 2);
    const start = (index - half + media.length) % media.length;
    const end = (start + MAX_VISIBLE_ITEMS) % media.length;

    if (end < start) {
      return [...media.slice(start), ...media.slice(0, end)];
    } else {
      return media.slice(start, end);
    }
  };

  const visibleItems = getVisibleItems(media, curr);

  return (
    <div className="flex shrink-0 items-center justify-center gap-x-2 border-t p-3">
      <IconButton
        size="small"
        variant="transparent"
        className="text-ui-fg-muted"
        type="button"
        onClick={prev}
      >
        <TriangleLeftMini className="rtl:rotate-180" />
      </IconButton>
      <div className="flex items-center gap-x-2">
        {visibleItems.map(item => {
          const isCurrentImage = item.id === media[curr].id;
          const originalIndex = media.findIndex(i => i.id === item.id);
          const isVideo = isVideoFile(item.url);
          const isEmbedVideo = item.mediaType === "embed" && item.embedCode;

          return (
            <button
              type="button"
              onClick={() => goTo(originalIndex)}
              className={clx("transition-fg size-7 overflow-hidden rounded-[4px] outline-none", {
                "shadow-borders-focus": isCurrentImage,
              })}
              key={item.id}
            >
              {isEmbedVideo ? (
                item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt="Embed Video"
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
                      <div className="text-[6px]">{item.videoTitle || "Embed"}</div>
                    </div>
                  </div>
                )
              ) : isVideo ? (
                <video src={item.url} className="size-full object-cover" muted preload="metadata" />
              ) : (
                <img src={item.url} alt="" className="size-full object-cover" />
              )}
              {/* Fallback for embed videos when thumbnail fails */}
              {isEmbedVideo && item.thumbnailUrl && (
                <div
                  className="embed-fallback size-full flex items-center justify-center bg-ui-bg-subtle absolute inset-0"
                  style={{ display: "none" }}
                >
                  <div className="text-ui-fg-muted text-xs text-center px-1">
                    <div className="mb-0.5">📺</div>
                    <div className="text-[6px]">{item.videoTitle || "Embed"}</div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <IconButton
        size="small"
        variant="transparent"
        className="text-ui-fg-muted"
        type="button"
        onClick={next}
      >
        <TriangleRightMini className="rtl:rotate-180" />
      </IconButton>
    </div>
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

const getMedia = (
  images: HttpTypes.AdminProductImage[] | null,
  thumbnail: string | null,
  metadata?: Record<string, any>
) => {
  const media: Media[] = [];

  // Add file-based images
  images?.forEach(image => {
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
        if (typeof value === "object" && value.embedCode) {
          media.push({
            id: value.id || `embed_video_${Math.random().toString(36).substring(7)}`,
            url: value.thumbnailUrl || value.url || `embed://${value.id}`, // Use thumbnail URL if available
            isThumbnail: value.isThumbnail || false,
            mediaType: "embed",
            embedCode: value.embedCode,
            thumbnailUrl: value.thumbnailUrl, // Load thumbnail URL from metadata
            videoTitle: value.videoTitle, // Load video title from metadata
          });
        }
      });
    } else {
      // Handle old structure for backward compatibility
      Object.entries(metadata).forEach(([key, value]) => {
        if (key.startsWith("embed_video_") && typeof value === "object" && value.embedCode) {
          media.push({
            id: key,
            url: value.thumbnailUrl || value.url || `embed://${key}`, // Use thumbnail URL if available
            isThumbnail: value.isThumbnail || false,
            mediaType: "embed",
            embedCode: value.embedCode,
            thumbnailUrl: value.thumbnailUrl, // Load thumbnail URL from metadata
            videoTitle: value.videoTitle, // Load video title from metadata
          });
        }
      });
    }
  }

  // Add thumbnail if not already included and it's a valid URL (not a placeholder)
  if (
    thumbnail &&
    !media.some(mediaItem => mediaItem.isThumbnail) &&
    !thumbnail.startsWith("data:") &&
    !thumbnail.includes("placeholder") &&
    !thumbnail.startsWith("blob:") &&
    thumbnail.length > 10
  ) {
    // Ensure it's a real URL, not a placeholder
    media.unshift({
      id: "thumbnail_only",
      url: thumbnail,
      isThumbnail: true,
      mediaType: "file",
    });
  }

  return media;
};
