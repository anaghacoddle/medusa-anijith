import { zodResolver } from "@hookform/resolvers/zod";
import { HttpTypes } from "@medusajs/types";
import { Button, Input, Select, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { RouteDrawer, useRouteModal } from "../../../../../../components/modals";
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form";
import { Form } from "../../../../../../components/common/form";
import { useUpdateLoyaltyConfig } from "../../../../../../hooks/api/loyaltyConfig";
import { useEffect } from "react";

type EditStoreFormProps = {
  loyaltyConfig: {
    id: string;
    conversion_rate: number;
  };
};

const EditLoyaltySchema = z.object({
  id: z.string().min(1),
  conversion_rate: z.number().min(0.01, "Conversion rate must be greater than 0"),
});

export const LoyaltyEditForm = ({ loyaltyConfig }: EditStoreFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<z.infer<typeof EditLoyaltySchema>>({
    defaultValues: {
      id: "",
      conversion_rate: 0,
    },
    resolver: zodResolver(EditLoyaltySchema),
  });

  useEffect(() => {
    if (loyaltyConfig) {
      form.reset({
        id: loyaltyConfig.id,
        conversion_rate: loyaltyConfig.conversion_rate,
      });
    }
  }, [loyaltyConfig, form]);

  const { mutateAsync, isPending } = useUpdateLoyaltyConfig();

  const handleSubmit = form.handleSubmit(async values => {
    try {
      await mutateAsync(values as any);
      toast.success("Loyalty configuration updated successfully");
      handleSuccess();
    } catch (error: any) {
      console.error("API error:", error.response?.data || error.message);
      toast.error("Failed to update loyalty configuration");
    }
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm className="flex h-full flex-col" onSubmit={handleSubmit}>
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Conversion Rate</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...form.register("conversion_rate", {
                  valueAsNumber: true,
                })}
                className="border rounded-md px-3 py-2 text-sm"
              />
              {form.formState.errors.conversion_rate && (
                <span className="text-red-500 text-xs mt-1">
                  {form.formState.errors.conversion_rate.message?.toString()}
                </span>
              )}
            </div>
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild withoutConfirm>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" isLoading={isPending} type="submit">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
