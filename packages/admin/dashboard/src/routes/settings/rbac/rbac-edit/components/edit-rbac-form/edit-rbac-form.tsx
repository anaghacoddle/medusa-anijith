import { useMemo, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";
import { useQueryClient } from "@tanstack/react-query"; // Import React Query client
import { extraPermissionsConfig } from "../../../../rbac/rbac-create/components/rbac-form/create-rbac-form";
import { Form } from "../../../../../../components/common/form";
import { RouteDrawer, useRouteModal } from "../../../../../../components/modals";
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form";
import { useUpdateRole, useRbacRoutes } from "../../../../../../hooks/api/rbac";
import MultiSelectUserRole from "../../../rbac-create/components/MultiSelectUserRole";
import { usePermission } from "../../../../../../hooks/use-permission";

// Define the role interface to match your actual data structure
interface Permission {
  id: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  role_id: string;
  route_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  role: {
    id: string;
  };
  route: {
    id: string;
  };
}

interface RoleData {
  role: {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  permissions: Permission[];
}

type ModuleControlItem = {
  id: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
  extraFields?: Record<string, boolean>;
  [key: string]: any;
};

type EditRoleFormProps = {
  roleData: RoleData;
};

type CorePermission = "can_read" | "can_create" | "can_update" | "can_delete";

const EditRoleSchema = zod.object({
  name: zod.string().trim().min(1).max(50),
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
        extraFields: zod.record(zod.boolean()).optional(),
      })
    )
    .optional(),
});

export const EditRbacForm = ({ roleData }: EditRoleFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { hasPermission } = usePermission();

  const { routes } = useRbacRoutes();

  const queryClient = useQueryClient(); // React Query client instance

  const modules = useMemo(() => roleData.permissions.map(p => p.route_id), [roleData.permissions]);
  const moduleControl: ModuleControlItem[] = useMemo(() => {
    return roleData.permissions.map(p => {
      const moduleName = routes.find(r => String(r.id) === String(p.route_id))?.module ?? "";
      const extraFields =
        extraPermissionsConfig[moduleName]?.extraFields.reduce<Record<string, boolean>>(
          (acc, f) => {
            acc[f] = (p as any)[f] ?? false;
            return acc;
          },
          {}
        ) || {};

      return {
        id: p.route_id,
        can_read: p.can_read,
        can_create: p.can_create,
        can_update: p.can_update,
        can_delete: p.can_delete,
        extraFields, // ensured never undefined due to fallback
      };
    });
  }, [roleData.permissions, routes]);

  const isAllSelected = useMemo(
    () => (routes && modules && routes.length > 0 ? modules.length === routes.length : false),
    [routes, modules]
  );

  const form = useForm<zod.infer<typeof EditRoleSchema>>({
    defaultValues: {
      name: roleData.role.name || "",
      select_all: isAllSelected,
      modules: modules || [],
      module_control: moduleControl || [],
    },
    resolver: zodResolver(EditRoleSchema),
  });

  const { mutateAsync: updateRole, isPending } = useUpdateRole(roleData.role.id);

  const handleSubmit = form.handleSubmit(async values => {
    try {
      const filteredModuleControl =
        values.module_control?.filter(control =>
          (values.modules ?? []).some(m => m === control.id)
        ) || [];

      const mappedModuleControl = filteredModuleControl.map(control => ({
        id: control.id,
        can_read: control.can_read,
        can_create: control.can_create,
        can_update: control.can_update,
        can_delete: control.can_delete,
        ...(control.extraFields || {}),
      }));

      const payload = {
        name: values.name.trim(),
        deleted_option: [],
        modules: values.modules,
        module_control: mappedModuleControl,
      };

      await updateRole(payload);

      await queryClient.invalidateQueries({
        queryKey: ["rbac-role", roleData.role.id],
      });

      toast.success("Role updated successfully");
      handleSuccess(`/settings/rbac`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to update role"
      );
    }
  });

  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allPermissionIds = routes.map(p => String(p.id));
        form.setValue("modules", allPermissionIds, { shouldValidate: false, shouldDirty: false });

        const allAccessControl = routes.map(route => {
          const extraFields =
            extraPermissionsConfig[route.module]?.extraFields.reduce(
              (acc, f) => ({ ...acc, [f]: true }),
              {}
            ) || {};
          return {
            id: String(route.id),
            can_read: true,
            can_create: true,
            can_update: true,
            can_delete: true,
            extraFields,
          };
        });
        form.setValue("module_control", allAccessControl, {
          shouldValidate: false,
          shouldDirty: false,
        });
      } else {
        form.setValue("modules", [], { shouldValidate: false, shouldDirty: false });
        form.setValue("module_control", [], { shouldValidate: false, shouldDirty: false });
      }
    },
    [routes, form]
  );

  const handleModuleChange = useCallback(
    (newModules: number[]) => {
      if (routes.length && newModules.length < routes.length) {
        form.setValue("select_all", false, { shouldValidate: false, shouldDirty: false });
      }

      form.setValue("modules", newModules.map(String), {
        shouldValidate: false,
        shouldDirty: false,
      });

      const currentModuleControl = form.getValues("module_control") || [];
      const filteredModuleControl = currentModuleControl.filter(control =>
        newModules.includes(Number(control.id))
      );
      form.setValue("module_control", filteredModuleControl, {
        shouldValidate: false,
        shouldDirty: false,
      });
    },
    [routes.length, form]
  );

  const modulesWatch = form.watch("modules");

  // Unified handler for core and extra permissions
  const handlePermissionChange = useCallback(
    (selectedPermissionId: string, key: string, value: boolean) => {
      const currentAccessControl = form.getValues("module_control") || [];
      const updatedAccess = [...currentAccessControl];
      const index = updatedAccess.findIndex(a => a.id === selectedPermissionId);

      const defaultPermissions: ModuleControlItem = {
        id: selectedPermissionId,
        can_read: false,
        can_create: false,
        can_update: false,
        can_delete: false,
        extraFields: {},
      };

      const existingPermissions: ModuleControlItem =
        index !== -1 ? updatedAccess[index] : defaultPermissions;

      // Make shallow copy of extraFields
      const extraFieldsCopy = { ...(existingPermissions.extraFields || {}) };

      if (["can_read", "can_create", "can_update", "can_delete"].includes(key)) {
        existingPermissions[key] = value;

        // If create/update/delete enabled, ensure read is enabled
        if (value && (key === "can_create" || key === "can_update" || key === "can_delete")) {
          existingPermissions.can_read = true;
        }
      } else {
        // Dynamic extra permission field
        extraFieldsCopy[key] = value;
        if (value) {
          existingPermissions.can_read = true;
        }
      }

      const newPermissions: ModuleControlItem = {
        ...existingPermissions,
        extraFields: extraFieldsCopy,
      };

      if (index !== -1) {
        updatedAccess[index] = newPermissions;
      } else {
        updatedAccess.push(newPermissions);
      }

      form.setValue("module_control", updatedAccess, { shouldValidate: false, shouldDirty: false });
    },
    [form]
  );

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <RouteDrawer.Body className="flex max-w-full flex-1 flex-col gap-y-8 overflow-y-auto">
          <div className="flex flex-col gap-y-4">
            <div className="grid grid-cols-1">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>{t("fields.name")}</Form.Label>
                    <Form.Control>
                      <Input size="small" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>

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
                      form.setValue("select_all", checked, {
                        shouldValidate: false,
                        shouldDirty: false,
                      });
                      handleSelectAllChange(checked);
                    }}
                    className="sr-only"
                  />
                  <label
                    htmlFor="select_all"
                    className={`mr-4 flex h-5 w-5 items-center justify-center rounded border ${
                      form.watch("select_all") ? "border-primary bg-gray dark:bg-transparent" : ""
                    } cursor-pointer`}
                  >
                    <span className={`opacity-0 ${form.watch("select_all") ? "!opacity-100" : ""}`}>
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
                render={() => (
                  <Form.Item>
                    <MultiSelectUserRole
                      control={form.control}
                      name="modules"
                      options={routes}
                      placeholder="Select Module"
                      label="Modules"
                      className="w-full"
                      selectAll={form.watch("select_all")}
                      onModuleChange={handleModuleChange}
                    />
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>

            {Array.isArray(modulesWatch) && modulesWatch.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-black-2 dark:text-white">
                  Access Control
                </h3>
                <div className="space-y-4">
                  {modulesWatch.map((selectedPermissionId: string) => {
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
                    const extraFields =
                      extraPermissionsConfig[permission?.module ?? ""]?.extraFields || [];

                    return (
                      <div
                        key={selectedPermissionId}
                        className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800"
                      >
                        <div className="mb-2 text-sm font-medium">{permission?.module}</div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          {(
                            [
                              "can_read",
                              "can_create",
                              "can_update",
                              "can_delete",
                            ] as CorePermission[]
                          ).map(perm => (
                            <label key={perm} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={Boolean(moduleControl[perm])}
                                onChange={e =>
                                  handlePermissionChange(
                                    selectedPermissionId,
                                    perm,
                                    e.target.checked
                                  )
                                }
                                className="form-checkbox h-4 w-4 text-primary"
                              />
                              {t(`rbac.${perm}` as any)}
                            </label>
                          ))}

                          {extraFields.map(field => (
                            <label
                              key={field}
                              className="flex items-center gap-2 text-sm col-span-1"
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(moduleControl.extraFields?.[field]) || false}
                                onChange={e =>
                                  handlePermissionChange(
                                    selectedPermissionId,
                                    field,
                                    e.target.checked
                                  )
                                }
                                className="form-checkbox h-4 w-4 text-primary"
                              />
                              {field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
              disabled={!hasPermission("/admin/rbac", "PUT")}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
