import { HttpTypes } from "@medusajs/types";
import { Button, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import * as zod from "zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "../../../../../components/common/form";
import { Combobox } from "../../../../../components/inputs/combobox";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useUpdateProduct } from "../../../../../hooks/api/products";
import { useComboboxData } from "../../../../../hooks/use-combobox-data";
import { sdk } from "../../../../../lib/client";
import { getUpdatedFields } from "../../../../../utils/get-updated-fields";

type ProductShippingProfileFormProps = {
  product: HttpTypes.AdminProduct & {
    shipping_profile?: HttpTypes.AdminShippingProfile;
  };
};

const ProductShippingProfileSchema = zod.object({
  shipping_profile_id: zod.string(),
});

export const ProductShippingProfileForm = ({ product }: ProductShippingProfileFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const shippingProfiles = useComboboxData({
    queryKey: ["shipping_profiles"],
    queryFn: params => sdk.admin.shippingProfile.list(params),
    getOptions: data =>
      data.shipping_profiles.map(shippingProfile => ({
        label: shippingProfile.name,
        value: shippingProfile.id,
      })),
  });

  const form = useForm({
    defaultValues: {
      shipping_profile_id: product.shipping_profile?.id ?? "",
    },
    resolver: zodResolver(ProductShippingProfileSchema),
  });

  const selectedShippingProfile = form.watch("shipping_profile_id");
  const { mutateAsync, isPending } = useUpdateProduct(product.id);

  const handleSubmit = form.handleSubmit(async data => {
    const newProfileId = data.shipping_profile_id === "" ? null : data.shipping_profile_id;
    const oldProfileId = product.shipping_profile?.id ?? null;

    // find the selected profile name
    const selectedProfile = shippingProfiles.options.find(option => option.value === newProfileId);

    // find the old profile name
    const oldProfile = shippingProfiles.options.find(option => option.value === oldProfileId);

    // ✅ compute changed fields
    const changedValues = getUpdatedFields(
      { shipping_profile: oldProfile?.label ?? null },
      { shipping_profile: selectedProfile?.label ?? null }
    );

    // ✅ prepare payload
    const payload = {
      shipping_profile_id: newProfileId,
      additional_data: {
        changedValues,
        otherValues: {
          shipping_profile_id: newProfileId,
          shipping_profile_name: selectedProfile?.label ?? "",
        },
      },
    };

    await mutateAsync(payload, {
      onSuccess: ({ product }) => {
        if (newProfileId !== oldProfileId) {
          toast.success(
            t("products.shippingProfile.edit.toasts.success", {
              title: product.title,
            })
          );
        }
        handleSuccess();
      },
      onError: error => {
        toast.error(error.message);
      },
    });
  });

  // Reset to empty if undefined
  useEffect(() => {
    if (typeof selectedShippingProfile === "undefined") {
      form.setValue("shipping_profile_id", "");
    }
  }, [selectedShippingProfile, form]);

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex h-full flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="shipping_profile_id"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("products.fields.shipping_profile.label")}</Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      allowClear
                      options={shippingProfiles.options}
                      searchValue={shippingProfiles.searchValue}
                      onSearchValueChange={shippingProfiles.onSearchValueChange}
                      fetchNextPage={shippingProfiles.fetchNextPage}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
