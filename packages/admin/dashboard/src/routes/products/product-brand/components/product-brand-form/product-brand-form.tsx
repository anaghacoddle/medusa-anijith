import { zodResolver } from "@hookform/resolvers/zod";
import { HttpTypes } from "@medusajs/types";
import { Button, Input, toast, IconButton } from "@medusajs/ui";
import { XMarkMini } from "@medusajs/icons";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import * as zod from "zod";

import { Form } from "../../../../../components/common/form";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useBrands } from "../../../../../hooks/api/brands";
import { usePermission } from "../../../../../hooks/use-permission";
import { useUpdateProduct } from "../../../../../hooks/api";
import { getUpdatedFields } from "../../../../../utils/get-updated-fields";

type ProductBrandFormProps = {
  product: HttpTypes.AdminProduct & {
    brand?: {
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
  };
};

const ProductBrandSchema = zod.object({
  brand_name: zod.string().min(1, "Brand name is required"),
});

export const ProductBrandForm = ({ product }: ProductBrandFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<{ id: string; name: string } | null>(
    product.brand ? { id: product.brand.id, name: product.brand.name } : null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { brands: brandsData, isLoading: isLoadingBrands } = useBrands({
    q: searchQuery,
    limit: 10,
  });

  const updateProductMutation = useUpdateProduct(product.id);

  const form = useForm<zod.infer<typeof ProductBrandSchema>>({
    defaultValues: {
      brand_name: product.brand?.name || "",
    },
    resolver: zodResolver(ProductBrandSchema),
  });

  const { hasPermission } = usePermission();

  const handleSubmit = form.handleSubmit(async data => {
    try {
      const brandName = selectedBrand ? selectedBrand.name : data.brand_name;
      const changedFields = getUpdatedFields(product, { brand: brandName });
      const { additional_data, ...rest } = changedFields;
      const changedValues = { ...rest };

      const additionalData: any = {
        additional_data: {
          brand: brandName,
          changedValues,
        },
      };

      // Add existing_brand_id if there's a current brand and we're changing it
      if (product.brand && (!selectedBrand || selectedBrand.id !== product.brand.id)) {
        additionalData.additional_data.existing_brand_id = product.brand.id;
      }

      await updateProductMutation.mutateAsync({
        // 'additional_data' is not a valid property, so we need to spread the additionalData directly
        ...additionalData,
      });

      toast.success(t("products.brand.edit.toasts.success"));
      handleSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update brand");
    }
  });

  const handleBrandSelect = (brand: { id: string; name: string }) => {
    setSelectedBrand(brand);
    setIsCreatingNew(false);
    setSearchQuery(""); // Clear the search query to close dropdown
    form.setValue("brand_name", brand.name);
    form.clearErrors("brand_name");
  };

  const handleCreateNew = () => {
    setSelectedBrand(null);
    setIsCreatingNew(true);
    form.setValue("brand_name", searchQuery);
    form.clearErrors("brand_name");
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (isCreatingNew) {
      form.setValue("brand_name", value);
    }
    // Clear validation errors when user starts typing
    if (value.trim()) {
      form.clearErrors("brand_name");
    }
  };

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex h-full flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="brand_name"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("products.fields.brand.label")}</Form.Label>
                    <Form.Control>
                      <Input
                        {...field}
                        placeholder={t("products.fields.brand.label")}
                        value={searchQuery}
                        onChange={e => handleInputChange(e.target.value)}
                        maxLength={50}
                      />
                    </Form.Control>

                    {/* Search Results */}
                    {searchQuery && !isCreatingNew && (
                      <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                        {isLoadingBrands ? (
                          <div className="text-sm text-ui-fg-muted px-2 py-1">Loading...</div>
                        ) : brandsData && brandsData.length > 0 ? (
                          <div className="space-y-1">
                            {brandsData.map(brand => (
                              <button
                                key={brand.id}
                                type="button"
                                className="w-full text-left px-2 py-1 hover:bg-ui-bg-subtle-hover rounded text-sm text-ui-fg-base transition-fg break-words"
                                onClick={() => handleBrandSelect(brand)}
                              >
                                {brand.name}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="w-full text-left px-2 py-1 hover:bg-ui-bg-subtle-hover rounded text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-fg break-words"
                              onClick={handleCreateNew}
                            >
                              + Create "{searchQuery}"
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-sm text-ui-fg-muted px-2 py-1">
                              No brands found
                            </div>
                            <button
                              type="button"
                              className="w-full text-left px-2 py-1 hover:bg-ui-bg-subtle-hover rounded text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-fg break-words"
                              onClick={handleCreateNew}
                            >
                              + Create "{searchQuery}"
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected Brand Display */}
                    {selectedBrand && (
                      <div className="flex items-center justify-between px-2 py-1 bg-ui-bg-component rounded-md border border-ui-border-base">
                        <span className="text-sm text-ui-fg-base truncate flex-1">
                          {selectedBrand.name}
                        </span>
                        <IconButton
                          size="small"
                          variant="transparent"
                          className="text-ui-fg-error hover:text-ui-fg-error-hover transition-fg flex-shrink-0"
                          onClick={() => {
                            setSelectedBrand(null);
                            setIsCreatingNew(false);
                            form.setValue("brand_name", "");
                          }}
                        >
                          <XMarkMini />
                        </IconButton>
                      </div>
                    )}

                    {/* Creating New Brand Display */}
                    {isCreatingNew && searchQuery && (
                      <div className="flex items-center justify-between px-2 py-1 bg-ui-bg-component rounded-md border border-ui-border-base">
                        <span className="text-sm text-ui-fg-base truncate flex-1">
                          {searchQuery}
                        </span>
                        <IconButton
                          size="small"
                          variant="transparent"
                          className="text-ui-fg-error hover:text-ui-fg-error-hover transition-fg flex-shrink-0"
                          onClick={() => {
                            setIsCreatingNew(false);
                            form.setValue("brand_name", "");
                          }}
                        >
                          <XMarkMini />
                        </IconButton>
                      </div>
                    )}
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
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
            <Button
              size="small"
              type="submit"
              disabled={
                !hasPermission("/admin/products", "POST") || updateProductMutation.isPending
              }
              isLoading={updateProductMutation.isPending}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
