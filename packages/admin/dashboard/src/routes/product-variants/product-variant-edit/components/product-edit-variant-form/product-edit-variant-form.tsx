import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Divider, Heading, Input, Switch, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { HttpTypes } from "@medusajs/types";
import { Form } from "../../../../../components/common/form";
import { Combobox } from "../../../../../components/inputs/combobox";
import { CountrySelect } from "../../../../../components/inputs/country-select";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useUpdateProductVariant } from "../../../../../hooks/api/products";
import {
  transformNullableFormData,
  transformNullableFormNumber,
} from "../../../../../lib/form-helpers";
import { optionalInt } from "../../../../../lib/validation";
import { getUpdatedFields } from "../../../../../utils/get-updated-fields";

type ProductEditVariantFormProps = {
  product: HttpTypes.AdminProduct;
  variant: HttpTypes.AdminProductVariant;
};

const ProductEditVariantSchema = z.object({
  title: z.string().min(1),
  material: z.string().optional(),
  sku: z.string().optional(),
  ean: z.string().optional(),
  upc: z.string().optional(),
  barcode: z.string().min(8, "Barcode is required"),
  manage_inventory: z.boolean(),
  allow_backorder: z.boolean(),
  weight: optionalInt,
  height: optionalInt,
  width: optionalInt,
  length: optionalInt,
  mid_code: z.string().optional(),
  hs_code: z.string().optional(),
  origin_country: z.string().optional(),
  options: z.record(z.string()),
});

export const ProductEditVariantForm = ({ variant, product }: ProductEditVariantFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const defaultOptions = product.options?.reduce((acc: any, option: any) => {
    const varOpt = variant.options?.find((o: any) => o.option_id === option.id);
    acc[option.title] = varOpt?.value;
    return acc;
  }, {});

  const form = useForm<z.infer<typeof ProductEditVariantSchema>>({
    defaultValues: {
      title: variant.title || "",
      material: variant.material || "",
      sku: variant.sku || "",
      ean: variant.ean || "",
      upc: variant.upc || "",
      barcode: variant.barcode || "",
      manage_inventory: variant.manage_inventory || false,
      allow_backorder: variant.allow_backorder || false,
      weight: variant.weight || "",
      height: variant.height || "",
      width: variant.width || "",
      length: variant.length || "",
      mid_code: variant.mid_code || "",
      hs_code: variant.hs_code || "",
      origin_country: variant.origin_country || "",
      options: defaultOptions,
    },
    resolver: zodResolver(ProductEditVariantSchema),
  });

  const { mutateAsync, isPending } = useUpdateProductVariant(variant.product_id!, variant.id);

  const handleSubmit = form.handleSubmit(async data => {
    try {
      const {
        title,
        weight,
        height,
        width,
        length,
        allow_backorder,
        manage_inventory,
        options,
        ...optional
      } = data;

      const nullableData = transformNullableFormData(optional);

      // Prepare updated data
      const updatedData = {
        title,
        weight: transformNullableFormNumber(weight),
        height: transformNullableFormNumber(height),
        width: transformNullableFormNumber(width),
        length: transformNullableFormNumber(length),
        allow_backorder,
        manage_inventory,
        options,
        ...nullableData,
      };

      // Compute changed fields
      const changedFields = getUpdatedFields(
        {
          title: variant.title || "",
          material: variant.material || "",
          sku: variant.sku || "",
          ean: variant.ean || "",
          upc: variant.upc || "",
          barcode: variant.barcode || "",
          manage_inventory: variant.manage_inventory || false,
          allow_backorder: variant.allow_backorder || false,
          weight: variant.weight || null,
          height: variant.height || null,
          width: variant.width || null,
          length: variant.length || null,
          mid_code: variant.mid_code || "",
          hs_code: variant.hs_code || "",
          origin_country: variant.origin_country || "",
          options: defaultOptions,
        },
        updatedData
      );

      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes detected");
        handleSuccess("../");
        return;
      }

      // Build final payload like ProductBrandForm
      const additionalData: any = {
        additional_data: {
          changedValues: changedFields,
        },
      };

      // Include existing_variant_id (optional, useful for logs/tracking)
      additionalData.additional_data.existing_variant_id = variant.id;

      await mutateAsync(
        {
          id: variant.id,
          weight: transformNullableFormNumber(weight),
          height: transformNullableFormNumber(height),
          width: transformNullableFormNumber(width),
          length: transformNullableFormNumber(length),
          title,
          allow_backorder,
          manage_inventory,
          options,
          ...nullableData,
          additional_data: {
            changedValues: changedFields,
            existing_variant_id: variant.id,
          },
        },
        {
          onSuccess: () => {
            handleSuccess("../");
            toast.success(t("products.variant.edit.success"));
          },
          onError: error => {
            toast.error(error.message || "Failed to update variant");
          },
        }
      );
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  });

  const hasDigitalProduct = (variant as any).digital_product;

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex size-full flex-col overflow-hidden">
        <RouteDrawer.Body className="flex size-full flex-col gap-y-8 overflow-auto">
          {/* Basic Info */}
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="title"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.title")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="material"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.material")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            {product.options?.map((option: any) => (
              <Form.Field
                key={option.id}
                control={form.control}
                name={`options.${option.title}`}
                render={({ field: { value, onChange, ...field } }) => (
                  <Form.Item>
                    <Form.Label>{option.title}</Form.Label>
                    <Form.Control>
                      <Combobox
                        value={value}
                        onChange={v => onChange(v)}
                        {...field}
                        options={option.values.map((v: any) => ({
                          label: v.value,
                          value: v.value,
                        }))}
                      />
                    </Form.Control>
                  </Form.Item>
                )}
              />
            ))}
          </div>

          <Divider />

          {/* Inventory Section */}
          {!hasDigitalProduct && (
            <div className="flex flex-col gap-y-8">
              <div className="flex flex-col gap-y-4">
                <Heading level="h2">{t("products.variant.inventory.header")}</Heading>
                {["sku", "ean", "upc", "barcode"].map(fieldName => (
                  <Form.Field
                    key={fieldName}
                    control={form.control}
                    name={fieldName as keyof z.infer<typeof ProductEditVariantSchema>}
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label optional>{t(`fields.${fieldName}` as any)}</Form.Label>
                        <Form.Control>
                          <Input {...field} value={field.value as string} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                ))}
              </div>

              {/* Switch Controls */}
              <Form.Field
                control={form.control}
                name="manage_inventory"
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Form.Item>
                      <div className="flex flex-col gap-y-1">
                        <div className="flex items-center justify-between">
                          <Form.Label>
                            {t("products.variant.inventory.manageInventoryLabel")}
                          </Form.Label>
                          <Form.Control>
                            <Switch
                              dir="ltr"
                              checked={value}
                              className="rtl:rotate-180"
                              onCheckedChange={checked => onChange(!!checked)}
                              {...field}
                            />
                          </Form.Control>
                        </div>
                        <Form.Hint>{t("products.variant.inventory.manageInventoryHint")}</Form.Hint>
                      </div>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />

              <Form.Field
                control={form.control}
                name="allow_backorder"
                render={({ field: { value, onChange, ...field } }) => (
                  <Form.Item>
                    <div className="flex flex-col gap-y-1">
                      <div className="flex items-center justify-between">
                        <Form.Label>
                          {t("products.variant.inventory.allowBackordersLabel")}
                        </Form.Label>
                        <Form.Control>
                          <Switch
                            dir="ltr"
                            className="rtl:rotate-180"
                            checked={value}
                            onCheckedChange={checked => onChange(!!checked)}
                            {...field}
                          />
                        </Form.Control>
                      </div>
                      <Form.Hint>{t("products.variant.inventory.allowBackordersHint")}</Form.Hint>
                    </div>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
          )}

          {!hasDigitalProduct && <Divider />}

          {/* Attributes */}
          <div className="flex flex-col gap-y-4">
            <Heading level="h2">{t("products.attributes")}</Heading>
            {["weight", "width", "length", "height"].map(fieldName => (
              <Form.Field
                key={fieldName}
                control={form.control}
                name={fieldName as keyof z.infer<typeof ProductEditVariantSchema>}
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>{t(`fields.${fieldName}` as any)}</Form.Label>
                    <Form.Control>
                      <Input {...field} value={field.value as string} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            ))}

            <Form.Field
              control={form.control}
              name="mid_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.midCode")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="hs_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.hsCode")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="origin_country"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.countryOfOrigin")}</Form.Label>
                  <Form.Control>
                    <CountrySelect {...field} />
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
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
