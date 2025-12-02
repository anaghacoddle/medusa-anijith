import { ChatBubbleLeftRight } from "@medusajs/icons";

// Define route config helper locally
const defineRouteConfig = (config: any) => config;
import { Container } from "@medusajs/ui";
import WelcomeSection from "../../components/dashboard/welcome-section";
import MetricCards from "../../components/dashboard/metric-cards";
import RecentActivity from "../../components/dashboard/activity";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminLogs, useMe } from "../../hooks/api";
import { formatActivityLog } from "./activityLog";
import { decryptObject } from "../../utils/encryption";
import { useInventoryItems } from "../../hooks/api/inventory";
import LowStockItems from "../../components/dashboard/low-stock-items";

type AdminLog = {
  level: string;
  _id: string;
  message: string;
  timestamp: string;
  meta?: {
    type?: string;
    customerEmail?: string;
    customerName?: string;
    userId?: string;
    method?: string;
    url?: string;
    ip?: string;
    userAgent?: string;
    status?: number;
    statusCode?: number;
    durationMs?: number;
    userType?: string;
    userRole?: string;
    userEmail?: string;
    description?: string;
    responseSummary?: {
      message?: string;
      status?: number;
    };
  };
};

type CustomerLog = AdminLog;

const DashboardPage = () => {
  const { user: encryptedUser } = useMe();
  const [user, setUser] = useState<any>(null);

  // Customer logs state
  const [customerOffset, setCustomerOffset] = useState(0);
  const [customerLogsList, setCustomerLogsList] = useState<CustomerLog[]>([]);
  const { logs: customerLogs, isLoading: customerLoading } = useAdminLogs({
    userType: "customer",
    limit: 20,
    method: "POST,DELETE,PUT",
    offset: customerOffset,
  });

  // Admin logs state
  const [adminOffset, setAdminOffset] = useState(0);
  const [adminLogsList, setAdminLogsList] = useState<AdminLog[]>([]);
  const { logs: adminLogs, isLoading: adminLoading } = useAdminLogs({
    userType: "admin",
    method: "POST,DELETE,PUT",
    limit: 20,
    offset: adminOffset,
  });

  const threshold = __STOCK_MONITOR_THRESHOLD__ ? parseInt(__STOCK_MONITOR_THRESHOLD__, 10) : 10;

  const { inventory_items, isLoading: inventoryLoading } = useInventoryItems({
    fields:
      "id,*location_levels,location_levels.stock_locations.name,variants.*,variants.product.title",
    limit: 50,
  });

  const lowStockItems = useMemo(() => {
    if (!inventory_items) return [];

    return inventory_items.filter(item => {
      const totalAvailable =
        item.location_levels?.reduce((sum, level) => sum + (level.available_quantity || 0), 0) || 0;
      return totalAvailable < threshold; // Adjust threshold as needed
    });
  }, [inventory_items, threshold]);

  // Decrypt current user
  useEffect(() => {
    const decryptUser = async () => {
      if (encryptedUser) {
        try {
          const decrypted = await decryptObject(encryptedUser);
          setUser(decrypted);
        } catch (err) {
          console.error("Failed to decrypt user:", err);
        }
      }
    };

    decryptUser();
  }, [encryptedUser]);

  // Decrypt customer logs
  useEffect(() => {
    const decryptLogs = async () => {
      if (customerLogs?.length > 0) {
        try {
          const decryptedLogs = await Promise.all(
            customerLogs.map(async log => {
              try {
                return (await decryptObject(log)) as any;
              } catch {
                return null;
              }
            })
          );
          const validLogs = decryptedLogs.filter((log): log is any => log !== null);
          setCustomerLogsList(prev => [...prev, ...validLogs]);
        } catch (err) {
          console.error("Failed to decrypt customer logs:", err);
        }
      }
    };

    decryptLogs();
  }, [customerLogs]);

  // Decrypt admin logs
  useEffect(() => {
    const decryptLogs = async () => {
      if (adminLogs?.length > 0) {
        try {
          const decryptedLogs = await Promise.all(
            adminLogs.map(async log => {
              try {
                return (await decryptObject(log)) as any;
              } catch {
                return null;
              }
            })
          );
          const validLogs = decryptedLogs.filter((log): log is any => log !== null);
          setAdminLogsList(prev => [...prev, ...validLogs]);
        } catch (err) {
          console.error("Failed to decrypt admin logs:", err);
          // Optional: show toast notification
        }
      }
    };
    decryptLogs();
  }, [adminLogs]);

  // Format activities for components
  const customerActivities = useMemo(() => {
    return customerLogsList.map(log => formatActivityLog(log as any, "customer"));
  }, [customerLogsList]);

  const adminActivities = useMemo(() => {
    return adminLogsList.map(log => formatActivityLog(log as any, "admin"));
  }, [adminLogsList]);

  // Load more functions
  const loadMoreCustomerLogs = useCallback(() => {
    setCustomerOffset(prev => prev + 1);
  }, []);

  const loadMoreAdminLogs = useCallback(() => {
    setAdminOffset(prev => prev + 1);
  }, []);
  return (
    <Container>
      <WelcomeSection user={user} />

      {/* Uncomment if you want metrics */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
        <MetricCards />
        <MetricCards />
        <MetricCards />
        <MetricCards />
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div>
          <LowStockItems items={lowStockItems} isLoading={inventoryLoading} />{" "}
        </div>
        <div className="flex flex-col gap-6">
          <RecentActivity
            title="Admin Activity"
            activities={adminActivities}
            isLoading={adminLoading}
            onLoadMore={loadMoreAdminLogs}
          />
          <RecentActivity
            title="Customer Activity"
            activities={customerActivities}
            isLoading={customerLoading}
            onLoadMore={loadMoreCustomerLogs}
          />
        </div>
      </div>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "dashboard",
  icon: ChatBubbleLeftRight,
});

export default DashboardPage;
