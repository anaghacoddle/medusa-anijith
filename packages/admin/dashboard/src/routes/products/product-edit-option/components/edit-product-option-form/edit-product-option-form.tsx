import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { HttpTypes } from "@medusajs/types";
import { Form } from "../../../../../components/common/form";
import { ChipInput } from "../../../../../components/inputs/chip-input";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useUpdateProductOption } from "../../../../../hooks/api/products";
import { usePermission } from "../../../../../hooks/use-permission";
import { getUpdatedFields } from "../../../../../utils/get-updated-fields"; // ✅ same utility as ProductAttributesForm

type EditProductOptionFormProps = {
  option: HttpTypes.AdminProductOption;
};

const CreateProductOptionSchema = z.object({
  title: z.string().min(1),
  values: z.array(z.string()).optional(),
});

export const CreateProductOptionForm = ({ option }: EditProductOptionFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<z.infer<typeof CreateProductOptionSchema>>({
    defaultValues: {
      title: option.title,
      values: option.values?.map(v => v.value) ?? [],
    },
    resolver: zodResolver(CreateProductOptionSchema),
  });
  const productId = option.product_id!;

  const { mutateAsync, isPending } = useUpdateProductOption(productId, option.id);
  const { hasPermission } = usePermission();

  const handleSubmit = form.handleSubmit(async values => {
    try {
      const updatedData = {
        title: values.title,
        values: values.values || [],
      };

      const originalData = {
        title: option.title,
        values: option.values?.map(v => v.value) ?? [],
      };

      // 🔍 Detect changed fields
      const changedFields = getUpdatedFields(originalData, updatedData);

      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes detected");
        handleSuccess();
        return;
      }

      // 🧱 Build final payload
      const payload = {
        id: option.id,
        ...updatedData,
        additional_data: {
          changedValues: changedFields,
          otherValues: values,
          product_details: {
            product_id: option.product_id,
          },
        },
      };

      await mutateAsync(payload, {
        onSuccess: () => {
          handleSuccess();
          toast.success("Option updated successfully");
        },
        onError: error => {
          toast.error(error.message || "Failed to update option");
        },
      });
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
          {/* Title Field */}
          <Form.Field
            control={form.control}
            name="title"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("products.fields.options.optionTitle")}</Form.Label>
                <Form.Control>
                  <Input
                    {...field}
                    placeholder={t("products.fields.options.optionTitlePlaceholder")}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          {/* Values Field */}
          <Form.Field
            control={form.control}
            name="values"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("products.fields.options.variations")}</Form.Label>
                <Form.Control>
                  <ChipInput
                    {...field}
                    placeholder={t("products.fields.options.variantionsPlaceholder")}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </RouteDrawer.Body>

        {/* Footer */}
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              type="submit"
              size="small"
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
