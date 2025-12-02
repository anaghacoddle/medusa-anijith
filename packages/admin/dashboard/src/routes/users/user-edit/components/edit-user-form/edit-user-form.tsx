import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { HttpTypes } from "@medusajs/types";
import { Form } from "../../../../../components/common/form";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useUpdateUser } from "../../../../../hooks/api/users";
import { useRbacRoles } from "../../../../../hooks/api/rbac";
import { encryptObject } from "../../../../../utils/encryption";
import { countries } from "../../../../../lib/data/countries";
import * as Select from "@radix-ui/react-select";
import { Combobox } from "../../../../../components/inputs/combobox";
import { useMemo } from "react";

interface ExtendedAdminUser extends HttpTypes.AdminUser {
  address?: string;
  country?: string;
  phone?: string;
  role_id?: string;
}

type EditUserFormProps = {
  user: ExtendedAdminUser;
};

const EditUserFormSchema = zod.object({
  first_name: zod
    .string()
    .regex(/^[A-Za-z]+$/, { message: "First name must contain only letters" })
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name must be at most 50 characters" }),
  // .or(zod.literal("")),
  last_name: zod
    .string()
    .min(1, { message: "Last name is required" })
    .max(50, { message: "Last name must be at most 50 characters" })
    .regex(/^[A-Za-z]+$/, { message: "Last name must contain only letters" }),
  email: zod.string().email().optional(),
  address: zod.string().optional(),
  country: zod.string().optional(),
  phone: zod
    .string()
    .regex(/^\d{7,15}$/, { message: "Phone number must be valid one" })
    .optional()
    .or(zod.literal("")),
  role_id: zod.string().optional(),
});

export const EditUserForm = ({ user }: EditUserFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { roles } = useRbacRoles();

  const form = useForm<zod.infer<typeof EditUserFormSchema>>({
    defaultValues: {
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      address: user.address || "",
      country: user.country || "",
      phone: user.phone || "",
      role_id: user.role_id || "",
    },
    resolver: zodResolver(EditUserFormSchema),
  });

  const { mutateAsync, isPending } = useUpdateUser(user.id);

  const handleSubmit = form.handleSubmit(async values => {
    const { first_name, last_name, address, country, phone, role_id } = values;

    const payload: {
      first_name?: string;
      last_name?: string;
      metadata: {
        address?: string;
        country?: string;
        phone?: string;
        role_id?: string;
      };
    } = {
      first_name,
      last_name,
      metadata: {
        address,
        country,
        phone,
        role_id,
      },
    };

    const encryptedPayload = await encryptObject(payload, ["role_id"]);

    await mutateAsync(encryptedPayload, {
      onSuccess: () => {
        handleSuccess();
        toast.success("User updated successfully");
      },
    });
  });

  const roleOptions = useMemo(() => {
    return (
      roles?.map(role => ({
        value: role.id,
        label: role.name,
      })) || []
    );
  }, [roles]);

  const countryOptions = useMemo(() => {
    return (
      countries?.map(country => ({
        value: country.iso_2.toLowerCase(),
        label: country.display_name,
      })) || []
    );
  }, []);

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <RouteDrawer.Body className="flex max-w-full flex-1 flex-col gap-y-8 overflow-y-auto">
          <Form.Field
            control={form.control}
            name="first_name"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>{t("fields.firstName")}</Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="Enter the first name" />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />
          <Form.Field
            control={form.control}
            name="last_name"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>{t("fields.lastName")}</Form.Label>
                  <Form.Control>
                    <Input {...field} placeholder="Enter the last name" />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              );
            }}
          />
          <Form.Field
            control={form.control}
            name="email"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.email")}</Form.Label>
                <Form.Control>
                  <Input type="email" {...field} disabled />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="phone"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.phone")}</Form.Label>
                <Form.Control>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 select-none text-gray-400 z-10">
                      {" "}
                      +61
                    </span>
                    <Input
                      {...field}
                      className="pl-12" // Add left padding to prevent overlap
                      placeholder="Enter phone number"
                    />
                  </div>
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />

          <Form.Field
            control={form.control}
            name="address"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.address")}</Form.Label>
                <Form.Control>
                  <Textarea {...field} placeholder="Enter full address" />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Field
              control={form.control}
              name="country"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.country")}</Form.Label>
                  <Form.Control>
                    <Combobox
                      value={field.value}
                      onChange={field.onChange}
                      options={countryOptions}
                      placeholder="Select a country"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.role")}</Form.Label>
                  <Form.Control>
                    <Combobox
                      value={field.value}
                      onChange={field.onChange}
                      options={roleOptions}
                      placeholder="Select a role"
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
