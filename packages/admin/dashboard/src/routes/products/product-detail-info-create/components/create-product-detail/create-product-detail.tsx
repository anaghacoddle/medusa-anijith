import { Button, Textarea, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { HttpTypes } from "@medusajs/types";
import { Form } from "../../../../../components/common/form";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { useExtendableForm } from "../../../../../dashboard-app/forms/hooks";

import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { FormExtensionZone } from "../../../../../dashboard-app";
import { useExtension } from "../../../../../providers/extension-provider";
import { usePermission } from "../../../../../hooks/use-permission";

import { useEffect, useState } from "react";
import axios from "axios";

type EditProductFormProps = {
  product: HttpTypes.AdminProduct;
};

const EditProductSchema = zod.object({
  warning: zod.string().optional(),
  ingredients: zod.string().optional(),
  sustainability: zod.string().optional(),
  allergens: zod.string().optional(),
});

export const CreateProductForm = ({ product }: EditProductFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const { getFormFields, getFormConfigs } = useExtension();
  const fields = getFormFields("product", "edit");
  const configs = getFormConfigs("product", "edit");

  const { hasPermission } = usePermission();

  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState({
    warning: "",
    ingredients: "",
    sustainability: "",
    allergens: "",
  });

  useEffect(() => {
    const fetchProductDescription = async () => {
      try {
        const response = await axios.get(`/admin/product_description?product_id=${product.id}`, {
          withCredentials: true,
        });
        const data = response.data.product_descriptions?.[0];
        if (data) {
          // setInitialValues({
          //   warning: data.warning || "",
          //   ingredients: data.ingredients || "",
          //   sustainability: data.sustainability || "",
          //   allergens: data.allergens || "",
          // });
          const newValues = {
            warning: data.warning || "",
            ingredients: data.ingredients || "",
            sustainability: data.sustainability || "",
            allergens: data.allergens || "",
          };
          setInitialValues(newValues);
        }
      } catch (error) {
        console.error("Failed to fetch product description", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDescription();
  }, [product.id]);

  const form = useExtendableForm({
    defaultValues: initialValues,
    schema: EditProductSchema,
    configs: configs,
    data: {},
  });

  useEffect(() => {
    if (!loading) {
      form.reset(initialValues);
    }
  }, [initialValues, loading, form]);

  const handleSubmit = form.handleSubmit(async data => {
    try {
      // Step 1: Detect changed values compared to initialValues
      const changedValues: Partial<typeof initialValues> = {};

      (Object.keys(data) as (keyof typeof initialValues)[]).forEach(key => {
        if (data[key] !== initialValues[key]) {
          changedValues[key] = data[key];
        }
      });

      if (Object.keys(changedValues).length === 0) {
        toast.info("No changes detected.");
        return;
      }

      // Step 2: Build payload with extra info
      const payload = {
        product_id: product.id,
        warning: data.warning,
        ingredients: data.ingredients,
        sustainability: data.sustainability,
        allergens: data.allergens,
        additional_data: {
          product: {
            id: product.id,
            title: product.title,
            handle: product.handle,
            description: product.description,
            thumbnail: product.thumbnail,
          },
          changedValues,
        },
      };

      // Step 3: Send API request
      await axios.put("/admin/product_description", payload, {
        withCredentials: true,
      });

      toast.success(t("general.success", "Product description added successfully"));
      handleSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to add product description");
    }
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-y-auto">
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-4">
              {["warning", "ingredients", "sustainability", "allergens"].map(field => (
                <Form.Field
                  key={field}
                  control={form.control}
                  name={field as keyof zod.infer<typeof EditProductSchema>}
                  render={({ field: zField }) => (
                    <Form.Item>
                      <Form.Label optional>{t(`products.fields.${field}.label`, field)}</Form.Label>
                      <Form.Control>
                        <Textarea {...zField} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              ))}
            </div>
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
              isLoading={form.formState.isSubmitting}
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
