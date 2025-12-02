import { Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { Container, Heading, StatusBadge, Text, toast, usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { maskEmail } from "../../../../../../src/routes/customers/customer-list/components/customer-list-table/customer-list-table";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { useDeleteCustomer } from "../../../../../hooks/api/customers";

type CustomerGeneralSectionProps = {
  customer: HttpTypes.AdminCustomer;
  partialAccess?: boolean;
};

export const CustomerGeneralSection = ({
  customer,
  partialAccess = false,
}: CustomerGeneralSectionProps) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const navigate = useNavigate();

  const { mutateAsync } = useDeleteCustomer(customer.id);

  const metadata: any = customer.addresses?.[0]?.metadata as { middle_name?: string } | undefined;
  const middleName: any = metadata?.middle_name || "-";
  const id = customer.id;
  const statusColor = customer.has_account ? "green" : "orange";
  const statusText = customer.has_account
    ? t("customers.fields.registered")
    : t("customers.fields.guest");

  const handleDelete = async () => {
    const res = await prompt({
      title: t("customers.delete.title"),
      description: t("customers.delete.description", {
        email: customer.email,
      }),
      verificationInstruction: t("general.typeToConfirm"),
      verificationText: customer.email,
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("customers.delete.successToast", {
            email: customer.email,
          })
        );

        navigate("/customers", { replace: true });
      },
      onError: error => {
        toast.error(error.message);
      },
    });
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{partialAccess ? `ID: ${id}` : maskEmail(customer.email)}</Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={statusColor}>{statusText}</StatusBadge>
          <ActionMenu
            groups={[
              // Admins are not permitted to edit customer details
              // {
              //   actions: [
              //     {
              //       label: t("actions.edit"),
              //       icon: <PencilSquare />,
              //       to: "edit",
              //     },
              //   ],
              // },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    icon: <Trash />,
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      {partialAccess ? (
        // Show only ID for partial access
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.id")}
          </Text>
          <Text size="small" leading="compact">
            {id || "-"}
          </Text>
        </div>
      ) : (
        // Show full information for full access
        <>
          <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("customers.fields.first_name")}
            </Text>
            <Text size="small" leading="compact">
              {customer.first_name || "-"}
            </Text>
          </div>

          <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("customers.fields.middle_name")}
            </Text>
            <Text size="small" leading="compact">
              {middleName || "-"}
            </Text>
          </div>

          <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("customers.fields.last_name")}
            </Text>
            <Text size="small" leading="compact">
              {customer.last_name || "-"}
            </Text>
          </div>

          <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.email")}
            </Text>
            <Text size="small" leading="compact">
              {customer.email ? maskEmail(customer.email) : "-"}
            </Text>
          </div>

          <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.phone")}
            </Text>
            <Text size="small" leading="compact">
              {customer.phone || "-"}
            </Text>
          </div>
        </>
      )}
    </Container>
  );
};
