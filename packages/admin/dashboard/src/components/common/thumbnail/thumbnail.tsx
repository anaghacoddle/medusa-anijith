import { Photo } from "@medusajs/icons";
import { clx } from "@medusajs/ui";

// Helper function to detect if a file is a video based on URL or file extension
const isVideoFile = (url: string): boolean => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".wmv"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes("video/");
};

type ThumbnailProps = {
  src?: string | null;
  alt?: string;
  size?: "small" | "base" | "large" | "xlarge";
  thumbnailUrl?: string; // For embed video thumbnails
  videoTitle?: string; // For embed video titles
};

export const Thumbnail = ({ src, alt, size = "base", thumbnailUrl }: ThumbnailProps) => {
  const isVideo = src ? isVideoFile(src) : false;
  const isEmbedVideo = src?.startsWith("embed://");

  return (
    <div
      className={clx(
        "bg-ui-bg-component border-ui-border-base flex items-center justify-center overflow-hidden rounded border",
        {
          "h-8 w-6": size === "base",
          "h-5 w-4": size === "small",
          "h-12 w-12": size === "large",
          "h-16 w-16": size === "xlarge",
        }
      )}
    >
      {src ? (
        isEmbedVideo ? (
          thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={alt}
              className="h-full w-full object-cover object-center"
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
            <div className="h-full w-full flex items-center justify-center bg-ui-bg-subtle">
              <div className="text-ui-fg-muted text-xs text-center px-1">
                <div className="mb-0.5">📺</div>
                <div className="text-[8px]">Embed</div>
              </div>
            </div>
          )
        ) : isVideo ? (
          <video
            src={src}
            className="h-full w-full object-cover object-center"
            muted
            preload="metadata"
          />
        ) : (
          <img src={src} alt={alt} className="h-full w-full object-cover object-center" />
        )
      ) : (
        <Photo className="text-ui-fg-subtle" />
      )}
      {/* Fallback for embed videos when thumbnail fails */}
      {isEmbedVideo && thumbnailUrl && (
        <div
          className="embed-fallback h-full w-full flex items-center justify-center bg-ui-bg-subtle absolute inset-0"
          style={{ display: "none" }}
        >
          <div className="text-ui-fg-muted text-xs text-center px-1">
            <div className="mb-0.5">📺</div>
            <div className="text-[8px]">Embed</div>
          </div>
        </div>
      )}
    </div>
  );
};
