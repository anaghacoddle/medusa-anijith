import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  DropdownMenu,
  Heading,
  IconButton,
  InlineTip,
  Switch,
  clx,
  toast,
  Textarea,
  Input,
} from "@medusajs/ui";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { ArrowDownMini, ArrowUpMini, EllipsisVertical, Trash } from "@medusajs/icons";
import { FetchError } from "@medusajs/js-sdk";
import { ComponentPropsWithoutRef, forwardRef } from "react";
import { ConditionalTooltip } from "../../common/conditional-tooltip";
import { Form } from "../../common/form";
import { Skeleton } from "../../common/skeleton";
import { RouteDrawer, useRouteModal } from "../../modals";
import { KeyboundForm } from "../../utilities/keybound-form";
import { useDocumentDirection } from "../../../hooks/use-document-direction";

type MetaDataSubmitHook<TRes> = (
  params: { metadata?: Record<string, any> | null },
  callbacks: { onSuccess: () => void; onError: (error: FetchError) => void }
) => Promise<TRes>;

type MetadataFormProps<TRes> = {
  metadata?: Record<string, any> | null;
  hook: MetaDataSubmitHook<TRes>;
  isPending: boolean;
  isMutating: boolean;
};

const MetadataFieldSchema = z.object({
  key: z.string(),
  disabled: z.boolean().optional(),
  value: z.any(),
});

const MetadataSchema = z
  .object({
    s3: z.boolean().optional(),
    s3_description: z.string().optional(),
    prescription_required: z.boolean().optional(),
    prescription_required_description: z.string().optional(),
    metadata: z.array(MetadataFieldSchema),
  })
  .refine(
    data => {
      // If s3 is true, s3_description must be provided
      if (data.s3 && (!data.s3_description || data.s3_description.trim() === "")) {
        return false;
      }
      return true;
    },
    {
      message: "S3 Description is required when S3 is enabled",
      path: ["s3_description"],
    }
  )
  .refine(
    data => {
      // If prescription_required is true, prescription_required_description must be provided
      if (
        data.prescription_required &&
        (!data.prescription_required_description ||
          data.prescription_required_description.trim() === "")
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Prescription Required Description is required when Prescription Required is enabled",
      path: ["prescription_required_description"],
    }
  );

export const MetadataForm = <TRes,>(props: MetadataFormProps<TRes>) => {
  const { t } = useTranslation();
  const { isPending, ...innerProps } = props;

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("metadata.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("metadata.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {isPending ? <PlaceholderInner /> : <InnerForm {...innerProps} />}
    </RouteDrawer>
  );
};

const METADATA_KEY_LABEL_ID = "metadata-form-key-label";
const METADATA_VALUE_LABEL_ID = "metadata-form-value-label";

const InnerForm = <TRes,>({
  metadata,
  hook,
  isMutating,
}: Omit<MetadataFormProps<TRes>, "isPending">) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const direction = useDocumentDirection();
  const hasUneditableRows = getHasUneditableRows(metadata);

  const form = useForm<z.infer<typeof MetadataSchema>>({
    defaultValues: {
      s3: metadata?.s3 === true || metadata?.s3 === "true" || metadata?.s3 === 1,
      s3_description: metadata?.s3_description || "",
      prescription_required:
        metadata?.prescription_required === true ||
        metadata?.prescription_required === "true" ||
        metadata?.prescription_required === 1,
      prescription_required_description: metadata?.prescription_required_description || "",
      metadata: getDefaultValues(metadata),
    },
    resolver: zodResolver(MetadataSchema),
  });

  const handleSubmit = form.handleSubmit(async data => {
    const parsedData = parseValues(data, metadata);

    await hook(
      {
        metadata: parsedData,
      },
      {
        onSuccess: () => {
          toast.success(t("metadata.edit.successToast"));
          handleSuccess();
        },
        onError: error => {
          toast.error(error.message);
        },
      }
    );
  });

  const { fields, insert, remove } = useFieldArray({
    control: form.control,
    name: "metadata",
  });

  function deleteRow(index: number) {
    remove(index);

    // If the last row is deleted, add a new blank row
    if (fields.length === 1) {
      insert(0, {
        key: "",
        value: "",
        disabled: false,
      });
    }
  }

  function insertRow(index: number, position: "above" | "below") {
    insert(index + (position === "above" ? 0 : 1), {
      key: "",
      value: "",
      disabled: false,
    });
  }

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-y-auto">
          {/* S3 Toggle */}
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="s3"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item>
                    <Form.Label>S3</Form.Label>
                    <Form.Control>
                      <div className="flex items-center gap-x-2">
                        <Switch {...field} checked={value || false} onCheckedChange={onChange} />
                        <span className="text-ui-fg-subtle txt-compact-small">
                          {value ? "Yes" : "No"}
                        </span>
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />

            {/* S3 Description Field with Textarea */}
            <Form.Field
              control={form.control}
              name="s3_description"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>S3 Description</Form.Label>
                    <Form.Control>
                      <Textarea {...field} placeholder="Enter S3 description..." />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />

            {/* Prescription Required Toggle */}
            <Form.Field
              control={form.control}
              name="prescription_required"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item>
                    <Form.Label>Prescription Required</Form.Label>
                    <Form.Control>
                      <div className="flex items-center gap-x-2">
                        <Switch {...field} checked={value || false} onCheckedChange={onChange} />
                        <span className="text-ui-fg-subtle txt-compact-small">
                          {value ? "Yes" : "No"}
                        </span>
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />

            {/* Prescription Required Description Field with Textarea */}
            <Form.Field
              control={form.control}
              name="prescription_required_description"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>Prescription Required Description</Form.Label>
                    <Form.Control>
                      <Textarea
                        {...field}
                        placeholder="Enter prescription required description..."
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />
          </div>

          {/* Dynamic Metadata Grid */}
          {/* <div className="bg-ui-bg-base shadow-elevation-card-rest grid grid-cols-1 divide-y rounded-lg">
            <div className="bg-ui-bg-subtle grid grid-cols-2 divide-x rounded-t-lg">
              <div className="txt-compact-small-plus text-ui-fg-subtle px-2 py-1.5">
                <label id={METADATA_KEY_LABEL_ID}>{t("metadata.edit.labels.key")}</label>
              </div>
              <div className="txt-compact-small-plus text-ui-fg-subtle px-2 py-1.5">
                <label id={METADATA_VALUE_LABEL_ID}>{t("metadata.edit.labels.value")}</label>
              </div>
            </div>
            {fields.map((field, index) => {
              const isDisabled = field.disabled || false;
              let placeholder = "-";

              if (typeof field.value === "object") {
                placeholder = "{ ... }";
              }

              if (Array.isArray(field.value)) {
                placeholder = "[ ... ]";
              }

              return (
                <ConditionalTooltip
                  showTooltip={isDisabled}
                  content={t("metadata.edit.complexRow.tooltip")}
                  key={field.id}
                >
                  <div className="group/table relative">
                    <div
                      className={clx("grid grid-cols-2 divide-x", {
                        "overflow-hidden rounded-b-lg": index === fields.length - 1,
                      })}
                    >
                      <Form.Field
                        control={form.control}
                        name={`metadata.${index}.key`}
                        render={({ field }) => {
                          return (
                            <Form.Item>
                              <Form.Control>
                                <GridInput
                                  aria-labelledby={METADATA_KEY_LABEL_ID}
                                  {...field}
                                  disabled={isDisabled}
                                  placeholder="Key"
                                />
                              </Form.Control>
                            </Form.Item>
                          );
                        }}
                      />

                      <Form.Field
                        control={form.control}
                        name={`metadata.${index}.value`}
                        render={({ field: { value, onChange, ...field } }) => {
                          const isBooleanValue =
                            value === true ||
                            value === false ||
                            value === "true" ||
                            value === "false";

                          return (
                            <Form.Item>
                              <Form.Control>
                                {isDisabled ? (
                                  <GridInput
                                    aria-labelledby={METADATA_VALUE_LABEL_ID}
                                    {...field}
                                    value={placeholder}
                                    disabled
                                  />
                                ) : isBooleanValue ? (
                                  <div className="flex items-center px-2 py-1.5">
                                    <Switch
                                      checked={value === true || value === "true"}
                                      onCheckedChange={checked =>
                                        onChange(checked ? "true" : "false")
                                      }
                                    />
                                    <span className="ml-2 text-ui-fg-muted">
                                      {value === "true" || value === true ? "True" : "False"}
                                    </span>
                                  </div>
                                ) : (
                                  <GridInput
                                    aria-labelledby={METADATA_VALUE_LABEL_ID}
                                    {...field}
                                    value={value ?? ""}
                                    placeholder="Value"
                                  />
                                )}
                              </Form.Control>
                            </Form.Item>
                          );
                        }}
                      />
                    </div>

                    <DropdownMenu dir={direction}>
                      <DropdownMenu.Trigger
                        className={clx(
                          "invisible absolute inset-y-0 -end-2.5 my-auto group-hover/table:visible data-[state='open']:visible",
                          {
                            hidden: isDisabled,
                          }
                        )}
                        disabled={isDisabled}
                        asChild
                      >
                        <IconButton size="2xsmall">
                          <EllipsisVertical />
                        </IconButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.Item
                          className="gap-x-2"
                          onClick={() => insertRow(index, "above")}
                        >
                          <ArrowUpMini className="text-ui-fg-subtle" />
                          {t("metadata.edit.actions.insertRowAbove")}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="gap-x-2"
                          onClick={() => insertRow(index, "below")}
                        >
                          <ArrowDownMini className="text-ui-fg-subtle" />
                          {t("metadata.edit.actions.insertRowBelow")}
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator />
                        <DropdownMenu.Item className="gap-x-2" onClick={() => deleteRow(index)}>
                          <Trash className="text-ui-fg-subtle" />
                          {t("metadata.edit.actions.deleteRow")}
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu>
                  </div>
                </ConditionalTooltip>
              );
            })}
          </div> */}

          {hasUneditableRows && (
            <InlineTip variant="warning" label={t("metadata.edit.complexRow.label")}>
              {t("metadata.edit.complexRow.description")}
            </InlineTip>
          )}
        </RouteDrawer.Body>

        {/* Footer buttons */}
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" type="button" disabled={isMutating}>
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isMutating}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};

const GridInput = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        autoComplete="off"
        className={clx(
          "txt-compact-small text-ui-fg-base placeholder:text-ui-fg-muted disabled:text-ui-fg-disabled disabled:bg-ui-bg-base bg-transparent px-2 py-1.5 outline-none",
          className
        )}
      />
    );
  }
);
GridInput.displayName = "MetadataForm.GridInput";

const PlaceholderInner = () => {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <RouteDrawer.Body>
        <Skeleton className="h-[148ox] w-full rounded-lg" />
      </RouteDrawer.Body>
      <RouteDrawer.Footer>
        <div className="flex items-center justify-end gap-x-2">
          <Skeleton className="h-7 w-12 rounded-md" />
          <Skeleton className="h-7 w-12 rounded-md" />
        </div>
      </RouteDrawer.Footer>
    </div>
  );
};

const EDITABLE_TYPES = ["string", "number", "boolean"];

function getDefaultValues(
  metadata?: Record<string, any> | null
): z.infer<typeof MetadataFieldSchema>[] {
  if (!metadata || !Object.keys(metadata).length) {
    return [
      {
        key: "",
        value: "",
        disabled: false,
      },
    ];
  }

  // Filter out all dedicated fields from dynamic metadata
  const filteredMetadata = Object.entries(metadata).filter(
    ([key]) =>
      key !== "s3" &&
      key !== "s3_description" &&
      key !== "prescription_required" &&
      key !== "prescription_required_description"
  );

  if (filteredMetadata.length === 0) {
    return [
      {
        key: "",
        value: "",
        disabled: false,
      },
    ];
  }

  return filteredMetadata.map(([key, value]) => {
    if (!EDITABLE_TYPES.includes(typeof value)) {
      return {
        key,
        value: value,
        disabled: true,
      };
    }

    let stringValue = value;

    if (typeof value !== "string") {
      stringValue = JSON.stringify(value);
    }

    return {
      key,
      value: stringValue,
      original_key: key,
    };
  });
}

function parseValues(
  values: z.infer<typeof MetadataSchema>,
  original?: Record<string, any> | null
): Record<string, any> | null {
  const metadata = values.metadata;

  const isEmpty =
    !metadata.length || (metadata.length === 1 && !metadata[0].key && !metadata[0].value);

  const update: Record<string, any> = {};

  // Add the dedicated fields
  if (values.s3 !== undefined) {
    update.s3 = values.s3;
  }

  if (values.s3_description !== undefined && values.s3_description !== "") {
    update.s3_description = values.s3_description;
  }

  if (values.prescription_required !== undefined) {
    update.prescription_required = values.prescription_required;
  }

  if (
    values.prescription_required_description !== undefined &&
    values.prescription_required_description !== ""
  ) {
    update.prescription_required_description = values.prescription_required_description;
  }

  // Handle removed keys from dynamic metadata
  if (original) {
    Object.keys(original).forEach(originalKey => {
      // Skip the dedicated fields
      if (
        originalKey === "s3" ||
        originalKey === "s3_description" ||
        originalKey === "prescription_required" ||
        originalKey === "prescription_required_description"
      ) {
        return;
      }

      const exists = metadata.some(field => field.key === originalKey);
      if (!exists) {
        update[originalKey] = "";
      }
    });
  }

  // Process dynamic metadata
  if (!isEmpty) {
    metadata.forEach(field => {
      let key = field.key;
      let value = field.value;
      const disabled = field.disabled;

      if (!key) {
        return;
      }

      if (disabled) {
        update[key] = value;
        return;
      }

      key = key.trim();
      value = value?.trim?.() ?? "";

      // Try casting values
      if (value === "true") {
        update[key] = true;
      } else if (value === "false") {
        update[key] = false;
      } else {
        const isNumeric = /^-?\d*\.?\d+$/.test(value);
        if (isNumeric) {
          update[key] = parseFloat(value);
        } else {
          update[key] = value;
        }
      }
    });
  }

  // Return null if completely empty
  if (Object.keys(update).length === 0) {
    return null;
  }

  return update;
}

function getHasUneditableRows(metadata?: Record<string, any> | null) {
  if (!metadata) {
    return false;
  }

  return Object.entries(metadata)
    .filter(
      ([key]) =>
        key !== "s3" &&
        key !== "s3_description" &&
        key !== "prescription_required" &&
        key !== "prescription_required_description"
    )
    .some(([, value]) => !EDITABLE_TYPES.includes(typeof value));
}
