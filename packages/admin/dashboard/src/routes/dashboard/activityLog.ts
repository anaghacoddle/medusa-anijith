interface LogEntry {
  _id: string;
  level: string;
  message: string;
  timestamp: string;
  meta: {
    description: string;
    type: string;
    requestId: string;
    method: string;
    url: string;
    statusCode: number;
    durationMs: number;
    ipAddress: string;
    userAgent: string;
    userId?: string;
    userEmail?: string;
    userName?: string;
    userType: string;
    requestBody?: any;
    responseSummary: {
      message: string;
      status: number;
    };
  };
}

interface FormattedLog {
  id: string;
  title: string;
  description: string;
  author: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode: number | string;
  messageType: "Success" | "Error" | "Warning" | "Info";
  actionIcon: string;
  category: string;
  details?: any;
}

type LogType = "admin" | "customer";

const MESSAGE_ICONS: Record<string, string> = {
  Success: "🟢",
  Error: "🔴",
  Warning: "🟡",
  Info: "🔵",
};

const CATEGORY_ICONS: Record<string, string> = {
  auth: "🔐",
  cart: "🛒",
  product: "📦",
  order: "📋",
  payment: "💳",
  user: "👤",
  system: "⚙️",
};

// Enhanced route mapping with categories and detailed descriptions
const ROUTE_MAPPING: Record<
  string,
  { action: string; category: string; extractDetails?: (log: LogEntry) => any }
> = {
  // Authentication Routes
  "POST /auth/customer/emailpass": {
    action: "Customer Login",
    category: "auth",
    extractDetails: log => ({
      email: log.meta.requestBody?.email ? "***@***.***" : "Unknown",
      success: log.meta.statusCode === 200,
    }),
  },
  "POST /auth/user/emailpass": {
    action: "Admin Login",
    category: "auth",
    extractDetails: log => ({
      email: log.meta.requestBody?.email ? "***@***.***" : "Unknown",
      success: log.meta.statusCode === 200,
    }),
  },
  "POST /store/otp/generate": {
    action: "OTP Generation",
    category: "auth",
    extractDetails: log => ({
      identifier: log.meta.requestBody?.identifier || "Unknown",
      isRegister: log.meta.requestBody?.isRegister || false,
    }),
  },
  "POST /store/otp/verify": {
    action: "OTP Verification",
    category: "auth",
    extractDetails: log => ({
      identifier: log.meta.requestBody?.identifier || "Unknown",
      otp: log.meta.requestBody?.otp ? "******" : "Not provided",
      success: log.meta.statusCode === 200,
    }),
  },
  "POST /auth/session": {
    action: "Session Created",
    category: "auth",
    extractDetails: log => ({
      userId: log.meta.userId || "Unknown",
      userType: log.meta.userType || "Unknown",
    }),
  },
  "DELETE /auth/session": {
    action: "Logout",
    category: "auth",
    extractDetails: log => ({
      success: log.meta.statusCode === 200,
    }),
  },

  // Cart Operations
  "POST /store/carts": {
    action: "Cart Created",
    category: "cart",
  },
  "POST /store/carts/:id/line-items": {
    action: "Item Added to Cart",
    category: "cart",
    extractDetails: log => {
      const response = parseResponseMessage(log);
      return {
        cartId: extractFromUrl(log.meta.url, /\/carts\/([^\/]+)/),
        productTitle: response?.product_title || "Unknown Product",
        quantity: response?.quantity || 1,
        price: response?.unit_price || 0,
      };
    },
  },
  "DELETE /store/carts/:id/line-items/:itemId": {
    action: "Item Removed from Cart",
    category: "cart",
    extractDetails: log => {
      const response = parseResponseMessage(log);
      const cartId = extractFromUrl(log.meta.url, /\/carts\/([^\/]+)/);
      const itemId = extractFromUrl(log.meta.url, /\/line-items\/([^\/]+)/);

      return {
        cartId,
        itemId,
        productTitle: response?.parent?.items?.[0]?.product_title || "Unknown Product",
        cartTotal: response?.parent?.total || 0,
        itemsRemaining: response?.parent?.items?.length || 0,
      };
    },
  },
  "PUT /store/carts/:id/line-items/:itemId": {
    action: "Cart Item Updated",
    category: "cart",
    extractDetails: log => {
      const response = parseResponseMessage(log);
      return {
        cartId: extractFromUrl(log.meta.url, /\/carts\/([^\/]+)/),
        itemId: extractFromUrl(log.meta.url, /\/line-items\/([^\/]+)/),
        quantity: response?.quantity || "Unknown",
      };
    },
  },

  // Product Operations
  "POST /store/products": {
    action: "Product Created",
    category: "product",
    extractDetails: log => {
      const response = parseResponseMessage(log);
      return {
        productId: response?.id,
        title: response?.title || "Unknown Product",
        price: response?.price || 0,
      };
    },
  },
  "PUT /store/products/:id": {
    action: "Product Updated",
    category: "product",
    extractDetails: log => {
      const productId = extractFromUrl(log.meta.url, /\/products\/([^\/]+)/);
      const response = parseResponseMessage(log);
      return {
        productId,
        title: response?.title || "Unknown Product",
      };
    },
  },
  "DELETE /store/products/:id": {
    action: "Product Deleted",
    category: "product",
    extractDetails: log => ({
      productId: extractFromUrl(log.meta.url, /\/products\/([^\/]+)/),
    }),
  },

  // Admin Product Operations
  "POST /admin/products": {
    action: "Product Created (Admin)",
    category: "product",
  },
  "PUT /admin/products/:id": {
    action: "Product Updated (Admin)",
    category: "product",
  },
  "DELETE /admin/products/:id": {
    action: "Product Deleted (Admin)",
    category: "product",
  },

  // Order Operations
  "POST /store/orders": {
    action: "Order Placed",
    category: "order",
    extractDetails: log => {
      const response = parseResponseMessage(log);
      return {
        orderId: response?.id,
        total: response?.total || 0,
        itemCount: response?.items?.length || 0,
      };
    },
  },
  "GET /store/orders/:id": {
    action: "Order Viewed",
    category: "order",
    extractDetails: log => ({
      orderId: extractFromUrl(log.meta.url, /\/orders\/([^\/]+)/),
    }),
  },
  "PUT /store/orders/:id": {
    action: "Order Updated",
    category: "order",
    extractDetails: log => ({
      orderId: extractFromUrl(log.meta.url, /\/orders\/([^\/]+)/),
    }),
  },

  // Login Attempt (Special case)
  "POST /store/login-attempt": {
    action: "Login Attempt",
    category: "auth",
    extractDetails: log => ({
      email: log.meta.requestBody?.email ? "***@***.***" : "Unknown",
      reset: log.meta.requestBody?.reset || false,
      success: log.meta.statusCode === 200,
    }),
  },
};

// Helper Functions
function parseResponseMessage(log: LogEntry): any {
  try {
    const message = log.meta?.responseSummary?.message;
    return message ? JSON.parse(message) : null;
  } catch {
    return null;
  }
}

function extractFromUrl(url: string, regex: RegExp): string {
  const match = url.match(regex);
  return match ? match[1] : "Unknown";
}

function matchRoute(method: string, url: string): (typeof ROUTE_MAPPING)[string] | undefined {
  const directKey = `${method.toUpperCase()} ${url}`;
  if (ROUTE_MAPPING[directKey]) return ROUTE_MAPPING[directKey];

  // Try fuzzy matching for dynamic routes
  for (const route in ROUTE_MAPPING) {
    const [routeMethod, routePath] = route.split(" ");
    if (routeMethod !== method.toUpperCase()) continue;

    const regex = new RegExp("^" + routePath.replace(/:[^/]+/g, "[^/]+") + "$");
    if (regex.test(url)) {
      return ROUTE_MAPPING[route];
    }
  }

  return undefined;
}

function getAuthor(log: LogEntry): string {
  const userName = log.meta?.userName;
  const userEmail = log.meta?.userEmail;
  const requestEmail = log.meta?.requestBody?.email;

  // For display purposes, mask emails for privacy
  const displayEmail = userEmail || requestEmail ? "***@***.***" : "Unknown";

  if (userName && userName !== userEmail && userName !== requestEmail) {
    return `${userName}`;
  }

  return displayEmail;
}

function prettyTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function determineMessageType(log: LogEntry): FormattedLog["messageType"] {
  const status = log.meta?.statusCode || log.meta?.responseSummary?.status;

  if (typeof status === "number") {
    if (status >= 400) return "Error";
    if (status >= 200 && status < 300) return "Success";
    if (status >= 300 && status < 400) return "Warning";
  }

  if (log.level === "error") return "Error";
  if (log.level === "warn") return "Warning";

  return "Info";
}

function generateDescription(
  routeInfo: (typeof ROUTE_MAPPING)[string],
  details: any,
  log: LogEntry
): string {
  const baseAction = routeInfo.action;

  if (!details) return baseAction;

  switch (routeInfo.category) {
    case "auth":
      if (routeInfo.action === "Customer Login" || routeInfo.action === "Admin Login") {
        return `${baseAction} ${details.success ? "successful" : "failed"}`;
      }
      if (routeInfo.action === "OTP Generation") {
        return `${baseAction} for ${details.identifier}`;
      }
      if (routeInfo.action === "OTP Verification") {
        return `${baseAction} ${details.success ? "successful" : "failed"} for ${details.identifier}`;
      }
      return baseAction;

    case "cart":
      if (routeInfo.action === "Item Added to Cart") {
        return `Added "${details.productTitle}" (qty: ${details.quantity}) to cart`;
      }
      if (routeInfo.action === "Item Removed from Cart") {
        return `Removed "${details.productTitle}" from cart. ${details.itemsRemaining} items remaining`;
      }
      return baseAction;

    case "product":
      if (details.title) {
        return `${baseAction}: "${details.title}"`;
      }
      if (details.productId) {
        return `${baseAction} (ID: ${details.productId})`;
      }
      return baseAction;

    case "order":
      if (routeInfo.action === "Order Placed" && details.total) {
        return `${baseAction} - Total: $${details.total} (${details.itemCount} items)`;
      }
      if (details.orderId) {
        return `${baseAction} (ID: ${details.orderId})`;
      }
      return baseAction;

    default:
      return baseAction;
  }
}

// Main formatter function
// export function formatActivityLog(log: LogEntry, type: LogType): FormattedLog {
//   const method = log.meta?.method?.toUpperCase() || "GET";
//   const url = log.meta?.url || "";
//   const routeInfo = matchRoute(method, url);

//   let title = type === "admin" ? "Admin Activity" : "Customer Activity";
//   let description = log.message;
//   let category = "system";
//   let details = null;

//   if (routeInfo) {
//     title = routeInfo.action;
//     category = routeInfo.category;

//     // Extract details if function is provided
//     if (routeInfo.extractDetails) {
//       try {
//         details = routeInfo.extractDetails(log);
//       } catch (error) {
//         console.warn("Error extracting details:", error);
//       }
//     }

//     description = generateDescription(routeInfo, details, log);
//   }

//   const messageType = determineMessageType(log);
//   const actionIcon = MESSAGE_ICONS[messageType];
//   const categoryIcon = CATEGORY_ICONS[category] || "📝";

//   return {
//     id: log._id,
//     title: `${categoryIcon} ${title}`,
//     description,
//     author: getAuthor(log),
//     timestamp: prettyTimestamp(log.timestamp),
//     method,
//     url,
//     statusCode: log.meta?.statusCode || log.meta?.responseSummary?.status || "N/A",
//     messageType,
//     actionIcon,
//     category,
//     details,
//   };
// }

// export const formatActivityLog = (log: LogEntry, userType: string) => {
//   let parsedMessage: any = log.meta?.responseSummary?.message;
//   let activityTitle = log.meta?.type || `${userType} Activity`;
//   try {
//     parsedMessage = parsedMessage ? JSON.parse(parsedMessage) : parsedMessage;
//   } catch (e) {
//     // Ignore parse error
//   }

//   const email = log.meta?.userEmail || log.meta?.requestBody?.email || "Guest User";

//   return {
//     id: log._id,
//     title: activityTitle,
//     // description: displayDescription,
//     author: getDisplayEmail(email), // Helper function to show partial email
//     timestamp: new Date(log.timestamp).toLocaleString(),
//     method: log.meta?.method || "N/A",
//     url: log.meta?.url || "N/A",
//     statusCode: status || "N/A",
//     // messageType: messageType,
//     rawData: log, // Include the raw log data for decryption
//   };
// };
export const formatActivityLog = (log: LogEntry, userType: string): FormattedLog => {
  // Parse or use default title
  const activityTitle = log.meta?.type || `${userType} Activity`;

  // Author display
  const email = log.meta?.userEmail || log.meta?.requestBody?.email || "Guest User";

  // Status code and messageType
  const status = log.meta?.statusCode || log.meta?.responseSummary?.status || "N/A";
  let messageType: FormattedLog["messageType"] = "Info";
  if (typeof status === "number") {
    if (status >= 400) messageType = "Error";
    else if (status >= 200 && status < 300) messageType = "Success";
    else if (status >= 300 && status < 400) messageType = "Warning";
  }

  // Map icon
  const actionIcon = MESSAGE_ICONS[messageType];

  // Category, fallback to "system"
  const category = log.meta?.type || "system";

  return {
    id: log._id,
    title: activityTitle,
    description: log.meta.description || log.message, // Default: use log message
    author: getDisplayEmail(email),
    timestamp: new Date(log.timestamp).toLocaleString(),
    method: log.meta?.method || "N/A",
    url: log.meta?.url || "N/A",
    statusCode: status || "N/A",
    messageType,
    actionIcon,
    category,
    details: undefined, // or pick a value if needed
  };
};

const getDisplayEmail = (email: string) => {
  if (!email) return "Unknown";

  // If email looks encrypted (long hex string), show partial
  if (email.length > 50 && /^[a-f0-9]+$/i.test(email)) {
    return `${email.substring(0, 8)}...@encrypted`;
  }

  return email;
};
// Utility function to format logs in batches
export function formatActivityLogs(logs: LogEntry[], type: LogType): FormattedLog[] {
  return logs.map(log => formatActivityLog(log, type));
}

// Utility function to group logs by category
export function groupLogsByCategory(formattedLogs: FormattedLog[]): Record<string, FormattedLog[]> {
  return formattedLogs.reduce(
    (groups, log) => {
      const category = log.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(log);
      return groups;
    },
    {} as Record<string, FormattedLog[]>
  );
}

// Utility function to get activity summary
export function getActivitySummary(formattedLogs: FormattedLog[]) {
  const summary = {
    total: formattedLogs.length,
    byCategory: {} as Record<string, number>,
    byStatus: {
      success: 0,
      error: 0,
      warning: 0,
      info: 0,
    },
    recentActivity: formattedLogs.slice(0, 5),
  };

  formattedLogs.forEach(log => {
    // Count by category
    summary.byCategory[log.category] = (summary.byCategory[log.category] || 0) + 1;

    // Count by status
    switch (log.messageType) {
      case "Success":
        summary.byStatus.success++;
        break;
      case "Error":
        summary.byStatus.error++;
        break;
      case "Warning":
        summary.byStatus.warning++;
        break;
      default:
        summary.byStatus.info++;
    }
  });

  return summary;
}
