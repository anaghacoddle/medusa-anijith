import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select, Textarea, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { HttpTypes } from "@medusajs/types";
import { Form } from "../../../../../components/common/form";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useUpdateUser } from "../../../../../hooks/api/users";
import { languages } from "../../../../../i18n/languages";
import { decryptObject, encryptObject } from "../../../../../utils/encryption";
import { useState, useEffect, useMemo } from "react";
import { Combobox } from "../../../../../components/inputs/combobox";
import { useRbacRoles } from "../../../../../hooks/api/rbac";
import { countries } from "../../../../../lib/data/countries";
import { useDocumentDirection } from "../../../../../hooks/use-document-direction";

type EditProfileProps = {
  user: HttpTypes.AdminUser;
  // usageInsights: boolean
};

const EditProfileSchema = zod.object({
  first_name: zod
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name must be at most 50 characters" }),
  last_name: zod
    .string()
    .trim()
    .min(2, { message: "Last name name is required" })
    .max(50, { message: "Last name must be at most 50 characters" })
    .optional(),
  email: zod.string().email().optional(),
  address: zod.string().optional(),
  country: zod.string().optional(),
  phone: zod
    .string()
    .min(8, { message: "Phone number must have at least 8 digits" })
    .max(15, { message: "Phone number must not exceed 15 digits" })
    .regex(/^\+?[1-9]\d+$/, {
      message: "Phone number must be in international format (e.g., +14155552671)",
    })
    .optional()
    .or(zod.literal("")),
  role_id: zod.string().optional(),
  language: zod.string(),
  // usage_insights: zod.boolean(),
});

export const EditProfileForm = ({ user }: EditProfileProps) => {
  const { t, i18n } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const [decryptedUser, setDecryptedUser] = useState<HttpTypes.AdminUser | null>(null);
  const { roles } = useRbacRoles();

  useEffect(() => {
    if (user) {
      decryptObject(user).then(result => {
        setDecryptedUser(result as HttpTypes.AdminUser);
      });
    }
  }, [user]);
  const direction = useDocumentDirection();
  const form = useForm<zod.infer<typeof EditProfileSchema>>({
    defaultValues: {
      first_name: decryptedUser?.first_name ?? "",
      last_name: decryptedUser?.last_name ?? "",
      email: decryptedUser?.email ?? "",
      phone: decryptedUser?.phone ?? "",
      address: decryptedUser?.address ?? "",
      country: decryptedUser?.country ?? "",
      role_id: decryptedUser?.role?.id ?? "",
      language: i18n.language,
      // usage_insights: usageInsights,
    },
    resolver: zodResolver(EditProfileSchema),
  });

  useEffect(() => {
    if (decryptedUser) {
      form.reset({
        first_name: decryptedUser.first_name ?? "",
        last_name: decryptedUser.last_name ?? "",
        email: decryptedUser.email ?? "",
        phone: decryptedUser.phone ?? "",
        address: decryptedUser.address ?? "",
        country: decryptedUser.country ?? "",
        role_id: decryptedUser.role?.id ?? "",
        language: i18n.language,
      });
    }
  }, [decryptedUser, form, i18n.language]);

  const changeLanguage = async (code: string) => {
    await i18n.changeLanguage(code);
  };

  const sortedLanguages = languages.sort((a, b) => a.display_name.localeCompare(b.display_name));

  const { mutateAsync, isPending } = useUpdateUser(decryptedUser?.id!);

  const handleSubmit = form.handleSubmit(async values => {
    const { first_name, last_name, phone, address, country, role_id } = values;

    // Create payload structure similar to the first form
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

    // Encrypt payload with role_id encryption
    const encryptedPayload = await encryptObject(payload, ["role_id"]);

    await mutateAsync(encryptedPayload, {
      onSuccess: () => {
        // Change language after successful update
        changeLanguage(values.language);
        toast.success(t("profile.toast.edit"));
        handleSuccess();
      },
      onError: error => {
        toast.error(error.message);
        return;
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
          <div className="flex flex-col gap-y-8">
            {/* <div className="grid grid-cols-2 gap-4"> */}
            <Form.Field
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.firstName")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            {/* <Button
                size="small"
                variant="secondary"
                type="button"
                onClick={() => {
                  const currentValues = form.getValues(); // or form.watch()
                  console.log("Current form values before submit:", currentValues);
                }}
              >
                Log Form Values
              </Button> */}
            <Form.Field
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.lastName")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Email</Form.Label>
                  <Form.Control>
                    <Input {...field} />
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
                  <Form.Label>Phone</Form.Label>
                  <Form.Control>
                    <Input {...field} />
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
                    <Textarea {...field} />
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
            {/* </div> */}
            {/* <div>
              <Form.Field
                control={form.control}
                name="language"
                render={({ field: { ref, ...field } }) => (
                  <Form.Item className="gap-y-4">
                    <div>
                      <Form.Label>{t("profile.fields.languageLabel")}</Form.Label>
                      <Form.Hint>{t("profile.edit.languageHint")}</Form.Hint>
                    </div>
                    <div>
                      <Form.Control>
                        <Select
                        dir={direction}
                        {...field}
                        onValueChange={field.onChange}
                      >
                          <Select.Trigger ref={ref} className="py-1 text-[13px]">
                            <Select.Value placeholder={t("profile.edit.languagePlaceholder")}>
                              {
                                sortedLanguages.find(language => language.code === field.value)
                                  ?.display_name
                              }
                            </Select.Value>
                          </Select.Trigger>
                          <Select.Content>
                            {languages.map(language => (
                              <Select.Item key={language.code} value={language.code}>
                                {language.display_name}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </div>
                  </Form.Item>
                )}
              />
            </div> */}
            {/* TODO: Do we want to implement usage insights in V2? */}
            {/* <Form.Field
              control={form.control}
              name="usage_insights"
              render={({ field: { value, onChange, ...rest } }) => (
                <Form.Item>
                  <div className="flex items-center justify-between">
                    <Form.Label>
                      {t("profile.fields.usageInsightsLabel")}
                    </Form.Label>
                    <Form.Control>
                      <Switch dir="ltr"
                        className="rtl:rotate-180"
                        {...rest}
                        checked={value}
                        onCheckedChange={onChange}
                      />
                    </Form.Control>
                  </div>
                  <Form.Hint>
                    <span>
                      <Trans
                        i18nKey="profile.edit.usageInsightsHint"
                        components={[
                          <a
                            key="hint-link"
                            className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover transition-fg underline"
                            // TODO change link once docs are public
                            href="https://medusa-resources-git-docs-v2-medusajs.vercel.app/resources/usage#admin-analytics"
                            target="_blank"
                            rel="noopener noreferrer"
                          />,
                        ]}
                      />
                    </span>
                  </Form.Hint>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            /> */}
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
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
