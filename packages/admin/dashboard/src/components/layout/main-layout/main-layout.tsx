import {
  BuildingStorefront,
  Buildings,
  ChatBubbleLeftRight,
  ChevronDownMini,
  CogSixTooth,
  CurrencyDollar,
  EllipsisHorizontal,
  MagnifyingGlass,
  MinusMini,
  OpenRectArrowOut,
  ReceiptPercent,
  ShoppingCart,
  SquaresPlus,
  Tag,
  Users,
} from "@medusajs/icons";
import { Avatar, Divider, DropdownMenu, Text, clx } from "@medusajs/ui";
import { Collapsible as RadixCollapsible } from "radix-ui";
import { useTranslation } from "react-i18next";

import { useStore } from "../../../hooks/api/store";
import { Skeleton } from "../../common/skeleton";
import { INavItem, NavItem } from "../../layout/nav-item";
import { Shell } from "../../layout/shell";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLogout } from "../../../hooks/api";
import { queryClient } from "../../../lib/query-client";
import { useExtension } from "../../../providers/extension-provider";
import { useSearch } from "../../../providers/search-provider";
import { UserMenu } from "../user-menu";
import { usePermission } from "../../../hooks/use-permission";
import { useDocumentDirection } from "../../../hooks/use-document-direction";

export const MainLayout = () => {
  return (
    <Shell>
      <MainSidebar />
    </Shell>
  );
};

const MainSidebar = () => {
  return (
    <aside className="flex flex-1 flex-col justify-between overflow-y-auto">
      <div className="flex flex-1 flex-col">
        <div className="bg-ui-bg-subtle sticky top-0">
          <Header />
          <div className="px-3">
            <Divider variant="dashed" />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <div className="flex flex-1 flex-col">
            <CoreRouteSection />
            <ExtensionRouteSection />
          </div>
          <UtilitySection />
        </div>
        <div className="bg-ui-bg-subtle sticky bottom-0">
          <UserSection />
        </div>
      </div>
    </aside>
  );
};

const Logout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { mutateAsync: logoutMutation } = useLogout();

  const handleLogout = async () => {
    await logoutMutation(undefined, {
      onSuccess: () => {
        /**
         * When the user logs out, we want to clear the query cache
         */
        queryClient.clear();
        navigate("/login");
      },
    });
  };

  return (
    <DropdownMenu.Item onClick={handleLogout}>
      <div className="flex items-center gap-x-2">
        <OpenRectArrowOut className="text-ui-fg-subtle" />
        <span>{t("app.menus.actions.logout")}</span>
      </div>
    </DropdownMenu.Item>
  );
};

const Header = () => {
  const { t } = useTranslation();
  const { store, isPending, isError, error } = useStore();
  const direction = useDocumentDirection();
  const name = store?.name;
  const fallback = store?.name?.slice(0, 1).toUpperCase();

  const isLoaded = !isPending && !!store && !!name && !!fallback;

  if (isError) {
    throw error;
  }

  const { hasPermission } = usePermission();

  return (
    <div className="w-full p-3">
      <DropdownMenu dir={direction}>
        <DropdownMenu.Trigger
          disabled={!isLoaded}
          className={clx(
            "bg-ui-bg-subtle transition-fg grid w-full grid-cols-[24px_1fr_15px] items-center gap-x-3 rounded-md p-0.5 pe-2 outline-none",
            "hover:bg-ui-bg-subtle-hover",
            "data-[state=open]:bg-ui-bg-subtle-hover",
            "focus-visible:shadow-borders-focus"
          )}
        >
          {fallback ? (
            <Avatar variant="squared" size="xsmall" fallback={fallback} />
          ) : (
            <Skeleton className="h-6 w-6 rounded-md" />
          )}
          <div className="block overflow-hidden text-start">
            {name ? (
              <Text size="small" weight="plus" leading="compact">
                {/* {store.name} */}
                Botanical Chemist
              </Text>
            ) : (
              <Skeleton className="h-[9px] w-[120px]" />
            )}
          </div>
          <EllipsisHorizontal className="text-ui-fg-muted" />
        </DropdownMenu.Trigger>
        {isLoaded && (
          <DropdownMenu.Content className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-0">
            <div className="flex items-center gap-x-3 px-2 py-1">
              <Avatar variant="squared" size="small" fallback={fallback} />
              <div className="flex flex-col overflow-hidden">
                <Text size="small" weight="plus" leading="compact">
                  {/* {name} */}
                  Botanical Chemist
                </Text>
                <Text size="xsmall" leading="compact" className="text-ui-fg-subtle">
                  {t("app.nav.main.store")}
                </Text>
              </div>
            </div>
            {hasPermission("/admin/stores", "GET") && (
              <>
                <DropdownMenu.Separator />
                <DropdownMenu.Item className="gap-x-2" asChild>
                  <Link to="/settings/store">
                    <BuildingStorefront className="text-ui-fg-subtle" />
                    {t("app.nav.main.storeSettings")}
                  </Link>
                </DropdownMenu.Item>
              </>
            )}
            <DropdownMenu.Separator />
            <Logout />
          </DropdownMenu.Content>
        )}
      </DropdownMenu>
    </div>
  );
};

const useCoreRoutes = (): Omit<INavItem, "pathname">[] => {
  const { t } = useTranslation();
  const { hasPermission } = usePermission();

  return [
    {
      icon: <SquaresPlus />,
      label: t("dashboard.domain"),
      to: "/dashboard",
    },
    {
      icon: <ShoppingCart />,
      label: t("orders.domain"),
      to: "/orders",
      items: [
        // TODO: Enable when domin is introduced
        // {
        //   label: t("draftOrders.domain"),
        //   to: "/draft-orders",
        // },
      ].filter(Boolean),
      //uncomment below filter when new labels are added to items
      // .filter(item => hasPermission(routePermissions, "/admin" + item.to)),
    },
    {
      icon: <Tag />,
      label: t("products.domain"),
      to: "/products",
      items: [
        hasPermission("/admin/collections", "GET") && {
          label: t("collections.domain"),
          to: "/collections",
        },
        hasPermission("/admin/product-categories", "GET") && {
          label: t("categories.domain"),
          to: "/categories",
        },
        hasPermission("/admin/products", "DELETE") && {
          label: t("deleteProducts.domain"),
          to: "/deleted-products",
        },
        hasPermission("/admin/collections", "GET") && {
          label: t("digitalProducts.domain"),
          to: "/digital-products",
        },
        // TODO: Enable when domin is introduced
        // {
        //   label: t("giftCards.domain"),
        //   to: "/gift-cards",
        // },
      ].filter(Boolean),
    },
    {
      icon: <Buildings />,
      label: t("inventory.domain"),
      to: "/inventory",
      items: [
        hasPermission("/admin/reservations", "GET") && {
          label: t("reservations.domain"),
          to: "/reservations",
        },
      ].filter(Boolean),
    },
    {
      icon: <Users />,
      label: t("customers.domain"),
      to: "/customers",
      items: [
        hasPermission("/admin/customer-groups", "GET") && {
          label: t("customerGroups.domain"),
          to: "/customer-groups",
        },
      ].filter(Boolean),
    },
    {
      icon: <ShoppingCart />,
      label: "Carts",
      to: "/carts",
    },
    {
      icon: <ReceiptPercent />,
      label: t("promotions.domain"),
      to: "/promotions",
      items: [
        hasPermission("/admin/campaigns", "GET") && {
          label: t("campaigns.domain"),
          to: "/campaigns",
        },
      ].filter(Boolean),
    },
    {
      icon: <CurrencyDollar />,
      label: t("priceLists.domain"),
      to: "/price-lists",
    },
    {
      icon: <Tag />,
      label: t("newsletter.domain"),
      to: "/newsletters",
    },
    {
      icon: <ChatBubbleLeftRight />,
      label: t("review.domain"),
      to: "/reviews",
    },
  ].filter(item => {
    const path = item.to === "/inventory" ? "/inventory-items" : item.to;
    return hasPermission("/admin" + path, "GET") || (item.items && item.items.length > 0);
  });
};

const Searchbar = () => {
  const { t } = useTranslation();
  const { toggleSearch } = useSearch();

  return (
    <div className="px-3">
      <button
        onClick={toggleSearch}
        className={clx(
          "bg-ui-bg-subtle text-ui-fg-subtle flex w-full items-center gap-x-2.5 rounded-md px-2 py-1 outline-none",
          "hover:bg-ui-bg-subtle-hover",
          "focus-visible:shadow-borders-focus"
        )}
      >
        <MagnifyingGlass />
        <div className="flex-1 text-start">
          <Text size="small" leading="compact" weight="plus">
            {t("app.search.label")}
          </Text>
        </div>
        <Text size="small" leading="compact" className="text-ui-fg-muted">
          ⌘K
        </Text>
      </button>
    </div>
  );
};

const CoreRouteSection = () => {
  const coreRoutes = useCoreRoutes();

  const { getMenu } = useExtension();

  const menuItems = getMenu("coreExtensions");

  menuItems.forEach(item => {
    if (item.nested) {
      const route = coreRoutes.find(route => route.to === item.nested);
      if (route) {
        route.items?.push(item);
      }
    }
  });

  return (
    <nav className="flex flex-col gap-y-1 py-3">
      <Searchbar />
      {coreRoutes.map(route => {
        return <NavItem key={route.to} {...route} />;
      })}
    </nav>
  );
};

const ExtensionRouteSection = () => {
  const { t } = useTranslation();
  const { getMenu } = useExtension();

  const menuItems = getMenu("coreExtensions").filter(item => !item.nested);

  if (!menuItems.length) {
    return null;
  }

  return (
    <div>
      <div className="px-3">
        <Divider variant="dashed" />
      </div>
      <div className="flex flex-col gap-y-1 py-3">
        <RadixCollapsible.Root defaultOpen>
          <div className="px-4">
            <RadixCollapsible.Trigger asChild className="group/trigger">
              <button className="text-ui-fg-subtle flex w-full items-center justify-between px-2">
                <Text size="xsmall" weight="plus" leading="compact">
                  {t("app.nav.common.extensions")}
                </Text>
                <div className="text-ui-fg-muted">
                  <ChevronDownMini className="group-data-[state=open]/trigger:hidden" />
                  <MinusMini className="group-data-[state=closed]/trigger:hidden" />
                </div>
              </button>
            </RadixCollapsible.Trigger>
          </div>
          <RadixCollapsible.Content>
            <nav className="flex flex-col gap-y-0.5 py-1 pb-4">
              {menuItems.map((item, i) => {
                return (
                  <NavItem
                    key={i}
                    to={item.to}
                    label={item.label}
                    icon={item.icon ? item.icon : <SquaresPlus />}
                    items={item.items}
                    type="extension"
                  />
                );
              })}
            </nav>
          </RadixCollapsible.Content>
        </RadixCollapsible.Root>
      </div>
    </div>
  );
};

const UtilitySection = () => {
  const location = useLocation();
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col gap-y-0.5 py-3">
        <NavItem
          label={t("app.nav.settings.header")}
          to="/settings"
          from={location.pathname}
          icon={<CogSixTooth />}
        />
      </div>
    </>
  );
};

const UserSection = () => {
  return (
    <div>
      <div className="px-3">
        <Divider variant="dashed" />
      </div>
      <UserMenu />
    </div>
  );
};
