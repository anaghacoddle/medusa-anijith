import { HttpTypes } from "@medusajs/types";
import { Button, ProgressStatus, ProgressTabs, toast } from "@medusajs/ui";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RouteFocusModal, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useExtendableForm } from "../../../../../dashboard-app/forms/hooks";
import { useCreateProduct } from "../../../../../hooks/api/products";
import { sdk } from "../../../../../lib/client";
import { useExtension } from "../../../../../providers/extension-provider";
import {
  PRODUCT_CREATE_FORM_DEFAULTS,
  DigitalProductCreateSchema,
  MediaType,
} from "../../constants";
import { ProductCreateDetailsForm } from "../product-create-details-form";
import { ProductCreateOrganizeForm } from "../product-create-organize-form";
import { ProductCreateVariantsForm } from "../product-create-variants-form";
import { usePermission } from "../../../../../hooks/use-permission";

enum Tab {
  DETAILS = "details",
  ORGANIZE = "organize",
  VARIANTS = "variants",
  INVENTORY = "inventory",
}

type TabState = Record<Tab, ProgressStatus>;

const SAVE_DRAFT_BUTTON = "save-draft-button";

type ProductCreateFormProps = {
  defaultChannel?: HttpTypes.AdminSalesChannel;
  regions: HttpTypes.AdminRegion[];
  store: HttpTypes.AdminStore;
  pricePreferences: HttpTypes.AdminPricePreference[];
};

export const ProductCreateForm = ({
  defaultChannel,
  regions,
  store,
  pricePreferences,
}: ProductCreateFormProps) => {
  const [tab, setTab] = useState<Tab>(Tab.DETAILS);
  const [tabState, setTabState] = useState<TabState>({
    [Tab.DETAILS]: "in-progress",
    [Tab.ORGANIZE]: "not-started",
    [Tab.VARIANTS]: "not-started",
    [Tab.INVENTORY]: "not-started",
  });

  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { getFormConfigs } = useExtension();
  const configs = getFormConfigs("product", "create");

  const form = useExtendableForm({
    defaultValues: {
      ...PRODUCT_CREATE_FORM_DEFAULTS,
      product: {
        ...PRODUCT_CREATE_FORM_DEFAULTS.product,
        sales_channels: defaultChannel
          ? [{ id: defaultChannel.id, name: defaultChannel.name }]
          : [],
      },
    },
    schema: DigitalProductCreateSchema,
    configs,
    mode: "onChange",
  });

  const { mutateAsync, isPending } = useCreateProduct();

  const regionsCurrencyMap = useMemo(() => {
    if (!regions?.length) {
      return {};
    }

    return regions.reduce(
      (acc, reg) => {
        acc[reg.id] = reg.currency_code;
        return acc;
      },
      {} as Record<string, string>
    );
  }, [regions]);

  // Helper function to upload media files by type
  const uploadMediaFiles = async (
    mediaType: MediaType,
    medias: { type: MediaType; file?: File }[]
  ) => {
    const mediaWithFiles = medias.filter(m => m.type === mediaType && m.file instanceof File);

    if (mediaWithFiles.length === 0) {
      return null;
    }

    try {
      const uploadResponse = await sdk.admin.upload.create({
        files: mediaWithFiles.map(m => m.file!),
      });

      return {
        mediaWithFiles,
        files: uploadResponse.files,
      };
    } catch (error) {
      console.error(`Error uploading ${mediaType} files:`, error);
      throw error;
    }
  };

  const handleSubmit = form.handleSubmit(async (values, e) => {
    let isDraftSubmission = false;
    if (e?.nativeEvent instanceof SubmitEvent) {
      const submitter = e?.nativeEvent?.submitter as HTMLButtonElement;
      isDraftSubmission = submitter.dataset.name === SAVE_DRAFT_BUTTON;
    }

    try {
      // Get media from form
      const formMedias = values.medias || [];

      // Upload preview and main media files
      const previewResult = await uploadMediaFiles(MediaType.PREVIEW, formMedias);
      const mainResult = await uploadMediaFiles(MediaType.MAIN, formMedias);

      // Build media data array with uploaded file IDs
      const mediaData: {
        type: MediaType;
        file_id: string;
        mime_type: string;
      }[] = [];

      previewResult?.mediaWithFiles.forEach((media, index) => {
        mediaData.push({
          type: media.type,
          file_id: previewResult.files[index].id,
          mime_type: media.file!.type,
        });
      });

      mainResult?.mediaWithFiles.forEach((media, index) => {
        mediaData.push({
          type: media.type,
          file_id: mainResult.files[index].id,
          mime_type: media.file!.type,
        });
      });

      // Handle product media (images/videos)
      const productMedia = values.product.media || [];
      const fileMedia = productMedia.filter(m => m.mediaType === "file" && m.file);
      const embedMedia = productMedia.filter(m => m.mediaType === "embed");

      let uploadedMedia: HttpTypes.AdminFile[] = [];
      if (fileMedia.length) {
        const thumbnailReq = fileMedia.find(m => m.isThumbnail);
        const otherMediaReq = fileMedia.filter(m => !m.isThumbnail);

        const fileReqs = [];
        if (thumbnailReq) {
          fileReqs.push(sdk.admin.upload.create({ files: [thumbnailReq.file] }).then(r => r.files));
        }
        if (otherMediaReq?.length) {
          fileReqs.push(
            sdk.admin.upload
              .create({
                files: otherMediaReq.map(m => m.file),
              })
              .then(r => r.files)
          );
        }

        uploadedMedia = (await Promise.all(fileReqs)).flat();
      }

      // Construct digital product payload
      const digitalProductPayload = {
        name: values.title || "Untitled Digital Product",
        medias: mediaData,
        product: {
          status: isDraftSubmission ? "draft" : "published",
          is_giftcard: false,
          tags: values.product.tags?.map(t => ({ id: t })) || [],
          sales_channels: values.product.sales_channels?.map(ch => ({ id: ch.id })) || [],
          images:
            uploadedMedia.map(file => ({
              url: file.url,
            })) || [],
          collection_id: values.product.collection_id || null,
          // shipping_profile_id: values.product.shipping_profile_id || "",
          categories: values.product.categories?.map(c => ({ id: c })) || [],
          type_id: values.product.type_id || null,
          handle: values.product.handle || "",
          title: values.title || "",
          subtitle: values.product.subtitle || "",
          description: values.product.description || "",
          discountable: values.product.discountable ?? true,
          options: values.product.options?.length
            ? values.product.options
            : [
                {
                  title: "Default option",
                  values: ["Default option value"],
                },
              ],
          variants: (values.product.variants || [])
            .filter(v => v.should_create)
            .map(variant => ({
              title: variant.title || "Default variant",
              options: variant.options || {
                "Default option": "Default option value",
              },
              manage_inventory: false,
              allow_backorder: variant.allow_backorder ?? false,
              variant_rank: variant.variant_rank || 0,
              // inventory_items: [],
              prices: Object.entries(variant.prices || {}).map(([currency_code, amount]) => ({
                currency_code,
                amount: Math.round(parseFloat(amount)),
              })),
              // shipping_profile_id: "",
            })),
          metadata: {
            embed_video:
              embedMedia.map(m => ({
                url: m.thumbnailUrl,
                embedCode: m.embedCode,
                videoTitle: m.videoTitle,
              })) || [],
          },
          additional_data: {
            brand: values.product.brand || "",
            ...values.product.additional_data,
          },
        },
      };

      const res = await fetch(`/admin/digital-products`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(digitalProductPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create digital product");
      }

      toast.success(`Digital Product "${data?.name || values.title}" created successfully!`);
      handleSuccess(`/products/${data?.digital_product?.product_variant?.product_id}`);
    } catch (error) {
      console.error("Error creating digital product:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  });

  const onNext = async (currentTab: Tab) => {
    const valid = await form.trigger();

    if (!valid) {
      return;
    }

    if (currentTab === Tab.DETAILS) {
      setTab(Tab.ORGANIZE);
    }

    if (currentTab === Tab.ORGANIZE) {
      setTab(Tab.VARIANTS);
    }

    if (currentTab === Tab.VARIANTS) {
      setTab(Tab.INVENTORY);
    }
  };

  useEffect(() => {
    setTabState(prev => {
      const currentState = { ...prev };

      if (tab === Tab.DETAILS) {
        currentState[Tab.DETAILS] = "in-progress";
      } else if (tab === Tab.ORGANIZE) {
        currentState[Tab.DETAILS] = "completed";
        currentState[Tab.ORGANIZE] = "in-progress";
      } else if (tab === Tab.VARIANTS) {
        currentState[Tab.DETAILS] = "completed";
        currentState[Tab.ORGANIZE] = "completed";
        currentState[Tab.VARIANTS] = "in-progress";
      } else if (tab === Tab.INVENTORY) {
        currentState[Tab.DETAILS] = "completed";
        currentState[Tab.ORGANIZE] = "completed";
        currentState[Tab.VARIANTS] = "completed";
        currentState[Tab.INVENTORY] = "in-progress";
      }

      return currentState;
    });
  }, [tab]);

  const { hasPermission } = usePermission();

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onKeyDown={e => {
          if (e.key === "Enter") {
            if (e.target instanceof HTMLTextAreaElement && !(e.metaKey || e.ctrlKey)) {
              return;
            }

            e.preventDefault();

            if (e.metaKey || e.ctrlKey) {
              if (tab !== Tab.VARIANTS) {
                e.preventDefault();
                e.stopPropagation();
                onNext(tab);
                return;
              }

              handleSubmit();
            }
          }
        }}
        onSubmit={handleSubmit}
        className="flex h-full flex-col"
      >
        <ProgressTabs
          value={tab}
          onValueChange={async tab => {
            const valid = await form.trigger();

            if (!valid) {
              return;
            }

            setTab(tab as Tab);
          }}
          className="flex h-full flex-col overflow-hidden"
        >
          <RouteFocusModal.Header>
            <div className="-my-2 w-full border-l">
              <ProgressTabs.List className="justify-start-start flex w-full items-center">
                <ProgressTabs.Trigger
                  status={tabState[Tab.DETAILS]}
                  value={Tab.DETAILS}
                  className="max-w-[200px] truncate"
                >
                  {t("products.create.tabs.details")}
                </ProgressTabs.Trigger>
                <ProgressTabs.Trigger
                  status={tabState[Tab.ORGANIZE]}
                  value={Tab.ORGANIZE}
                  className="max-w-[200px] truncate"
                >
                  {t("products.create.tabs.organize")}
                </ProgressTabs.Trigger>
                <ProgressTabs.Trigger
                  status={tabState[Tab.VARIANTS]}
                  value={Tab.VARIANTS}
                  className="max-w-[200px] truncate"
                >
                  {t("products.create.tabs.variants")}
                </ProgressTabs.Trigger>
              </ProgressTabs.List>
            </div>
          </RouteFocusModal.Header>
          <RouteFocusModal.Body className="size-full overflow-hidden">
            <ProgressTabs.Content className="size-full overflow-y-auto" value={Tab.DETAILS}>
              <ProductCreateDetailsForm form={form} />
            </ProgressTabs.Content>
            <ProgressTabs.Content className="size-full overflow-y-auto" value={Tab.ORGANIZE}>
              <ProductCreateOrganizeForm form={form} />
            </ProgressTabs.Content>
            <ProgressTabs.Content className="size-full overflow-y-auto" value={Tab.VARIANTS}>
              <ProductCreateVariantsForm
                form={form}
                store={store}
                regions={regions}
                pricePreferences={pricePreferences}
              />
            </ProgressTabs.Content>
          </RouteFocusModal.Body>
        </ProgressTabs>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              data-name={SAVE_DRAFT_BUTTON}
              size="small"
              type="submit"
              isLoading={isPending}
              className="whitespace-nowrap"
            >
              {t("actions.saveAsDraft")}
            </Button>
            <PrimaryButton
              tab={tab}
              next={onNext}
              isLoading={isPending}
              hasPermission={hasPermission}
            />
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

type PrimaryButtonProps = {
  tab: Tab;
  next: (tab: Tab) => void;
  isLoading?: boolean;
  showInventoryTab?: boolean;
  hasPermission: (route: string, method?: string) => boolean;
};

const PrimaryButton = ({
  tab,
  next,
  isLoading,
  showInventoryTab,
  hasPermission,
}: PrimaryButtonProps) => {
  const { t } = useTranslation();

  if ((tab === Tab.VARIANTS && !showInventoryTab) || (tab === Tab.INVENTORY && showInventoryTab)) {
    return (
      <Button
        data-name="publish-button"
        key="submit-button"
        type="submit"
        variant="primary"
        size="small"
        isLoading={isLoading}
        disabled={!hasPermission("/admin/products", "POST")}
      >
        {t("actions.publish")}
      </Button>
    );
  }

  return (
    <Button
      key="next-button"
      type="button"
      variant="primary"
      size="small"
      onClick={() => next(tab)}
      disabled={!hasPermission("/admin/products", "POST")}
    >
      {t("actions.continue")}
    </Button>
  );
};
