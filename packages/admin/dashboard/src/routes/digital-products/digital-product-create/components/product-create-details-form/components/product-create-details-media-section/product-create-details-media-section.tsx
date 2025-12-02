import { useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { IconButton, Text } from "@medusajs/ui";
import { DotsSix, StackPerspective, ThumbnailBadge, Trash, XMark } from "@medusajs/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DragStartEvent, DragEndEvent, DropAnimation, UniqueIdentifier } from "@dnd-kit/core";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { DigitalProductCreateSchemaType } from "../../../../types";
import { UploadMediaFormItem } from "../../../../../../products/common/components/upload-media-form-item";
import { ActionMenu } from "../../../../../../../components/common/action-menu";

// Helper function to detect if a file is a video based on URL or file extension
const isVideoFile = (url: string): boolean => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".wmv"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes("video/");
};

type ProductCreateMediaSectionProps = {
  form: UseFormReturn<DigitalProductCreateSchemaType>;
};

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
};

export const ProductCreateMediaSection = ({ form }: ProductCreateMediaSectionProps) => {
  const { fields, append, remove } = useFieldArray({
    name: "product.media",
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

      form.setValue("product.media", arrayMove(fields, oldIndex, newIndex), {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const getOnDelete = (index: number) => {
    return () => {
      remove(index);
    };
  };

  const getMakeThumbnail = (index: number) => {
    return () => {
      const newFields = fields.map((field, i) => {
        return {
          ...field,
          isThumbnail: i === index,
        };
      });

      form.setValue("product.media", newFields, {
        shouldDirty: true,
        shouldTouch: true,
      });
    };
  };

  const getItemHandlers = (index: number) => {
    return {
      onDelete: getOnDelete(index),
      onMakeThumbnail: getMakeThumbnail(index),
    };
  };

  return (
    <div id="media" className="flex flex-col gap-y-2">
      <UploadMediaFormItem form={form} append={append} showHint={true} productType="digital" />
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
      >
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeId ? (
            <MediaGridItemOverlay field={fields.find(m => m.field_id === activeId)!} />
          ) : null}
        </DragOverlay>
        <ul className="flex flex-col gap-y-2">
          <SortableContext items={fields.map(field => field.field_id)}>
            {fields.map((field, index) => {
              const { onDelete, onMakeThumbnail } = getItemHandlers(index);

              return (
                <MediaItem
                  key={field.field_id}
                  field={field}
                  onDelete={onDelete}
                  onMakeThumbnail={onMakeThumbnail}
                />
              );
            })}
          </SortableContext>
        </ul>
      </DndContext>
    </div>
  );
};

type MediaField = {
  isThumbnail: boolean;
  url: string;
  id?: string | undefined;
  file?: File;
  field_id: string;
  embedCode?: string;
  mediaType?: "file" | "embed";
  thumbnailUrl?: string;
};

type MediaItemProps = {
  field: MediaField;
  onDelete: () => void;
  onMakeThumbnail: () => void;
};

const MediaItem = ({ field, onDelete, onMakeThumbnail }: MediaItemProps) => {
  const { t } = useTranslation();

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.field_id });

  const style = {
    opacity: isDragging ? 0.4 : undefined,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  // Don't return null for embed videos - they don't have a file but should still be displayed
  if (!field.file && field.mediaType !== "embed") {
    return null;
  }

  return (
    <li
      className="bg-ui-bg-component shadow-elevation-card-rest flex items-center justify-between rounded-lg px-3 py-2"
      ref={setNodeRef}
      style={style}
    >
      <div className="flex items-center gap-x-2">
        <IconButton
          variant="transparent"
          type="button"
          size="small"
          {...attributes}
          {...listeners}
          ref={setActivatorNodeRef}
          className="cursor-grab touch-none active:cursor-grabbing"
        >
          <DotsSix className="text-ui-fg-muted" />
        </IconButton>
        <div className="flex items-center gap-x-3">
          <div className="bg-ui-bg-base h-10 w-[30px] overflow-hidden rounded-md">
            <ThumbnailPreview
              url={field.url}
              file={field.file}
              embedCode={field.embedCode}
              mediaType={field.mediaType}
              thumbnailUrl={field.thumbnailUrl}
            />
          </div>
          <div className="flex flex-col">
            <Text size="small" leading="compact">
              {field.file?.name || "Embed Video"}
            </Text>
            <div className="flex items-center gap-x-1">
              {field.isThumbnail && <ThumbnailBadge />}
              {field.file && (
                <Text size="xsmall" leading="compact" className="text-ui-fg-subtle">
                  {formatFileSize(field.file.size)}
                </Text>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-x-1">
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("products.media.makeThumbnail"),
                  icon: <StackPerspective />,
                  onClick: onMakeThumbnail,
                },
              ],
            },
            {
              actions: [
                {
                  icon: <Trash />,
                  label: t("actions.delete"),
                  onClick: onDelete,
                },
              ],
            },
          ]}
        />
        <IconButton type="button" size="small" variant="transparent" onClick={onDelete}>
          <XMark />
        </IconButton>
      </div>
    </li>
  );
};

const MediaGridItemOverlay = ({ field }: { field: MediaField }) => {
  return (
    <li className="bg-ui-bg-component shadow-elevation-card-rest flex items-center justify-between rounded-lg px-3 py-2">
      <div className="flex items-center gap-x-2">
        <IconButton
          variant="transparent"
          size="small"
          className="cursor-grab touch-none active:cursor-grabbing"
        >
          <DotsSix className="text-ui-fg-muted" />
        </IconButton>
        <div className="flex items-center gap-x-3">
          <div className="bg-ui-bg-base h-10 w-[30px] overflow-hidden rounded-md">
            <ThumbnailPreview
              url={field.url}
              file={field.file}
              embedCode={field.embedCode}
              mediaType={field.mediaType}
              thumbnailUrl={field.thumbnailUrl}
            />
          </div>
          <div className="flex flex-col">
            <Text size="small" leading="compact">
              {field.file?.name || "Embed Video"}
            </Text>
            <div className="flex items-center gap-x-1">
              {field.isThumbnail && <ThumbnailBadge />}
              {field.file && (
                <Text size="xsmall" leading="compact" className="text-ui-fg-subtle">
                  {formatFileSize(field.file.size)}
                </Text>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-x-1">
        <ActionMenu groups={[]} />
        <IconButton type="button" size="small" variant="transparent" onClick={() => {}}>
          <XMark />
        </IconButton>
      </div>
    </li>
  );
};

const ThumbnailPreview = ({
  url,
  file,
  embedCode,
  mediaType,
  thumbnailUrl,
}: {
  url?: string | null;
  file?: File;
  embedCode?: string;
  mediaType?: "file" | "embed";
  thumbnailUrl?: string;
}) => {
  if (!url) {
    return null;
  }

  // Check if it's an embed video
  if (mediaType === "embed" && embedCode) {
    return (
      <div className="size-full relative">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
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
            <div className="text-ui-fg-muted text-xs text-center px-2">
              <div className="mb-1">📺</div>
              <div>Embed Video</div>
            </div>
          </div>
        )}
        {/* Fallback for embed videos when thumbnail fails */}
        {thumbnailUrl && (
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
  }

  // Check if the file is a video using the file type or URL
  const isVideo = file?.type?.startsWith("video/") || isVideoFile(url);

  return (
    <>
      {isVideo ? (
        <video
          src={url}
          className="size-full object-cover object-center"
          muted
          preload="metadata"
        />
      ) : (
        <img src={url} alt="" className="size-full object-cover object-center" />
      )}
    </>
  );
};

function formatFileSize(bytes: number | undefined, decimalPlaces: number = 2): string {
  if (!bytes || bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimalPlaces)) + " " + sizes[i];
}
