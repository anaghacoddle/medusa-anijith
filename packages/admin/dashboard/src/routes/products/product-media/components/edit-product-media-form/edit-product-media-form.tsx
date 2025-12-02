import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DropAnimation,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import { ThumbnailBadge } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { Button, Checkbox, clx, CommandBar, toast, Tooltip } from "@medusajs/ui";
import { Fragment, useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod";

import { RouteFocusModal, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useUpdateProduct } from "../../../../../hooks/api/products";
import { sdk } from "../../../../../lib/client";
import { UploadMediaFormItem } from "../../../common/components/upload-media-form-item";
import { EditProductMediaSchema, MediaSchema } from "../../../product-create/constants";
import { EditProductMediaSchemaType } from "../../../product-create/types";
import { usePermission } from "../../../../../hooks/use-permission";

type ProductMediaViewProps = {
  product: HttpTypes.AdminProduct;
};

type Media = z.infer<typeof MediaSchema>;

// Helper function to detect if a file is a video based on URL or file extension
const isVideoFile = (url: string): boolean => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".wmv", ".m4v", ".3gp", ".flv"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes("video/");
};

export const EditProductMediaForm = ({ product }: ProductMediaViewProps) => {
  const [selection, setSelection] = useState<Record<string, true>>({});
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<EditProductMediaSchemaType>({
    defaultValues: {
      media: getDefaultValues(product.images, product.thumbnail, product.metadata || undefined),
    },
    resolver: zodResolver(EditProductMediaSchema),
  });

  // Update form when product data changes (e.g., after deletion from other components)
  useEffect(() => {
    const updatedMedia = getDefaultValues(
      product.images,
      product.thumbnail,
      product.metadata || undefined
    );
    form.reset({
      media: updatedMedia,
    });
  }, [product.images, product.thumbnail, product.metadata, form]);

  const { fields, append, remove, update } = useFieldArray({
    name: "media",
    control: form.control,
    keyName: "field_id",
  });

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex(item => item.field_id === active.id);
      const newIndex = fields.findIndex(item => item.field_id === over?.id);

      form.setValue("media", arrayMove(fields, oldIndex, newIndex), {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const { mutateAsync, isPending } = useUpdateProduct(product.id!);

  const handleSubmit = form.handleSubmit(async ({ media }) => {
    // Separate different types of media
    const newFileMedia = media.filter(m => m.mediaType === "file" && m.file);
    const existingFileMedia = media.filter(m => m.mediaType === "file" && !m.file && m.url);
    const embedMedia = media.filter(m => m.mediaType === "embed");

    // Only include embed videos that are still present in the form (not deleted)
    const activeEmbedMedia = embedMedia.filter(m => m.embedCode);

    let uploaded: HttpTypes.AdminFile[] = [];

    // Upload new file-based media
    if (newFileMedia.length) {
      const { files: uploads } = await sdk.admin.upload
        .create({ files: newFileMedia.map(m => m.file!) })
        .catch(() => {
          form.setError("media", {
            type: "invalid_file",
            message: t("products.media.failedToUpload"),
          });
          return { files: [] };
        });
      uploaded = uploads;
    }

    // Combine only file-based media (images and videos) for the images array
    const allMedia = [
      ...uploaded.map((file, index) => ({
        url: file.url,
        id: file.id,
        isThumbnail: newFileMedia[index]?.isThumbnail || false,
      })),
      ...existingFileMedia.map(media => ({
        url: media.url,
        id: media.id,
        isThumbnail: media.isThumbnail,
      })),
    ];

    // Ensure only one item is marked as thumbnail (only for file-based media)
    const thumbnailItems = allMedia.filter(m => m.isThumbnail);
    if (thumbnailItems.length > 1) {
      // Keep only the first thumbnail, mark others as false
      let firstThumbnailFound = false;
      allMedia.forEach(item => {
        if (item.isThumbnail) {
          if (firstThumbnailFound) {
            item.isThumbnail = false;
          } else {
            firstThumbnailFound = true;
          }
        }
      });
    }

    // Find thumbnail from file-based media and embed videos
    const fileThumbnail = allMedia.find(m => m.isThumbnail)?.url;
    const embedThumbnail = activeEmbedMedia.find(m => m.isThumbnail)?.thumbnailUrl;
    const thumbnail = fileThumbnail || embedThumbnail;

    // Create metadata for embed videos - new array structure
    const embedVideoArray: any[] = [];
    activeEmbedMedia.forEach((media, index) => {
      // Use the original ID if it exists (for existing embed videos) or create a new one
      const id = media.id?.startsWith("embed_video_") ? media.id : `embed_video_${index}`;
      embedVideoArray.push({
        id,
        url: media.url,
        embedCode: media.embedCode,
        isThumbnail: media.isThumbnail,
        thumbnailUrl: media.thumbnailUrl, // Store thumbnail URL in metadata
        videoTitle: media.videoTitle, // Store video title in metadata
      });
    });

    // Preserve existing metadata that's not related to embed videos
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

    // Merge existing metadata with new embed video metadata
    // Always include embed_video array to ensure proper deletion
    const finalMetadata = {
      ...nonEmbedMetadata,
      embed_video: embedVideoArray, // Explicitly set embed_video array
    };

    // Note: Embed videos are stored in metadata, not in the images array
    // This prevents them from appearing as duplicate images

    await mutateAsync(
      {
        images: allMedia.map(media => ({ url: media.url, id: media.id })),
        thumbnail: thumbnail || null,
        metadata: finalMetadata, // Always send metadata to ensure embed_video array is updated
      },
      {
        onSuccess: () => {
          toast.success(t("products.media.successToast"));
          handleSuccess();
        },
        onError: error => {
          toast.error(error.message);
        },
      }
    );
  });

  const handleCheckedChange = useCallback(
    (id: string) => {
      return (val: boolean) => {
        if (!val) {
          const { [id]: _, ...rest } = selection;
          setSelection(rest);
        } else {
          setSelection(prev => ({ ...prev, [id]: true }));
        }
      };
    },
    [selection]
  );

  const handleDelete = () => {
    if (!hasPermission("/admin/products", "DELETE")) return;
    const ids = Object.keys(selection);
    const indices = ids.map(id => fields.findIndex(m => m.id === id));

    remove(indices);
    setSelection({});
  };

  const handlePromoteToThumbnail = () => {
    const ids = Object.keys(selection);

    if (!ids.length) {
      return;
    }

    const currentThumbnailIndex = fields.findIndex(m => m.isThumbnail);

    if (currentThumbnailIndex > -1) {
      update(currentThumbnailIndex, {
        ...fields[currentThumbnailIndex],
        isThumbnail: false,
      });
    }

    const index = fields.findIndex(m => m.id === ids[0]);

    update(index, {
      ...fields[index],
      isThumbnail: true,
    });

    setSelection({});
  };

  const selectionCount = Object.keys(selection).length;
  const { hasPermission } = usePermission();
  return (
    <RouteFocusModal.Form blockSearchParams form={form}>
      <KeyboundForm className="flex size-full flex-col overflow-hidden" onSubmit={handleSubmit}>
        <RouteFocusModal.Header>
          <div className="flex items-center justify-end gap-x-2">
            <Button variant="secondary" size="small" asChild>
              <Link to={{ pathname: ".", search: undefined }}>
                {t("products.media.galleryLabel")}
              </Link>
            </Button>
          </div>
        </RouteFocusModal.Header>
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <div className="flex size-full flex-col-reverse lg:grid lg:grid-cols-[1fr_560px]">
            <DndContext
              sensors={sensors}
              onDragEnd={handleDragEnd}
              onDragStart={handleDragStart}
              onDragCancel={handleDragCancel}
            >
              <div className="bg-ui-bg-subtle size-full overflow-auto">
                <div className="grid h-fit auto-rows-auto grid-cols-4 gap-6 p-6">
                  <SortableContext
                    items={fields.map(m => m.field_id)}
                    strategy={rectSortingStrategy}
                  >
                    {fields.map(m => {
                      return (
                        <MediaGridItem
                          onCheckedChange={handleCheckedChange(m.id!)}
                          checked={!!selection[m.id!]}
                          key={m.field_id}
                          media={m}
                        />
                      );
                    })}
                  </SortableContext>
                  <DragOverlay dropAnimation={dropAnimationConfig}>
                    {activeId ? (
                      <MediaGridItemOverlay
                        media={fields.find(m => m.field_id === activeId)!}
                        checked={!!selection[fields.find(m => m.field_id === activeId)!.id!]}
                      />
                    ) : null}
                  </DragOverlay>
                </div>
              </div>
            </DndContext>
            <div className="bg-ui-bg-base overflow-auto border-b px-6 py-4 lg:border-b-0 lg:border-l">
              <UploadMediaFormItem form={form} append={append} />
            </div>
          </div>
        </RouteFocusModal.Body>
        <CommandBar open={!!selectionCount}>
          <CommandBar.Bar>
            <CommandBar.Value>
              {t("general.countSelected", {
                count: selectionCount,
              })}
            </CommandBar.Value>
            <CommandBar.Seperator />
            {selectionCount === 1 && (
              <Fragment>
                <CommandBar.Command
                  action={handlePromoteToThumbnail}
                  label={t("products.media.makeThumbnail")}
                  shortcut="t"
                />
                <CommandBar.Seperator />
              </Fragment>
            )}
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
          </CommandBar.Bar>
        </CommandBar>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              disabled={
                !hasPermission("/admin/products", "PUT") ||
                !hasPermission("/admin/products", "POST")
              }
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

const getDefaultValues = (
  images: HttpTypes.AdminProductImage[] | null | undefined,
  thumbnail: string | null | undefined,
  metadata?: Record<string, any>
) => {
  const media: Media[] = [];

  // Add file-based images
  images?.forEach(image => {
    media.push({
      id: image.id!,
      url: image.url!,
      isThumbnail: image.url === thumbnail,
      file: null,
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
            file: null,
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
            file: null,
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
    !media.some(mediaItem => mediaItem.url === thumbnail) &&
    !thumbnail.startsWith("data:") &&
    !thumbnail.includes("placeholder") &&
    !thumbnail.startsWith("blob:") &&
    thumbnail.length > 10
  ) {
    // Ensure it's a real URL, not a placeholder
    const id = Math.random().toString(36).substring(7);

    media.unshift({
      id: id,
      url: thumbnail,
      isThumbnail: true,
      file: null,
      mediaType: "file",
    });
  }

  return media;
};

interface MediaView {
  id?: string;
  field_id: string;
  url: string;
  isThumbnail: boolean;
  file?: File;
  embedCode?: string;
  mediaType?: "file" | "embed";
  thumbnailUrl?: string;
  videoTitle?: string;
}

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
};

interface MediaGridItemProps {
  media: MediaView;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}

const MediaGridItem = ({ media, checked, onCheckedChange }: MediaGridItemProps) => {
  const { t } = useTranslation();

  const handleToggle = useCallback(
    (value: boolean) => {
      onCheckedChange(value);
    },
    [onCheckedChange]
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.field_id });

  const style = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Check if it's an embed video or a video file
  const isVideo =
    media.mediaType === "embed" || media.file?.type?.startsWith("video/") || isVideoFile(media.url);

  return (
    <div
      className={clx(
        "shadow-elevation-card-rest hover:shadow-elevation-card-hover focus-visible:shadow-borders-focus bg-ui-bg-subtle-hover group relative aspect-square h-auto max-w-full overflow-hidden rounded-lg outline-none"
      )}
      style={style}
      ref={setNodeRef}
    >
      {media.isThumbnail && (
        <div className="absolute left-2 top-2">
          <Tooltip content={t("products.media.thumbnailTooltip")}>
            <ThumbnailBadge />
          </Tooltip>
        </div>
      )}
      <div
        className={clx("absolute inset-0 cursor-grab touch-none outline-none", {
          "cursor-grabbing": isDragging,
        })}
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
      />
      <div
        className={clx("transition-fg absolute right-2 top-2 opacity-0", {
          "group-focus-within:opacity-100 group-hover:opacity-100 group-focus:opacity-100":
            !isDragging && !checked,
          "opacity-100": checked,
        })}
      >
        <Checkbox
          onClick={e => {
            e.stopPropagation();
          }}
          checked={checked}
          onCheckedChange={handleToggle}
        />
      </div>
      {isVideo ? (
        media.mediaType === "embed" && media.embedCode ? (
          media.thumbnailUrl ? (
            <img
              src={media.thumbnailUrl}
              alt="Embed Video"
              className="size-full object-cover object-center"
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
              <div className="text-ui-fg-muted text-xs text-center px-2">
                <div className="mb-1">📺</div>
                <div>Embed Video</div>
              </div>
            </div>
          )
        ) : (
          <video
            src={media.url}
            className="size-full object-cover object-center pointer-events-none"
            muted
            preload="metadata"
            onContextMenu={e => e.preventDefault()}
          />
        )
      ) : (
        <img src={media.url} alt="" className="size-full object-cover object-center" />
      )}
      {/* Fallback for embed videos when thumbnail fails */}
      {isVideo && media.mediaType === "embed" && media.embedCode && media.thumbnailUrl && (
        <div
          className="embed-fallback size-full flex items-center justify-center bg-ui-bg-subtle absolute inset-0"
          style={{ display: "none" }}
        >
          <div className="text-ui-fg-muted text-xs text-center px-2">
            <div className="mb-1">📺</div>
            <div>Embed Video</div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MediaGridItemOverlay = ({
  media,
  checked,
}: {
  media: MediaView;
  checked: boolean;
}) => {
  // Check if it's an embed video or a video file
  const isVideo =
    media.mediaType === "embed" || media.file?.type?.startsWith("video/") || isVideoFile(media.url);

  return (
    <div className="shadow-elevation-card-rest hover:shadow-elevation-card-hover focus-visible:shadow-borders-focus bg-ui-bg-subtle-hover group relative aspect-square h-auto max-w-full cursor-grabbing overflow-hidden rounded-lg outline-none">
      {media.isThumbnail && (
        <div className="absolute left-2 top-2">
          <ThumbnailBadge />
        </div>
      )}
      <div
        className={clx("transition-fg absolute right-2 top-2 opacity-0", {
          "opacity-100": checked,
        })}
      >
        <Checkbox checked={checked} />
      </div>
      {isVideo ? (
        media.mediaType === "embed" && media.embedCode ? (
          media.thumbnailUrl ? (
            <img
              src={media.thumbnailUrl}
              alt="Embed Video"
              className="size-full object-cover object-center"
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
              <div className="text-ui-fg-muted text-xs text-center px-2">
                <div className="mb-1">📺</div>
                <div>Embed Video</div>
              </div>
            </div>
          )
        ) : (
          <video
            src={media.url}
            className="size-full object-cover object-center pointer-events-none"
            muted
            preload="metadata"
            onContextMenu={e => e.preventDefault()}
          />
        )
      ) : (
        <img src={media.url} alt="" className="size-full object-cover object-center" />
      )}
      {/* Fallback for embed videos when thumbnail fails */}
      {isVideo && media.mediaType === "embed" && media.embedCode && media.thumbnailUrl && (
        <div
          className="embed-fallback size-full flex items-center justify-center bg-ui-bg-subtle absolute inset-0"
          style={{ display: "none" }}
        >
          <div className="text-ui-fg-muted text-xs text-center px-2">
            <div className="mb-1">📺</div>
            <div>{media.videoTitle || "Embed Video"}</div>
          </div>
        </div>
      )}
    </div>
  );
};
