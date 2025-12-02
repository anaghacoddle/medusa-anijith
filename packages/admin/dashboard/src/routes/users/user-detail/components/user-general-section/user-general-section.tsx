import { ArrowPath, PauseSolid, PencilSquare, PlaySolid, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { Container, Heading, Text, toast, usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { useDeleteUser } from "../../../../../hooks/api/users";
import { usePermission } from "../../../../../hooks/use-permission";
import { useRbacRoles } from "../../../../../hooks/api/rbac";
import { useUpdateUserStatus } from "../../../../../hooks/api/user-details";
import { useQueryClient } from "@tanstack/react-query";

type UserGeneralSectionProps = {
  user: HttpTypes.AdminUser;
};

export const UserGeneralSection = ({ user }: UserGeneralSectionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prompt = usePrompt();
  const { roles } = useRbacRoles();
  const queryClient = useQueryClient();

  const { mutateAsync: deleteUser } = useDeleteUser(user.id);
  const { mutateAsync: updateUserStatus } = useUpdateUserStatus();

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  const roleId = user.role_id;
  const userRole = roles?.find(role => role.id === roleId);

  const { hasPermission } = usePermission();

  const handleDeleteUser = async () => {
    const safeName = name;
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("users.deleteUserWarning", {
        name: safeName,
      }),
      verificationText: safeName,
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await deleteUser(undefined, {
      onSuccess: () => {
        toast.success(t("users.deleteUserSuccess", { name: user.email }));
        navigate("..");
      },
      onError: error => {
        toast.error(error.message);
      },
    });
  };

  const resetQrCode = async (userId: string) => {
    try {
      const res = await fetch(`/admin/reset-user?user_id=${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      toast.success(t("users.resetQrSuccess"));
    } catch (error: any) {
      toast.error(error.message || "Failed to reset QR code.");
    }
  };

  const handleResetQrCode = async (user: HttpTypes.AdminUser) => {
    const email = user.email;
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("users.resetQrWarning", {
        email: email || user.email,
      }),
      verificationText: email || user.email,
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: t("actions.resetqr"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await resetQrCode(user.id);
  };

  const handleToggleUserStatus = async (user: HttpTypes.AdminUser) => {
    const action = user.is_active ? t("actions.suspend") : t("actions.activate");
    const email = user.email;

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t(`users.${user.is_active ? "suspendUserWarning" : "activateUserWarning"}`, {
        email: email || user.email,
      }),
      verificationText: email || user.email,
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: action,
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    try {
      await updateUserStatus({
        user_id: user.id,
        is_active: !user.is_active,
      });

      await queryClient.invalidateQueries({
        queryKey: ["user", user.id],
      });

      // You might also need to invalidate the users list
      await queryClient.invalidateQueries({
        queryKey: ["users"],
      });

      toast.success(
        t(`users.${user.is_active ? "suspendUserSuccess" : "activateUserSuccess"}`, {
          email: user.email,
        })
      );
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error("An error occurred while updating user status.");
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{user.email}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "edit",
                  icon: <PencilSquare />,
                },
                {
                  label: t("actions.resetqr"),
                  icon: <ArrowPath />,
                  onClick: () => handleResetQrCode(user),
                  disabled: !hasPermission("/admin/users", "GET"),
                },
                {
                  label: user.is_active ? t("actions.suspend") : t("actions.activate"),
                  icon: user.is_active ? <PauseSolid /> : <PlaySolid />,
                  onClick: () => handleToggleUserStatus(user),
                  disabled: !hasPermission("/admin/users", "GET"),
                },
                {
                  label: t("actions.delete"),
                  onClick: handleDeleteUser,
                  icon: <Trash />,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          First name
        </Text>
        <Text size="small" leading="compact">
          {user.first_name ?? "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Last name
        </Text>
        <Text size="small" leading="compact">
          {user.last_name ?? "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Email
        </Text>
        <Text size="small" leading="compact">
          {user.email ?? "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Phone
        </Text>
        <Text size="small" leading="compact">
          {user.phone ?? "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Address
        </Text>
        <Text size="small" leading="compact">
          {user.address ?? "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Country
        </Text>
        <Text size="small" leading="compact">
          {user.country ?? "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Role
        </Text>
        <Text size="small" leading="compact">
          {userRole?.name ?? "-"}
        </Text>
      </div>
      {/* Add status display */}
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Status
        </Text>
        <Text size="small" leading="compact">
          {user.is_active ? "Active" : "Suspended"}
        </Text>
      </div>
    </Container>
  );
};
