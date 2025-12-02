// import { HttpTypes } from "@medusajs/types";
// import { Button, Input, toast } from "@medusajs/ui";
// import { useTranslation } from "react-i18next";
// import * as zod from "zod";
// import { Form } from "../../../../../components/common/form";
// import { CountrySelect } from "../../../../../components/inputs/country-select";
// import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
// import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
// import { FormExtensionZone, useExtendableForm } from "../../../../../dashboard-app";
// import { useUpdateProduct } from "../../../../../hooks/api/products";
// import { useExtension } from "../../../../../providers/extension-provider";
// import { usePermission } from "../../../../../hooks/use-permission";
// import { getUpdatedFields } from "../../../../../utils/get-updated-fields";

// type ProductAttributesFormProps = {
//   product: HttpTypes.AdminProduct;
// };

// const dimension = zod
//   .union([zod.string(), zod.number()])
//   .transform(value => (value === "" ? null : Number(value)))
//   .optional()
//   .nullable();

// const ProductAttributesSchema = zod.object({
//   weight: dimension,
//   length: dimension,
//   width: dimension,
//   height: dimension,
//   mid_code: zod.string().optional(),
//   hs_code: zod.string().optional(),
//   origin_country: zod.string().optional(),
// });

// export const ProductAttributesForm = ({ product }: ProductAttributesFormProps) => {
//   const { t } = useTranslation();
//   const { handleSuccess } = useRouteModal();
//   const { getFormConfigs, getFormFields } = useExtension();

//   const configs = getFormConfigs("product", "attributes");
//   const fields = getFormFields("product", "attributes");

//   const form = useExtendableForm({
//     defaultValues: {
//       height: product.height ?? null,
//       width: product.width ?? null,
//       length: product.length ?? null,
//       weight: product.weight ?? null,
//       mid_code: product.mid_code ?? "",
//       hs_code: product.hs_code ?? "",
//       origin_country: product.origin_country ?? "",
//     },
//     schema: ProductAttributesSchema,
//     configs,
//     data: product,
//   });

//   const { mutateAsync, isPending } = useUpdateProduct(product.id);
//   const { hasPermission } = usePermission();

//   const handleSubmit = form.handleSubmit(async data => {
//     try {
//       // Prepare updated data
//       const updatedData = {
//         weight: data.weight ?? undefined,
//         length: data.length ?? undefined,
//         width: data.width ?? undefined,
//         height: data.height ?? undefined,
//         mid_code: data.mid_code,
//         hs_code: data.hs_code,
//         origin_country: data.origin_country,
//       };

//       // Original data for comparison
//       const originalData = {
//         weight: product.weight ?? null,
//         length: product.length ?? null,
//         width: product.width ?? null,
//         height: product.height ?? null,
//         mid_code: product.mid_code ?? "",
//         hs_code: product.hs_code ?? "",
//         origin_country: product.origin_country ?? "",
//       };

//       const changedFields = getUpdatedFields(originalData, updatedData);

//       if (Object.keys(changedFields).length === 0) {
//         toast.info("No changes detected");
//         handleSuccess();
//         return;
//       }

//       // Build final payload
//       const payload = {
//         ...updatedData, // Actual values
//         additional_data: {
//           changedValues: changedFields,
//           otherValues: data,
//           product_details: {
//             product_id: product.id,
//             product_title: product.title,
//             product_handle: product.handle,
//             product_status: product.status,
//           },
//         },
//       };

//       await mutateAsync(payload, {
//         onSuccess: () => {
//           handleSuccess();
//           toast.success("Product updated successfully");
//         },
//         onError: error => {
//           toast.error(error.message || "Failed to update product");
//         },
//       });
//     } catch (error: any) {
//       toast.error(error.message || "Something went wrong");
//     }
//   });
//   const dimensionFields: (keyof z.infer<typeof ProductAttributesSchema>)[] = [
//     "width",
//     "height",
//     "length",
//     "weight",
//   ];

//   return (
//     <RouteDrawer.Form form={form}>
//       <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
//         <RouteDrawer.Body>
//           <div className="flex h-full flex-col gap-y-8">
//             <div className="flex flex-col gap-y-4">
//               {dimensionFields.map(fieldName => (
//                 <Form.Field
//                   key={fieldName}
//                   control={form.control}
//                   name={fieldName as keyof z.infer<typeof ProductAttributesSchema>}
//                   render={({ field: { onChange, value, ...field } }) => (
//                     <Form.Item>
//                       <Form.Label>{t(`fields.${fieldName}`)}</Form.Label>
//                       <Form.Control>
//                         <Input
//                           type="number"
//                           min={0}
//                           value={value ?? ""}
//                           onChange={e => {
//                             const val = e.target.value;
//                             onChange(val === "" ? null : Number(val));
//                           }}
//                           {...field}
//                         />
//                       </Form.Control>
//                       <Form.ErrorMessage />
//                     </Form.Item>
//                   )}
//                 />
//               ))}

//               {dimensionFields.map(fieldName => (
//                 <Form.Field
//                   key={fieldName}
//                   control={form.control}
//                   name={fieldName as keyof z.infer<typeof ProductAttributesSchema>}
//                   render={({ field }) => (
//                     <Form.Item>
//                       <Form.Label>{t(`fields.${fieldName}`)}</Form.Label>
//                       <Form.Control>
//                         <Input {...field} />
//                       </Form.Control>
//                       <Form.ErrorMessage />
//                     </Form.Item>
//                   )}
//                 />
//               ))}

//               <Form.Field
//                 control={form.control}
//                 name="origin_country"
//                 render={({ field }) => (
//                   <Form.Item>
//                     <Form.Label>{t("fields.countryOfOrigin")}</Form.Label>
//                     <Form.Control>
//                       <CountrySelect {...field} />
//                     </Form.Control>
//                     <Form.ErrorMessage />
//                   </Form.Item>
//                 )}
//               />

//               <FormExtensionZone fields={fields} form={form} />
//             </div>
//           </div>
//         </RouteDrawer.Body>

//         <RouteDrawer.Footer>
//           <div className="flex items-center justify-end gap-x-2">
//             <RouteDrawer.Close asChild>
//               <Button size="small" variant="secondary">
//                 {t("actions.cancel")}
//               </Button>
//             </RouteDrawer.Close>
//             <Button
//               size="small"
//               type="submit"
//               isLoading={isPending}
//               disabled={!hasPermission("/admin/products", "POST")}
//             >
//               {t("actions.save")}
//             </Button>
//           </div>
//         </RouteDrawer.Footer>
//       </KeyboundForm>
//     </RouteDrawer.Form>
//   );
// };

import { HttpTypes } from "@medusajs/types";
import { Button, Input, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import * as zod from "zod";
import { Form } from "../../../../../components/common/form";
import { CountrySelect } from "../../../../../components/inputs/country-select";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { FormExtensionZone, useExtendableForm } from "../../../../../dashboard-app";
import { useUpdateProduct } from "../../../../../hooks/api/products";
import { useExtension } from "../../../../../providers/extension-provider";
import { usePermission } from "../../../../../hooks/use-permission";
import { getUpdatedFields } from "../../../../../utils/get-updated-fields";

type ProductAttributesFormProps = {
  product: HttpTypes.AdminProduct;
};

const dimension = zod
  .union([zod.string(), zod.number()])
  .transform(value => (value === "" ? null : Number(value)))
  .optional()
  .nullable();

const ProductAttributesSchema = zod.object({
  weight: dimension,
  length: dimension,
  width: dimension,
  height: dimension,
  mid_code: zod.string().optional(),
  hs_code: zod.string().optional(),
  origin_country: zod.string().optional(),
});

export const ProductAttributesForm = ({ product }: ProductAttributesFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { getFormConfigs, getFormFields } = useExtension();

  const configs = getFormConfigs("product", "attributes");
  const fields = getFormFields("product", "attributes");

  const form = useExtendableForm({
    defaultValues: {
      height: product.height ?? null,
      width: product.width ?? null,
      length: product.length ?? null,
      weight: product.weight ?? null,
      mid_code: product.mid_code ?? "",
      hs_code: product.hs_code ?? "",
      origin_country: product.origin_country ?? "",
    },
    schema: ProductAttributesSchema,
    configs,
    data: product,
  });

  const { mutateAsync, isPending } = useUpdateProduct(product.id);
  const { hasPermission } = usePermission();

  // ✅ Strongly typed field list
  const dimensionFields = ["width", "height", "length", "weight"] as const;
  type DimensionField = (typeof dimensionFields)[number];

  const handleSubmit = form.handleSubmit(async data => {
    try {
      const updatedData = {
        weight: data.weight ? data.weight : null,
        length: data.length ? data.length : null,
        width: data.width ? data.width : null,
        height: data.height ? data.height : null,
        mid_code: data.mid_code,
        hs_code: data.hs_code,
        origin_country: data.origin_country,
      };

      const originalData = {
        weight: product.weight ?? null,
        length: product.length ?? null,
        width: product.width ?? null,
        height: product.height ?? null,
        mid_code: product.mid_code ?? "",
        hs_code: product.hs_code ?? "",
        origin_country: product.origin_country ?? "",
      };

      const changedFields = getUpdatedFields(originalData, updatedData);

      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes detected");
        handleSuccess();
        return;
      }

      const payload = {
        ...updatedData,
        additional_data: {
          changedValues: changedFields,
          otherValues: data,
          product_details: {
            product_id: product.id,
            product_title: product.title,
            product_handle: product.handle,
            product_status: product.status,
          },
        },
      };

      await mutateAsync(payload, {
        onSuccess: () => {
          handleSuccess();
          toast.success("Product updated successfully");
        },
        onError: error => {
          toast.error(error.message || "Failed to update product");
        },
      });
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex h-full flex-col gap-y-8">
            <div className="flex flex-col gap-y-4">
              {/* ✅ Dimension Fields */}
              {dimensionFields.map(fieldName => (
                <Form.Field
                  key={String(fieldName)} // ✅ Fix 1: Convert symbol/string/number to string
                  control={form.control}
                  name={fieldName} // ✅ Fix 2: Narrowed literal type (matches schema)
                  render={({ field: { onChange, value, ...field } }) => (
                    <Form.Item>
                      <Form.Label>{t(`fields.${fieldName}` as const)}</Form.Label>
                      <Form.Control>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={value || ""}
                          onChange={e => {
                            const value = e.target.value;

                            if (value === "") {
                              onChange(null);
                            } else {
                              onChange(parseFloat(value));
                            }
                          }}
                          {...field}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              ))}

              {/* ✅ Other Fields */}
              <Form.Field
                control={form.control}
                name="mid_code"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>{t("fields.midCode")}</Form.Label>
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
                    <Form.Label>{t("fields.hsCode")}</Form.Label>
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
                    <Form.Label>{t("fields.countryOfOrigin")}</Form.Label>
                    <Form.Control>
                      <CountrySelect {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />

              <FormExtensionZone fields={fields} form={form} />
            </div>
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
