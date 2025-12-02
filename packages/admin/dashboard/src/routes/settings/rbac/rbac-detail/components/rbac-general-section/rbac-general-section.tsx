import { PencilSquare, Trash } from "@medusajs/icons";
import { Container, Heading, toast, usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ActionMenu } from "../../../../../../components/common/action-menu";
import { useRbacRoutes, useDeleteRole } from "../../../../../../hooks/api/rbac";
import { usePermission } from "../../../../../../hooks/use-permission";
import { NoRecords } from "../../../../../../components/common/empty-table-content";
import { extraPermissionsConfig } from "../../../../../../routes/settings/rbac/rbac-create/components/rbac-form/create-rbac-form";

type UserGeneralSectionProps = {
  roleData: {
    role: {
      id: string;
      name: string;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
    permissions: Permission[];
  };
};

export const RbacGeneralSection = ({ roleData }: UserGeneralSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prompt = usePrompt();
  const { hasPermission } = usePermission();
  const { mutateAsync } = useDeleteRole(roleData?.role?.id);

  const { routes } = useRbacRoutes();

  const name = roleData?.role?.name;
  const truncatedName =
    roleData?.role?.name.length > 30
      ? roleData?.role?.name.slice(0, 30) + ".."
      : roleData?.role?.name;

  const handleDeleteUser = async () => {
    const res = await prompt({
      title: "Are you sure?",
      description: `You are about to delete the role ${truncatedName}. This action cannot be undone.`,
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(`Role ${truncatedName} deleted successfully.`);
        navigate("..");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || error.message);
      },
    });
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading
          style={{
            display: "inline-block",
            maxWidth: "90%",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={name}
        >
          {name}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "edit",
                  icon: <PencilSquare />,
                  disabled: !hasPermission("/admin/rbac", "PUT"),
                },
              ],
            },
            {
              actions: [
                {
                  label: t("actions.delete"),
                  onClick: handleDeleteUser,
                  icon: <Trash />,
                  disabled: !hasPermission("/admin/rbac", "DELETE"),
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <div className="col-span-2">
          <h3 className="mb-3 text-sm font-medium text-black-2 dark:text-white">Access Control</h3>
          <div className="space-y-4">
            <div className="space-y-4">
              {roleData.permissions && roleData.permissions.length > 0 ? (
                roleData.permissions.map(permission => {
                  const route = routes.find(
                    r => r.id === permission.route_id || r.id === permission.route?.id
                  );

                  const permissionKeys = [
                    "can_read",
                    "can_create",
                    "can_update",
                    "can_delete",
                  ] as const;
                  const extraFields =
                    extraPermissionsConfig[route?.module ?? ""]?.extraFields || [];

                  return (
                    <div
                      key={permission.id}
                      className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800"
                    >
                      <div className="mb-2 text-sm font-medium">
                        {route?.module || "Unknown Module"}
                      </div>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {permissionKeys.map(perm => (
                          <label key={perm} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={Boolean(permission[perm]) || false}
                              disabled
                              readOnly
                              className="form-checkbox h-4 w-4 text-primary pointer-events-none"
                            />
                            {t(`rbac.${perm}`)}
                          </label>
                        ))}
                      </div>
                      {extraFields.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                          {extraFields.map(field => (
                            <label key={field} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={Boolean(permission[field]) || false}
                                disabled
                                readOnly
                                className="form-checkbox h-4 w-4 text-secondary pointer-events-none"
                              />
                              {field.charAt(0).toUpperCase() + field.slice(1)}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <NoRecords
                  // title="No Records"
                  message="This role has no access permissions assigned."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
