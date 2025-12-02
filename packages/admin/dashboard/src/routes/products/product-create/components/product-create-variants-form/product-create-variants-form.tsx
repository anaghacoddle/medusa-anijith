import { HttpTypes } from "@medusajs/types";
import { useEffect, useMemo } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  createDataGridHelper,
  createDataGridPriceColumns,
  DataGrid,
} from "../../../../../components/data-grid";
import { useRouteModal } from "../../../../../components/modals";
import { ProductCreateOptionSchema, ProductCreateVariantSchema } from "../../constants";
import { ProductCreateSchemaType } from "../../types";

type ProductCreateVariantsFormProps = {
  form: UseFormReturn<ProductCreateSchemaType>;
  regions: HttpTypes.AdminRegion[];
  store: HttpTypes.AdminStore;
  pricePreferences: HttpTypes.AdminPricePreference[];
};

// Add type for variant with originalIndex
type VariantWithIndex = ProductCreateVariantSchema & { originalIndex: number };

export const ProductCreateVariantsForm = ({
  form,
  regions,
  store,
  pricePreferences,
}: ProductCreateVariantsFormProps) => {
  const { setCloseOnEscape } = useRouteModal();

  const currencyCodes = useMemo(
    () => store?.supported_currencies?.map(c => c.currency_code) || [],
    [store]
  );

  const variants = useWatch({
    control: form.control,
    name: "variants",
    defaultValue: [],
  });

  const options = useWatch({
    control: form.control,
    name: "options",
    defaultValue: [],
  });

  // NEW: Update variant options when option titles change
  useEffect(() => {
    if (!options || options.length === 0) return;

    const currentVariants = form.getValues("variants");
    if (!currentVariants || currentVariants.length === 0) return;

    // Create a mapping of old option titles to new ones
    const optionTitleMap = new Map<string, string>();
    options.forEach(opt => {
      if (opt.title) {
        optionTitleMap.set(opt.title, opt.title);
      }
    });

    // Check if we need to remap variant options
    let needsUpdate = false;
    const updatedVariants = currentVariants.map((variant, idx) => {
      if (!variant.options) return variant;

      const variantOptionKeys = Object.keys(variant.options);
      const currentOptionTitles = options.map(o => o.title);

      // Check if variant option keys match current option titles
      const hasOldKeys = variantOptionKeys.some(key => !currentOptionTitles.includes(key));

      if (hasOldKeys && options.length === variantOptionKeys.length) {
        needsUpdate = true;

        // Remap the options object with new keys
        const newOptions: Record<string, string> = {};
        variantOptionKeys.forEach((oldKey, index) => {
          const newKey = options[index]?.title;
          if (newKey) {
            newOptions[newKey] = variant.options[oldKey];
          }
        });

        return {
          ...variant,
          options: newOptions,
        };
      }

      return variant;
    });

    if (needsUpdate) {
      form.setValue("variants", updatedVariants, { shouldValidate: true });
    }
  }, [options, form]);

  const columns = useColumns({
    options,
    currencies: currencyCodes,
    regions,
    pricePreferences,
  });

  const variantData = useMemo<VariantWithIndex[]>(() => {
    const ret: VariantWithIndex[] = [];
    variants.forEach((v, i) => {
      if (v.should_create) {
        ret.push({ ...v, originalIndex: i });
      }
    });
    return ret;
  }, [variants]);

  return (
    <div className="flex size-full flex-col divide-y overflow-hidden">
      <DataGrid
        columns={columns}
        data={variantData}
        state={form}
        onEditingChange={editing => setCloseOnEscape(!editing)}
      />
    </div>
  );
};

// Update columnHelper to use VariantWithIndex
const columnHelper = createDataGridHelper<VariantWithIndex, ProductCreateSchemaType>();

const useColumns = ({
  options,
  currencies = [],
  regions = [],
  pricePreferences = [],
}: {
  options: ProductCreateOptionSchema[];
  currencies?: string[];
  regions?: HttpTypes.AdminRegion[];
  pricePreferences?: HttpTypes.AdminPricePreference[];
}) => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.column({
        id: "options",
        header: () => (
          <div className="flex size-full items-center overflow-hidden">
            <span className="truncate">{options.map(o => o.title).join(" / ")}</span>
          </div>
        ),
        cell: context => {
          return (
            <DataGrid.ReadonlyCell context={context}>
              {options.map(o => context.row.original.options[o.title]).join(" / ")}
            </DataGrid.ReadonlyCell>
          );
        },
        disableHiding: true,
      }),
      columnHelper.column({
        id: "title",
        name: t("fields.title"),
        header: t("fields.title"),
        field: context => `variants.${context.row.original.originalIndex}.title`,
        type: "text",
        cell: context => {
          return <DataGrid.TextCell context={context} />;
        },
      }),
      columnHelper.column({
        id: "sku",
        name: t("fields.sku"),
        header: t("fields.sku"),
        field: context => `variants.${context.row.original.originalIndex}.sku`,
        type: "text",
        cell: context => {
          return <DataGrid.TextCell context={context} />;
        },
      }),
      columnHelper.column({
        id: "manage_inventory",
        name: t("fields.managedInventory"),
        header: t("fields.managedInventory"),
        field: context => `variants.${context.row.original.originalIndex}.manage_inventory`,
        type: "boolean",
        cell: context => {
          return <DataGrid.BooleanCell context={context} />;
        },
      }),
      columnHelper.column({
        id: "allow_backorder",
        name: t("fields.allowBackorder"),
        header: t("fields.allowBackorder"),
        field: context => `variants.${context.row.original.originalIndex}.allow_backorder`,
        type: "boolean",
        cell: context => {
          return <DataGrid.BooleanCell context={context} />;
        },
      }),
      columnHelper.column({
        id: "inventory_kit",
        name: t("fields.inventoryKit"),
        header: t("fields.inventoryKit"),
        field: context => `variants.${context.row.original.originalIndex}.inventory_kit`,
        type: "boolean",
        cell: context => {
          return (
            <DataGrid.BooleanCell
              context={context}
              disabled={!context.row.original.manage_inventory}
            />
          );
        },
      }),
      ...createDataGridPriceColumns<VariantWithIndex, ProductCreateSchemaType>({
        currencies,
        regions,
        pricePreferences,
        getFieldName: (context, value) => {
          if (context.column.id?.startsWith("currency_prices")) {
            return `variants.${context.row.original.originalIndex}.prices.${value}`;
          }
          return `variants.${context.row.original.originalIndex}.prices.${value}`;
        },
        t,
      }),
    ],
    [currencies, regions, options, pricePreferences, t]
  );
};
