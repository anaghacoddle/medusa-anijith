import { HttpTypes } from "@medusajs/types";
import { Button, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "../../../../../components/common/form";
import { Combobox } from "../../../../../components/inputs/combobox";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { FormExtensionZone, useExtendableForm } from "../../../../../dashboard-app";
import { useUpdateProduct } from "../../../../../hooks/api/products";
import { useComboboxData } from "../../../../../hooks/use-combobox-data";
import { sdk } from "../../../../../lib/client";
import { useExtension } from "../../../../../providers/extension-provider";
import { CategoryCombobox } from "../../../common/components/category-combobox";
import { usePermission } from "../../../../../hooks/use-permission";

type ProductOrganizationFormProps = {
  product: HttpTypes.AdminProduct;
};

// ✅ Validation schema
const ProductOrganizationSchema = zod.object({
  type_id: zod.string().nullable(),
  collection_id: zod.string().nullable(),
  category_ids: zod.array(zod.string()),
  tag_ids: zod.array(zod.string()),
});

// ✅ Utility to detect changed fields
const getUpdatedFields = (original: any, updated: any) => {
  const changes: Record<string, any> = {};
  for (const key in updated) {
    if (Array.isArray(updated[key])) {
      const origArray = original[key] || [];
      const updatedArray = updated[key] || [];
      if (JSON.stringify(origArray.sort()) !== JSON.stringify(updatedArray.sort())) {
        changes[key] = updated[key];
      }
    } else if (original[key] !== updated[key]) {
      changes[key] = updated[key];
    }
  }
  return changes;
};

// ✅ Utility to map IDs to names
const getNamesFromIds = (
  ids: string[],
  list: { label?: string; value?: string; id?: string; name?: string }[]
) =>
  ids.map(id => {
    const found = list.find(item => item.value === id || item.id === id);
    return found
      ? { id: found.value || found.id, name: found.label || found.name || "" }
      : { id, name: "" };
  });

export const ProductOrganizationForm = ({ product }: ProductOrganizationFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { getFormConfigs, getFormFields } = useExtension();
  const { hasPermission } = usePermission();

  const configs = getFormConfigs("product", "organize");
  const fields = getFormFields("product", "organize");

  // ✅ Load combobox data
  const collections = useComboboxData({
    queryKey: ["product_collections"],
    queryFn: params => sdk.admin.productCollection.list(params),
    getOptions: data =>
      data.collections.map(collection => ({
        label: collection.title!,
        value: collection.id!,
      })),
  });

  const types = useComboboxData({
    queryKey: ["product_types"],
    queryFn: params => sdk.admin.productType.list(params),
    getOptions: data =>
      data.product_types.map(type => ({
        label: type.value,
        value: type.id,
      })),
  });

  const tags = useComboboxData({
    queryKey: ["product_tags"],
    queryFn: params => sdk.admin.productTag.list(params),
    getOptions: data =>
      data.product_tags.map(tag => ({
        label: tag.value,
        value: tag.id,
      })),
  });

  const form = useExtendableForm({
    defaultValues: {
      type_id: product.type_id ?? null,
      collection_id: product.collection_id ?? null,
      category_ids: product.categories?.map(c => c.id) || [],
      tag_ids: product.tags?.map(t => t.id) || [],
    },
    schema: ProductOrganizationSchema,
    configs,
    data: product,
  });

  const { mutateAsync, isPending } = useUpdateProduct(product.id);

  // ✅ Handle form submission
  const handleSubmit = form.handleSubmit(async data => {
    try {
      // Step 1: Detect changed fields
      const changedValues = getUpdatedFields(
        {
          type_id: product.type_id ?? null,
          collection_id: product.collection_id ?? null,
          category_ids: product.categories?.map(c => c.id) || [],
          tag_ids: product.tags?.map(t => t.id) || [],
        },
        data
      );

      if (Object.keys(changedValues).length === 0) {
        toast.info("No changes detected.");
        return;
      }

      // Step 2: Prepare enriched names from combobox options
      const enrichedChanges: Record<string, any> = {};

      if (changedValues.type_id) {
        const type = types.options.find(t => t.value === changedValues.type_id);
        enrichedChanges.type = type ? { id: type.value, name: type.label } : null;
      }

      if (changedValues.collection_id) {
        const collection = collections.options.find(c => c.value === changedValues.collection_id);
        enrichedChanges.collection = collection
          ? { id: collection.value, name: collection.label }
          : null;
      }

      if (changedValues.category_ids?.length) {
        enrichedChanges.categories = getNamesFromIds(
          changedValues.category_ids,
          product.categories || []
        );
      }

      if (changedValues.tag_ids?.length) {
        enrichedChanges.tags = getNamesFromIds(changedValues.tag_ids, tags.options);
      }

      // Step 3: Build payload
      const payload: any = {
        type_id: data.type_id || null,
        collection_id: data.collection_id || null,
        categories: data.category_ids.map(c => ({ id: c })),
        tags: data.tag_ids.map(t => ({ id: t })),
        additional_data: {
          product: {
            id: product.id,
            title: product.title,
            handle: product.handle,
            description: product.description,
            thumbnail: product.thumbnail,
          },
          changedValues: enrichedChanges,
        },
      };

      // Step 4: Send update
      await mutateAsync(payload, {
        onSuccess: ({ product }) => {
          toast.success(t("products.organization.edit.toasts.success", { title: product.title }));
          handleSuccess();
        },
        onError: error => {
          toast.error(error.message);
        },
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update product organization details.");
    }
  });

  // ✅ UI
  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex h-full flex-col gap-y-4">
            {/* Type */}
            <Form.Field
              control={form.control}
              name="type_id"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("products.fields.type.label")}</Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      options={types.options}
                      searchValue={types.searchValue}
                      onSearchValueChange={types.onSearchValueChange}
                      fetchNextPage={types.fetchNextPage}
                      allowClear={true}
                      onChange={value => field.onChange(value || null)}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            {/* Collection */}
            <Form.Field
              control={form.control}
              name="collection_id"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("products.fields.collection.label")}</Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      multiple={false}
                      options={collections.options}
                      onSearchValueChange={collections.onSearchValueChange}
                      searchValue={collections.searchValue}
                      allowClear={true}
                      onChange={value => field.onChange(value || null)}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            {/* Categories */}
            <Form.Field
              control={form.control}
              name="category_ids"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("products.fields.categories.label")}</Form.Label>
                  <Form.Control>
                    <CategoryCombobox {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            {/* Tags */}
            <Form.Field
              control={form.control}
              name="tag_ids"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("products.fields.tags.label")}</Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      multiple
                      options={tags.options}
                      onSearchValueChange={tags.onSearchValueChange}
                      searchValue={tags.searchValue}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <FormExtensionZone fields={fields} form={form} />
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              disabled={!hasPermission("/admin/products", "POST")}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
