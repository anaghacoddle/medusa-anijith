import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, Text, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "../../../../../../components/common/form";
import { RouteFocusModal, useRouteModal } from "../../../../../../components/modals";
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form";
import { useCreateRole, useRbacRoutes } from "../../../../../../hooks/api/rbac"; // Updated import
import MultiSelectUserRole from "../MultiSelectUserRole";
import { usePermission } from "../../../../../../hooks/use-permission";

export const extraPermissionsConfig: Record<string, { extraFields: string[] }> = {
  Products: { extraFields: ["sync"] },
  Customers: { extraFields: ["full_access"] },
};

const CreateRoleSchema = zod.object({
  name: zod
    .string()
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
  select_all: zod.boolean().optional(),
  modules: zod.array(zod.string()).optional(),
  module_control: zod
    .array(
      zod.object({
        id: zod.string(),
        can_read: zod.boolean(),
        can_create: zod.boolean(),
        can_update: zod.boolean(),
        can_delete: zod.boolean(),
        extraFields: zod.record(zod.boolean()).optional(), // Changed: dynamic extra fields
      })
    )
    .optional(),
});

export const CreateRbacForm = () => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { hasPermission } = usePermission();

  const { routes } = useRbacRoutes();

  const form = useForm<zod.infer<typeof CreateRoleSchema>>({
    defaultValues: {
      name: "",
      select_all: false,
      modules: [],
      module_control: [],
    },
    resolver: zodResolver(CreateRoleSchema),
  });

  const { mutateAsync: createRole, isPending } = useCreateRole();

  // Changed: Transform module_control dynamically to include extraFields from config
  const handleSubmit = form.handleSubmit(async values => {
    try {
      // Transform form data to match API payload structure
      const payload = {
        name: values.name.trim(),
        modules: values.modules,
        module_control: (values.module_control || []).map(control => {
          const matchedRoute = routes.find(r => String(r.id) === String(control.id));
          const moduleName = matchedRoute?.module ?? "";

          const extraFields = extraPermissionsConfig[moduleName]?.extraFields ?? [];

          // Changed: dynamic mapping of extra fields for the API payload
          const dynamicExtras = Object.fromEntries(
            extraFields.map(f => [f, control.extraFields?.[f] ?? false])
          );

          return {
            id: control.id,
            can_read: control.can_read,
            can_create: control.can_create,
            can_update: control.can_update,
            can_delete: control.can_delete,
            ...dynamicExtras, // Spread dynamic extras here
          };
        }),
      };

      await createRole(payload);

      toast.success("Role created successfully");
      handleSuccess(`/settings/rbac`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to create role"
      );
    }
  });

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      // Select all permissions
      const allPermissionIds = routes.map(p => String(p.id));
      form.setValue("modules", allPermissionIds);

      const allAccessControl = routes.map(route => {
        // Initialize all extraFields as true dynamically
        const extraFields = extraPermissionsConfig[route.module]
          ? extraPermissionsConfig[route.module].extraFields.reduce(
              (acc, f) => ({ ...acc, [f]: true }),
              {}
            )
          : {};
        return {
          id: String(route.id),
          can_read: true,
          can_create: true,
          can_update: true,
          can_delete: true,
          extraFields, // Changed: dynamic extraFields
        };
      });
      form.setValue("module_control", allAccessControl);
    } else {
      // Deselect all permissions
      form.setValue("modules", []);
      form.setValue("module_control", []);
    }
  };

  const handleModuleChange = (newModules: number[]) => {
    if (newModules.length < routes.length) {
      form.setValue("select_all", false);
    }

    form.setValue("modules", newModules.map(String));

    const currentModuleControl = form.getValues("module_control") || [];
    const newModuleStrings = newModules.map(String);
    const filteredModuleControl = currentModuleControl.filter((control: any) =>
      newModuleStrings.includes(control.id)
    );
    form.setValue("module_control", filteredModuleControl);
  };

  const modules = form.watch("modules");
  const permissionLabels: Record<"can_read" | "can_create" | "can_update" | "can_delete", string> =
    {
      can_read: t("rbac.can_read"),
      can_create: t("rbac.can_create"),
      can_update: t("rbac.can_update"),
      can_delete: t("rbac.can_delete"),
    };
  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
              <div>
                <Heading className="capitalize">Create Role</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Define a new role with specific permissions to control user access and actions
                  within the system.
                </Text>
              </div>
              <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      return (
                        <Form.Item>
                          <Form.Label>{t("fields.name")}*</Form.Label>
                          <Form.Control>
                            <Input size="small" {...field} autoFocus />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      );
                    }}
                  />
                </div>
                {/* Select All Checkbox */}
                <div className="mb-4.5 mt-4">
                  <div className="flex select-none items-center text-black dark:text-white">
                    <div className="relative">
                      <input
                        type="checkbox"
                        id="select_all"
                        name="select_all"
                        checked={form.watch("select_all")}
                        onChange={e => {
                          const checked = e.target.checked;
                          form.setValue("select_all", checked);
                          handleSelectAllChange(checked);
                        }}
                        className="sr-only"
                      />
                      <label
                        htmlFor="select_all"
                        className={`mr-4 flex h-5 w-5 items-center justify-center rounded border
                            ${form.watch("select_all") ? "border-primary bg-gray dark:bg-transparent" : ""}
                            cursor-pointer`}
                      >
                        <span
                          className={`opacity-0 ${form.watch("select_all") ? "!opacity-100" : ""}`}
                        >
                          <svg
                            width="11"
                            height="8"
                            viewBox="0 0 11 8"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M10.0915 0.951972L10.0867 0.946075L10.0813 0.940568C9.90076 0.753564 9.61034 0.753146 9.42927 0.939309L4.16201 6.22962L1.58507 3.63469C1.40401 3.44841 1.11351 3.44879 0.932892 3.63584C0.755703 3.81933 0.755703 4.10875 0.932892 4.29224L0.932878 4.29225L0.934851 4.29424L3.58046 6.95832C3.73676 7.11955 3.94983 7.2 4.1473 7.2C4.36196 7.2 4.55963 7.11773 4.71406 6.9584L10.0468 1.60234C10.2436 1.4199 10.2421 1.1339 10.0915 0.951972ZM4.2327 6.30081L4.2317 6.2998C4.23206 6.30015 4.23237 6.30049 4.23269 6.30082L4.2327 6.30081Z"
                              fill="#3056D3"
                              stroke="#3056D3"
                              strokeWidth="0.4"
                            />
                          </svg>
                        </span>
                      </label>
                    </div>
                    <span className="text-sm font-medium">Give Permission For All Modules</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    * These permissions include full access control
                  </span>
                </div>
                <div className="flex flex-col gap-y-2">
                  <Form.Field
                    control={form.control}
                    name="modules"
                    render={() => {
                      return (
                        <Form.Item>
                          <MultiSelectUserRole
                            control={form.control}
                            name="modules"
                            options={routes}
                            placeholder="Select Module"
                            label="Modules*"
                            className="w-full"
                            selectAll={form.watch("select_all")}
                            onModuleChange={handleModuleChange}
                          />
                          <Form.ErrorMessage />
                        </Form.Item>
                      );
                    }}
                  />
                </div>
                {/* Access Control Section */}

                {Array.isArray(modules) && modules.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-medium text-black-2 dark:text-white">
                      Access Control
                    </h3>
                    <div className="space-y-4">
                      {modules.map((selectedPermissionId: string) => {
                        const permission = routes.find(p => String(p.id) === selectedPermissionId);
                        const moduleControl = form
                          .watch("module_control")
                          ?.find((a: any) => a.id === selectedPermissionId) || {
                          id: selectedPermissionId,
                          can_read: false,
                          can_create: false,
                          can_update: false,
                          can_delete: false,
                          extraFields: {},
                        };

                        const handleAccessChange = (
                          key: "can_read" | "can_create" | "can_update" | "can_delete",
                          value: boolean
                        ) => {
                          const currentAccessControl = form.getValues("module_control") || [];
                          const updatedAccess = [...currentAccessControl];
                          const index = updatedAccess.findIndex(
                            (a: any) => a.id === selectedPermissionId
                          );

                          // Start with default or existing module access
                          const currentModule =
                            index !== -1
                              ? { ...updatedAccess[index] }
                              : {
                                  id: selectedPermissionId,
                                  can_read: false,
                                  can_create: false,
                                  can_update: false,
                                  can_delete: false,
                                  extraFields: {},
                                };

                          // Apply the change
                          currentModule[key] = value;

                          // Enforce "read" if any of the others are selected
                          if (["can_create", "can_update", "can_delete"].includes(key) && value) {
                            currentModule["can_read"] = true;
                          }

                          if (index !== -1) {
                            updatedAccess[index] = currentModule;
                          } else {
                            updatedAccess.push(currentModule);
                          }

                          form.setValue("module_control", updatedAccess);
                        };

                        const extraFields =
                          extraPermissionsConfig[permission?.module ?? ""]?.extraFields || [];

                        const handleExtraFieldChange = (field: string, value: boolean) => {
                          const currentAccessControl = form.getValues("module_control") || [];
                          const updatedAccess = [...currentAccessControl];
                          const index = updatedAccess.findIndex(
                            (a: any) => a.id === selectedPermissionId
                          );

                          const currentModule =
                            index !== -1
                              ? { ...updatedAccess[index] }
                              : {
                                  id: selectedPermissionId,
                                  can_read: false,
                                  can_create: false,
                                  can_update: false,
                                  can_delete: false,
                                  extraFields: {},
                                };

                          // Ensure all extra fields are included and updated
                          const allExtraFields =
                            extraPermissionsConfig[permission?.module ?? ""]?.extraFields || [];
                          const filledExtraFields: Record<string, boolean> = {};
                          for (const f of allExtraFields) {
                            filledExtraFields[f] = currentModule.extraFields?.[f] ?? false;
                          }
                          filledExtraFields[field] = value;

                          currentModule.extraFields = filledExtraFields;

                          if (value) {
                            currentModule.can_read = true;
                          }

                          if (index !== -1) {
                            updatedAccess[index] = currentModule;
                          } else {
                            updatedAccess.push(currentModule);
                          }

                          form.setValue("module_control", updatedAccess);
                        };

                        return (
                          <div
                            key={selectedPermissionId}
                            className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800"
                          >
                            <div className="mb-2 text-sm font-medium">{permission?.module}</div>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                              {(
                                ["can_read", "can_create", "can_update", "can_delete"] as const
                              ).map(perm => (
                                <label key={perm} className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(moduleControl[perm]) || false}
                                    onChange={e => handleAccessChange(perm, e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-primary"
                                  />
                                  {permissionLabels[perm]}
                                </label>
                              ))}
                            </div>

                            {/* Extra permission checkboxes */}
                            {extraFields.length > 0 && (
                              <div className="mt-3">
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                  {extraFields.map(field => (
                                    <label key={field} className="flex items-center gap-2 text-sm">
                                      <input
                                        type="checkbox"
                                        checked={
                                          Boolean(moduleControl.extraFields?.[field]) || false
                                        }
                                        onChange={e =>
                                          handleExtraFieldChange(field, e.target.checked)
                                        }
                                        className="form-checkbox h-4 w-4 text-secondary"
                                      />
                                      {field.charAt(0).toUpperCase() + field.slice(1)}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              disabled={!hasPermission("/admin/rbac", "POST")}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};
