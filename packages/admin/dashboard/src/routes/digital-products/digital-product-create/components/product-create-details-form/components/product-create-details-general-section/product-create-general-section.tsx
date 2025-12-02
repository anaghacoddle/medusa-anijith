import { Input, Textarea, IconButton, toast } from "@medusajs/ui";
import { XMarkMini } from "@medusajs/icons";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useCallback, useState, useEffect } from "react";
import { Form } from "../../../../../../../components/common/form";
import { HandleInput } from "../../../../../../../components/inputs/handle-input";
import { useBrands } from "../../../../../../../hooks/api/brands";
import { DigitalProductCreateSchemaType } from "../../../../types";

type ProductCreateGeneralSectionProps = {
  form: UseFormReturn<DigitalProductCreateSchemaType>;
};

export const ProductCreateGeneralSection = ({ form }: ProductCreateGeneralSectionProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { brands: brandsData, isLoading: isLoadingBrands } = useBrands({
    q: searchQuery,
    limit: 10,
  });

  // Show individual toasts for each error
  const showErrorToasts = useCallback(
    (errors: Record<string, any>) => {
      const fieldLabels: Record<string, string> = {
        title: t("products.fields.title.label"),
        brand: t("products.fields.brand.label"),
        subtitle: t("products.fields.subtitle.label"),
        handle: t("fields.handle"),
        description: t("products.fields.description.label"),
      };

      toast.dismiss();

      Object.keys(errors).forEach(fieldName => {
        const error = errors[fieldName];
        if (error?.message) {
          const fieldLabel = fieldLabels[fieldName] || fieldName;
          toast.error(`${fieldLabel}: ${error.message}`, {
            id: `error-${fieldName}`,
          });
        }
      });
    },
    [t]
  );

  // Watch for form errors and show toasts
  useEffect(() => {
    const errors = form.formState.errors;
    if (form.formState.isSubmitted || Object.keys(errors).length > 0) {
      showErrorToasts(errors);
    }
  }, [form.formState.errors, form.formState.isSubmitted, showErrorToasts]);

  // --- Handler Functions (unchanged) ---
  const handleBrandSelect = (brand: { id: string; name: string }) => {
    setSelectedBrand(brand);
    setIsCreatingNew(false);
    setSearchQuery(""); // Clear the search query to close dropdown
    form.setValue("product.brand", brand.name);
    form.clearErrors("product.brand");
  };

  const handleCreateNew = () => {
    setSelectedBrand(null);
    setIsCreatingNew(true);
    form.setValue("product.brand", searchQuery);
    form.clearErrors("product.brand");
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (isCreatingNew) {
      form.setValue("product.brand", value);
    }
    // Clear validation errors when user starts typing
    if (value.trim()) {
      form.clearErrors("product.brand");
    }
  };

  return (
    <div id="general" className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-2">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Form.Field
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <Form.Item>
                <Form.Label>{t("products.fields.title.label")}*</Form.Label>
                <Form.Control>
                  <Input {...field} placeholder={t("products.fields.title.placeholder")} />
                </Form.Control>
                {fieldState.error && (
                  <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
                )}
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="product.subtitle"
            render={({ field, fieldState }) => (
              <Form.Item>
                <Form.Label optional>{t("products.fields.subtitle.label")}</Form.Label>
                <Form.Control>
                  <Input {...field} placeholder={t("products.fields.subtitle.placeholder")} />
                </Form.Control>
                {fieldState.error && (
                  <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
                )}
              </Form.Item>
            )}
          />
          {/* Handle Field */}
          <Form.Field
            control={form.control}
            name="product.handle"
            render={({ field, fieldState }) => (
              <Form.Item>
                <Form.Label tooltip={t("products.fields.handle.tooltip")} optional>
                  {t("fields.handle")}
                </Form.Label>
                <Form.Control>
                  <HandleInput {...field} placeholder={t("products.fields.handle.placeholder")} />
                </Form.Control>
                {fieldState.error && (
                  <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
                )}
              </Form.Item>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Form.Field
            control={form.control}
            name="product.brand"
            render={({ field, fieldState }) => {
              return (
                <Form.Item>
                  <Form.Label>{t("products.fields.brand.label")}*</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      placeholder={t("products.fields.brand.label")}
                      value={searchQuery}
                      onChange={e => handleInputChange(e.target.value)}
                      maxLength={50}
                    />
                  </Form.Control>
                  {fieldState.error && (
                    <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
                  )}

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
                            className="w-full text-left px-2 py-1 hover:bg-ui-bg-subtle-hover rounded text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-fg"
                            onClick={handleCreateNew}
                          >
                            + Create "{searchQuery}"
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-sm text-ui-fg-muted px-2 py-1">No brands found</div>
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
                          form.setValue("product.brand", "");
                        }}
                      >
                        <XMarkMini />
                      </IconButton>
                    </div>
                  )}

                  {/* Creating New Brand Display */}
                  {isCreatingNew && searchQuery && (
                    <div className="flex items-center justify-between px-2 py-1 bg-ui-bg-component rounded-md border border-ui-border-base">
                      <span className="text-sm text-ui-fg-base truncate flex-1">{searchQuery}</span>
                      <IconButton
                        size="small"
                        variant="transparent"
                        className="text-ui-fg-error hover:text-ui-fg-error-hover transition-fg flex-shrink-0"
                        onClick={() => {
                          setIsCreatingNew(false);
                          form.setValue("product.brand", "");
                        }}
                      >
                        <XMarkMini />
                      </IconButton>
                    </div>
                  )}
                </Form.Item>
              );
            }}
          />
        </div>
      </div>
      <Form.Field
        control={form.control}
        name="product.description"
        render={({ field, fieldState }) => {
          return (
            <Form.Item>
              <Form.Label optional>{t("products.fields.description.label")}</Form.Label>
              <Form.Control>
                <Textarea {...field} placeholder={t("products.fields.description.placeholder")} />
              </Form.Control>
              {fieldState.error && (
                <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
              )}
            </Form.Item>
          );
        }}
      />
    </div>
  );
};
