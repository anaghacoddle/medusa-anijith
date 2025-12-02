import { Calendar, PencilSquare, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
  usePrompt,
  toast,
  Input,
  Label,
} from "@medusajs/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ActionMenu } from "../../../../../components/common/action-menu";
import { SectionRow } from "../../../../../components/common/section";
import { preordersQueryKeys } from "../../../../../hooks/api/preorders";

type VariantPreorderSectionProps = {
  readonly variant: HttpTypes.AdminProductVariant;
  readonly preorderVariant?: {
    id: string;
    variant_id: string;
    available_date: string;
    status: "enabled" | "disabled";
  };
  readonly onPreorderUpdate?: () => void;
};

export function VariantPreorderSection({
  variant,
  preorderVariant,
  onPreorderUpdate,
}: Readonly<VariantPreorderSectionProps>) {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [showEnableForm, setShowEnableForm] = useState(false);
  const [availableDateTime, setAvailableDateTime] = useState("");

  const refetchPreorderData = () => {
    queryClient.invalidateQueries({
      queryKey: preordersQueryKeys.variantPreorder(variant.id),
    });
    onPreorderUpdate?.();
  };

  const handleEnablePreorder = async () => {
    if (!availableDateTime) {
      toast.error(t("products.variant.preorder.toast.errorRequired"));
      return;
    }

    const selectedDate = new Date(availableDateTime);
    const now = new Date();

    if (selectedDate < now) {
      toast.error(t("products.variant.preorder.toast.errorFutureDate"));
      return;
    }

    // Validate year is 4 digits
    const year = selectedDate.getFullYear();
    if (year < 1000 || year > 9999) {
      toast.error(t("products.variant.preorder.toast.errorValidYear"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/admin/variants/${variant.id}/preorders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          available_date: new Date(availableDateTime).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enable preorder");
      }

      toast.success(t("products.variant.preorder.toast.enabled"));
      setShowEnableForm(false);
      setAvailableDateTime("");
      refetchPreorderData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("general.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePreorder = async () => {
    const result = await prompt({
      title: t("products.variant.preorder.prompt.disableTitle"),
      description: t("products.variant.preorder.prompt.disableDescription"),
      confirmText: t("actions.disable"),
      cancelText: t("actions.cancel"),
    });

    if (!result) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/admin/variants/${variant.id}/preorders`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disable preorder");
      }

      toast.success(t("products.variant.preorder.toast.disabled"));

      refetchPreorderData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("general.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDate = async () => {
    if (!availableDateTime) {
      toast.error(t("products.variant.preorder.toast.errorRequired"));
      return;
    }

    const selectedDate = new Date(availableDateTime);
    const now = new Date();

    if (selectedDate < now) {
      toast.error(t("products.variant.preorder.toast.errorFutureDate"));
      return;
    }

    // Validate year is 4 digits
    const year = selectedDate.getFullYear();
    if (year < 1000 || year > 9999) {
      toast.error(t("products.variant.preorder.toast.errorValidYear"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/admin/variants/${variant.id}/preorders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          available_date: new Date(availableDateTime).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preorder date");
      }

      toast.success(t("products.variant.preorder.toast.updated"));
      setShowEnableForm(false);
      setAvailableDateTime("");
      refetchPreorderData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("general.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const isPreorderEnabled = preorderVariant?.status === "enabled";

  // Format datetime for input (YYYY-MM-DDTHH:MM)
  const formatDateTimeForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Validate and normalize datetime input to ensure 4-digit year
  const handleDateTimeChange = (value: string) => {
    // Extract year from the datetime string
    const yearRegex = /^(\d+)-/;
    const yearMatch = yearRegex.exec(value);
    if (yearMatch && yearMatch[1].length > 4) {
      // Truncate to 4 digits
      const truncatedYear = yearMatch[1].slice(0, 4);
      const restOfDate = value.substring(yearMatch[1].length);
      setAvailableDateTime(truncatedYear + restOfDate);
    } else {
      setAvailableDateTime(value);
    }
  };

  // Format datetime for display
  const formatDateTimeForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const minDateTime = formatDateTimeForInput(new Date());

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h3">{t("products.variant.preorder.header")}</Heading>
        {isPreorderEnabled && !showEnableForm && (
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("products.variant.preorder.updateDateTime"),
                    onClick: () => setShowEnableForm(true),
                    icon: <PencilSquare />,
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("products.variant.preorder.disablePreorder"),
                    onClick: () => void handleDisablePreorder(),
                    icon: <Trash />,
                  },
                ],
              },
            ]}
          />
        )}
      </div>

      {isPreorderEnabled ? (
        <>
          <SectionRow
            title={t("products.variant.preorder.status")}
            value={
              <Badge size="2xsmall" color="green">
                {t("products.variant.preorder.enabled")}
              </Badge>
            }
          />
          <SectionRow
            title={t("products.variant.preorder.availableDateTime")}
            value={
              <div className="flex items-center gap-2">
                <Calendar className="text-ui-fg-subtle" />
                <Text>{formatDateTimeForDisplay(preorderVariant.available_date)}</Text>
              </div>
            }
          />

          {showEnableForm && (
            <div className="px-6 py-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="available_datetime">
                    {t("products.variant.preorder.dateTimeLabel")}
                  </Label>
                  <Input
                    id="available_datetime"
                    type="datetime-local"
                    value={availableDateTime}
                    onChange={e => handleDateTimeChange(e.target.value)}
                    min={minDateTime}
                    max="9999-12-31T23:59"
                    disabled={isLoading}
                  />
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("products.variant.preorder.dateTimeHint")}
                  </Text>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateDate} disabled={isLoading}>
                    {t("products.variant.preorder.updateDateTimeButton")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowEnableForm(false);
                      setAvailableDateTime("");
                    }}
                    disabled={isLoading}
                  >
                    {t("actions.cancel")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <SectionRow
            title={t("products.variant.preorder.status")}
            value={
              <Badge size="2xsmall" color="red">
                {t("products.variant.preorder.disabled")}
              </Badge>
            }
          />
          <div className="px-6 py-4">
            {showEnableForm ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="available_datetime">
                    {t("products.variant.preorder.dateTimeLabel")}
                  </Label>
                  <Input
                    id="available_datetime"
                    type="datetime-local"
                    value={availableDateTime}
                    onChange={e => handleDateTimeChange(e.target.value)}
                    min={minDateTime}
                    max="9999-12-31T23:59"
                    disabled={isLoading}
                  />
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("products.variant.preorder.dateTimeHint")}
                  </Text>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEnablePreorder} disabled={isLoading}>
                    {t("products.variant.preorder.enablePreorderButton")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowEnableForm(false);
                      setAvailableDateTime("");
                    }}
                    disabled={isLoading}
                  >
                    {t("actions.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Text className="text-ui-fg-subtle">
                  {t("products.variant.preorder.description")}
                </Text>
                <Button onClick={() => setShowEnableForm(true)} disabled={isLoading}>
                  {t("products.variant.preorder.enablePreorder")}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </Container>
  );
}
