import { HttpTypes } from "@medusajs/types";
import { Button, ProgressStatus, ProgressTabs, toast } from "@medusajs/ui";
import { useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { RouteFocusModal, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useExtendableForm } from "../../../../../dashboard-app/forms/hooks";
import { useCreateProduct } from "../../../../../hooks/api/products";
import { sdk } from "../../../../../lib/client";
import { useExtension } from "../../../../../providers/extension-provider";
import { PRODUCT_CREATE_FORM_DEFAULTS, ProductCreateSchema } from "../../constants";
import { normalizeProductFormValues } from "../../utils";
import { ProductCreateDetailsForm } from "../product-create-details-form";
import { ProductCreateInventoryKitForm } from "../product-create-inventory-kit-form";
import { ProductCreateOrganizeForm } from "../product-create-organize-form";
import { ProductCreateVariantsForm } from "../product-create-variants-form";
import { usePermission } from "../../../../../hooks/use-permission";
import { useDocumentDirection } from "../../../../../hooks/use-document-direction";

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
  const direction = useDocumentDirection();
  const form = useExtendableForm({
    defaultValues: {
      ...PRODUCT_CREATE_FORM_DEFAULTS,
      sales_channels: defaultChannel ? [{ id: defaultChannel.id, name: defaultChannel.name }] : [],
    },
    schema: ProductCreateSchema,
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

  /**
   * TODO: Important to revisit this - use variants watch so high in the tree can cause needless rerenders of the entire page
   * which is suboptimal when rerenders are caused by bulk editor changes
   */

  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
  });

  const showInventoryTab = useMemo(
    () => watchedVariants.some(v => v.manage_inventory && v.inventory_kit),
    [watchedVariants]
  );

  const handleSubmit = form.handleSubmit(async (values, e) => {
    let isDraftSubmission = false;
    if (e?.nativeEvent instanceof SubmitEvent) {
      const submitter = e?.nativeEvent?.submitter as HTMLButtonElement;
      isDraftSubmission = submitter.dataset.name === SAVE_DRAFT_BUTTON;
    }

    const media = values.media || [];
    const payload = { ...values, media: undefined };

    // Separate file uploads from embed videos
    const fileMedia = media.filter(m => m.mediaType === "file" && m.file);
    const embedMedia = media.filter(m => m.mediaType === "embed");

    let uploadedMedia: HttpTypes.AdminFile[] = [];
    try {
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
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }

    // Find the thumbnail from the original media
    const thumbnailMedia = media.find(m => m.isThumbnail);

    // If no thumbnail is selected, set the first available media as thumbnail
    if (!thumbnailMedia) {
      if (fileMedia.length > 0) {
        // Set first file (image/video) as thumbnail
        fileMedia[0].isThumbnail = true;
      } else if (embedMedia.length > 0) {
        // Set first embed video as thumbnail
        embedMedia[0].isThumbnail = true;
      }
    }

    // Create a combined media array with both uploaded files and embed videos
    const combinedMedia = [
      ...uploadedMedia.map(file => ({
        ...file,
        isThumbnail: file.url === thumbnailMedia?.url,
        mediaType: "file" as const,
      })),
      ...embedMedia.map(embed => ({
        id: embed.id || Math.random().toString(36).substring(7),
        url: embed.url,
        isThumbnail: embed.isThumbnail,
        mediaType: "embed" as const,
        embedCode: embed.embedCode,
        thumbnailUrl: embed.thumbnailUrl, // Include thumbnail URL
        videoTitle: embed.videoTitle, // Include video title
      })),
    ];

    // Ensure only one item is marked as thumbnail
    const thumbnailItems = combinedMedia.filter(m => m.isThumbnail);
    if (thumbnailItems.length > 1) {
      // Keep only the first thumbnail, mark others as false
      let firstThumbnailFound = false;
      combinedMedia.forEach(item => {
        if (item.isThumbnail) {
          if (firstThumbnailFound) {
            item.isThumbnail = false;
          } else {
            firstThumbnailFound = true;
          }
        }
      });
    }

    await mutateAsync(
      normalizeProductFormValues({
        ...payload,
        media: combinedMedia,
        status: (isDraftSubmission ? "draft" : "published") as any,
        regionsCurrencyMap,
      }),
      {
        onSuccess: data => {
          toast.success(
            t("products.create.successToast", {
              title: data.product.title,
            })
          );

          handleSuccess(`../${data.product.id}`);
        },
        onError: error => {
          toast.error(error.message);
        },
      }
    );
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
    const currentState = { ...tabState };
    if (tab === Tab.DETAILS) {
      currentState[Tab.DETAILS] = "in-progress";
    }
    if (tab === Tab.ORGANIZE) {
      currentState[Tab.DETAILS] = "completed";
      currentState[Tab.ORGANIZE] = "in-progress";
    }
    if (tab === Tab.VARIANTS) {
      currentState[Tab.DETAILS] = "completed";
      currentState[Tab.ORGANIZE] = "completed";
      currentState[Tab.VARIANTS] = "in-progress";
    }
    if (tab === Tab.INVENTORY) {
      currentState[Tab.DETAILS] = "completed";
      currentState[Tab.ORGANIZE] = "completed";
      currentState[Tab.VARIANTS] = "completed";
      currentState[Tab.INVENTORY] = "in-progress";
    }

    setTabState({ ...currentState });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only want this effect to run when the tab changes
  }, [tab]);

  const { hasPermission } = usePermission();

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onKeyDown={e => {
          // We want to continue to the next tab on enter instead of saving as draft immediately
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
          dir={direction}
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
                {showInventoryTab && (
                  <ProgressTabs.Trigger
                    status={tabState[Tab.INVENTORY]}
                    value={Tab.INVENTORY}
                    className="max-w-[200px] truncate"
                  >
                    {t("products.create.tabs.inventory")}
                  </ProgressTabs.Trigger>
                )}
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
            {showInventoryTab && (
              <ProgressTabs.Content className="size-full overflow-y-auto" value={Tab.INVENTORY}>
                <ProductCreateInventoryKitForm form={form} />
              </ProgressTabs.Content>
            )}
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
              showInventoryTab={showInventoryTab}
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
  showInventoryTab: boolean;
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
