import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";
import User from "@/models/User";
import Settings from "@/models/Settings";
import DeliveryZone from "@/models/DeliveryZone";
import DeliveryOrder from "@/models/DeliveryOrder";
import AuditLog from "@/models/AuditLog";
import Promotion from "@/models/Promotion";
import Payment from "@/models/Payment";
import {
  callGeminiGenerateContent,
  isGeminiConfigured,
  GeminiContent,
  GEMINI_MODEL_NAME,
} from "@/lib/gemini/client";

export interface AdminActionLink {
  label: string;
  href: string;
  icon?: string; // e.g. "Settings", "ShoppingBag", "Radio", "Truck", "Layers", "Tag", "RotateCcw"
  primary?: boolean;
}

export interface AdminChatResponse {
  reply: string;
  actionLinks: AdminActionLink[];
  statsCard?: {
    title: string;
    metrics: Array<{ label: string; value: string | number; change?: string; alert?: boolean }>;
  };
}

// ─── 1. Live Database Tools ──────────────────────────────────────────────────

/**
 * Summarize and query orders for a specific date, date range, or status
 */
export async function getAdminOrdersSummary(params: {
  date?: string; // "today", "yesterday", "YYYY-MM-DD", etc.
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
  limit?: number;
}) {
  await connectDB();

  let start: Date | null = null;
  let end: Date | null = null;
  const now = new Date();

  if (params.date === "today" || (!params.date && !params.dateFrom && !params.dateTo)) {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (params.date === "yesterday") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
  } else if (params.date) {
    const parsed = new Date(params.date);
    if (!isNaN(parsed.getTime())) {
      start = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
      end = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59, 999);
    }
  }

  if (params.dateFrom) {
    start = new Date(params.dateFrom);
  }
  if (params.dateTo) {
    const endParsed = new Date(params.dateTo);
    endParsed.setHours(23, 59, 59, 999);
    end = endParsed;
  }

  const query: Record<string, any> = {};
  if (start && end) {
    query.createdAt = { $gte: start, $lte: end };
  } else if (start) {
    query.createdAt = { $gte: start };
  }

  if (params.status && params.status !== "ALL") {
    const s = params.status.toUpperCase();
    if (s === "PENDING") {
      query.status = { $in: ["PENDING", "PENDING_PAYMENT"] };
    } else if (s === "PAID" || s === "CONFIRMED") {
      query.status = { $in: ["PAID", "CONFIRMED"] };
    } else if (s === "OUT_FOR_DELIVERY") {
      query.status = { $in: ["OUT_FOR_DELIVERY", "IN_TRANSIT"] };
    } else {
      query.status = s;
    }
  }

  if (params.search) {
    const searchRegex = { $regex: params.search.trim(), $options: "i" };
    query.$or = [
      { orderNumber: searchRegex },
      { "guestInformation.name": searchRegex },
      { "guestInformation.phone": searchRegex },
      { "deliveryAddress.city": searchRegex },
      { "deliveryAddress.area": searchRegex },
    ];
  }

  const orders = await Order.find(query)
    .populate("customerId", "name email phone")
    .sort({ createdAt: -1 })
    .limit(params.limit || 15);

  const totalCount = await Order.countDocuments(query);
  const validOrders = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED");
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  for (const o of orders) {
    const st = o.status || "UNKNOWN";
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  }

  return {
    dateLabel: params.date || (start ? start.toLocaleDateString("en-GB") : "All time"),
    totalCount,
    totalRevenue,
    statusCounts,
    sampleOrders: orders.slice(0, 8).map((o: any) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      customerName: o.guestInformation?.name || o.customerId?.name || "Guest Customer",
      customerPhone: o.guestInformation?.phone || o.customerId?.phone || "N/A",
      total: o.total,
      status: o.status,
      itemCount: o.items?.length || 0,
      itemsSummary: (o.items || [])
        .map((i: any) => `${i.quantity}x ${i.productName || i.name || "Pack"}`)
        .join(", "),
      destination: o.deliveryAddress?.area || o.deliveryAddress?.city || "Accra",
      createdAt: o.createdAt,
    })),
  };
}

/**
 * Fetch and lookup any store configuration setting
 */
export async function getAdminSettingsLookup(queryTopic?: string) {
  await connectDB();
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }

  const s = settings.toObject();

  return {
    businessName: s.businessName || "Khady's Water",
    phone: s.phone || "+233 50 490 3022",
    email: s.email || "orders@khadyswater.com",
    address: s.address || "Boundary Road, East Legon, Accra",
    orderingEnabled: s.orderingEnabled !== false,
    minimumOrderAmount: s.minimumOrderAmount ?? 30,
    currency: "GH₵ (GHS)",
    businessHours: s.businessHours || [],
    storeLocation: s.storeLocation || {
      address: "East Legon, Boundary Road, Accra",
      coordinates: { lat: 5.6356, lng: -0.1601 },
      defaultDeliveryFee: 15,
      pricePerKm: 2.5,
      maxDeliveryRadiusKm: 50,
      freeDeliveryThreshold: 100,
      freeDeliveryEnabled: true,
    },
    deliverySettings: s.deliverySettings || {
      greaterAccraEnabled: true,
      nationwideEnabled: true,
      greaterAccraMethod: "ZONE",
      allowGPS: true,
      allowManualAddress: true,
      minimumDeliveryFee: 10,
      maximumDeliveryFee: 60,
    },
    paystackConfigured: !!s.paystack?.secretKey,
    paystackTestMode: s.paystack?.testMode ?? true,
    paystackChannels: s.paystack?.channels || ["card", "mobile_money"],
    inventoryRules: s.inventory || {
      defaultLowStockThreshold: 10,
      allowBackorders: false,
      reservationTtlMinutes: 15,
    },
    notifications: s.notifications || {
      emailEnabled: true,
      smsEnabled: true,
      inAppEnabled: true,
      newOrderAlert: true,
      lowStockAlert: true,
    },
  };
}

/**
 * Fetch live inventory matrix (low stock & out of stock)
 */
export async function getAdminInventoryReport() {
  await connectDB();
  const variants = await ProductVariant.find().populate("productId", "name brandId");
  const totalProducts = await Product.countDocuments();
  const totalUnits = variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);

  const lowStock = variants.filter(
    (v) => (v.stockQuantity - (v.reservedQuantity || 0)) <= (v.lowStockThreshold || 10) &&
           (v.stockQuantity - (v.reservedQuantity || 0)) > 0
  );

  const outOfStock = variants.filter(
    (v) => (v.stockQuantity - (v.reservedQuantity || 0)) <= 0
  );

  return {
    totalProducts,
    totalVariants: variants.length,
    totalUnitsInStock: totalUnits,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStockItems: lowStock.map((v: any) => ({
      id: v._id.toString(),
      name: v.productId?.name ? `${v.productId.name} (${v.name})` : v.name,
      stock: v.stockQuantity,
      threshold: v.lowStockThreshold || 10,
      price: v.price,
      sku: v.sku,
    })),
    outOfStockItems: outOfStock.map((v: any) => ({
      id: v._id.toString(),
      name: v.productId?.name ? `${v.productId.name} (${v.name})` : v.name,
      sku: v.sku,
    })),
  };
}

/**
 * Fetch high level financial and sales metrics
 */
export async function getAdminSalesMetrics() {
  await connectDB();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const startOf7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayOrders, yesterdayOrders, weekOrders, allOrdersCount] = await Promise.all([
    Order.find({ createdAt: { $gte: startOfToday }, status: { $nin: ["CANCELLED", "REFUNDED"] } }),
    Order.find({ createdAt: { $gte: startOfYesterday, $lt: startOfToday }, status: { $nin: ["CANCELLED", "REFUNDED"] } }),
    Order.find({ createdAt: { $gte: startOf7Days }, status: { $nin: ["CANCELLED", "REFUNDED"] } }),
    Order.countDocuments(),
  ]);

  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const pendingDeliveryCount = await Order.countDocuments({
    status: { $in: ["PROCESSING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "PAID", "CONFIRMED"] },
  });

  return {
    todaySales: todayRevenue,
    todayOrdersCount: todayOrders.length,
    yesterdaySales: yesterdayRevenue,
    yesterdayOrdersCount: yesterdayOrders.length,
    weekSales: weekRevenue,
    weekOrdersCount: weekOrders.length,
    totalAllTimeOrders: allOrdersCount,
    pendingDeliveries: pendingDeliveryCount,
    avgOrderValue: weekOrders.length > 0 ? Math.round(weekRevenue / weekOrders.length) : 0,
  };
}

/**
 * System health and database connectivity test
 */
export async function getAdminSystemHealthStatus() {
  await connectDB();
  const startPing = Date.now();
  const [ordersCount, productsCount, usersCount, auditCount, settingsDoc] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments(),
    User.countDocuments(),
    AuditLog.countDocuments(),
    Settings.findOne(),
  ]);
  const latencyMs = Date.now() - startPing;

  return {
    status: "HEALTHY",
    database: "Connected (MongoDB Atlas)",
    latencyMs,
    counts: {
      orders: ordersCount,
      products: productsCount,
      users: usersCount,
      auditLogs: auditCount,
    },
    storeActive: settingsDoc?.orderingEnabled !== false,
  };
}

// ─── 2. How-To Knowledge Base (Step-by-Step Admin Guides) ────────────────────

export interface AdminHowToEntry {
  title: string;
  summary: string;
  steps: string[];
  tips: string[];
  actionLinks: AdminActionLink[];
}

export const ADMIN_KNOWLEDGE_BASE: Record<string, AdminHowToEntry> = {
  minimum_order_amount: {
    title: "How to Configure Minimum Order Amount",
    summary: "Set the minimum cart total (in GH₵) required before a customer can proceed to checkout.",
    steps: [
      "Navigate to **Settings** (`/admin/settings`).",
      "If locked, enter your admin password and click **Unlock Settings**.",
      "Scroll to the **Ordering Settings** card.",
      "Locate the **Minimum Order Amount (GH₵)** input field and enter your desired threshold (e.g. `30` or `50`).",
      "Click the green **Save Settings** button at the bottom of the page.",
    ],
    tips: [
      "Setting this to `0` allows customers to order any amount without restriction.",
      "Any order below this minimum will display a friendly reminder on the customer cart page.",
    ],
    actionLinks: [
      { label: "Open Store Settings", href: "/admin/settings", icon: "Settings", primary: true },
    ],
  },

  toggle_store_ordering: {
    title: "How to Enable / Disable Store Ordering (Maintenance Mode)",
    summary: "Temporarily pause customer checkout or open the store for online orders.",
    steps: [
      "Go to **Settings** (`/admin/settings`).",
      "Unlock settings using your admin password if prompted.",
      "Find the **Store Ordering Status** toggle switch.",
      "Switch it **OFF** to pause online ordering (shows maintenance notice on storefront) or **ON** to accept orders.",
      "Click **Save Settings** to apply immediately.",
    ],
    tips: [
      "When ordering is paused, customers can still browse water packs and prices, but checkout is gracefully disabled.",
    ],
    actionLinks: [
      { label: "Open Store Settings", href: "/admin/settings", icon: "Settings", primary: true },
    ],
  },

  delivery_fees: {
    title: "How to Configure Delivery Fees & Free Delivery",
    summary: "Configure delivery pricing methods (Zone-based flat fees, Distance-based GPS rates, or Nationwide parcel rates).",
    steps: [
      "**Zone-based rates (Accra areas):** Go to **Delivery > Delivery Zones** (`/admin/delivery/zones`) to edit flat fees for areas like East Legon, Airport, Spintex, Tema, etc.",
      "**Distance GPS pricing:** Go to **Delivery > Store Location** (`/admin/delivery/store-location`) to set Base Rate, Price per KM, and Max Radius.",
      "**Free Delivery Threshold:** In **Settings** (`/admin/settings`) or **Delivery > Pricing Rules** (`/admin/delivery/pricing`), set the Free Delivery order threshold (e.g., Free delivery on orders ≥ GH₵100).",
      "**Nationwide Regions:** Go to **Delivery > Regions** (`/admin/delivery/regions`) to configure bus parcel courier rates for Tamale, Kumasi, Takoradi, etc.",
    ],
    tips: [
      "Kay's Packs supports automatic free delivery for orders above the configured threshold.",
      "For station couriers (VIP, OA, STC), rates are applied per region during checkout.",
    ],
    actionLinks: [
      { label: "Delivery Zones", href: "/admin/delivery/zones", icon: "Map", primary: true },
      { label: "Delivery Pricing Rules", href: "/admin/delivery/pricing", icon: "Tag" },
      { label: "Store Location & GPS", href: "/admin/delivery/store-location", icon: "MapPin" },
      { label: "Regional Couriers", href: "/admin/delivery/regions", icon: "Globe" },
    ],
  },

  business_hours: {
    title: "How to Configure Business Operating Hours",
    summary: "Set opening and closing times for each day of the week (Monday through Sunday).",
    steps: [
      "Open **Settings** (`/admin/settings`).",
      "Unlock settings with your admin password.",
      "Find the **Business Operating Hours** section.",
      "For each day (Mon–Sun), toggle whether the store is **Open** or **Closed**, and set the **Open Time** (e.g. `08:00`) and **Close Time** (e.g. `18:00`).",
      "Click **Save Settings** to save.",
    ],
    tips: [
      "The customer chatbot and storefront will inform customers if they place orders outside operating hours.",
    ],
    actionLinks: [
      { label: "Edit Business Hours in Settings", href: "/admin/settings", icon: "Clock", primary: true },
    ],
  },

  paystack_momo: {
    title: "How to Configure Paystack & Mobile Money (MoMo)",
    summary: "Connect Paystack live or test API keys to accept MTN MoMo, Telecel Cash, and Visa/Mastercard.",
    steps: [
      "Go to **Settings** (`/admin/settings`) and unlock with admin password.",
      "Scroll to the **Paystack Payment Gateway** section.",
      "Paste your **Public Key** (`pk_live_...` or `pk_test_...`) and **Secret Key** (`sk_live_...` or `sk_test_...`).",
      "Select **Test Mode** (ON for development/testing, OFF for live real-money payments).",
      "Check the enabled payment channels: `mobile_money` (MTN, Telecel, AT) and `card`.",
      "Click **Save Settings**.",
    ],
    tips: [
      "For MoMo payments, Paystack directly prompts the customer's phone to enter their MoMo PIN.",
      "You can verify payment logs anytime under **Commerce > Payments** (`/admin/payments`).",
    ],
    actionLinks: [
      { label: "Go to Settings (Paystack)", href: "/admin/settings", icon: "CreditCard", primary: true },
      { label: "View Payments Registry", href: "/admin/payments", icon: "CreditCard" },
    ],
  },

  restock_inventory: {
    title: "How to Restock Products or Adjust Stock Levels",
    summary: "Update bottle pack quantities, record warehouse restocks, or write off damaged stock.",
    steps: [
      "Navigate to **Inventory** (`/admin/inventory`).",
      "Find the product variant you wish to adjust (e.g. 'Voltic 500ml Pack of 24').",
      "Click the **Adjust Stock** button next to that item.",
      "Select the **Adjustment Type**: **RESTOCK** (adds inventory), **AUDIT** (sets exact count), **DAMAGED** (deducts spoiled units), or **RETURN**.",
      "Enter the quantity (e.g. `+50`) and an optional note (e.g. 'Batch #402 delivery from factory').",
      "Click **Confirm Adjustment**.",
    ],
    tips: [
      "Every adjustment automatically creates an immutable audit record in **Audit Logs** and **Inventory Transactions**.",
      "Low-stock alert badges appear automatically whenever stock drops below the variant threshold.",
    ],
    actionLinks: [
      { label: "Open Inventory Manager", href: "/admin/inventory", icon: "Radio", primary: true },
      { label: "View Audit Logs", href: "/admin/audit-logs", icon: "Activity" },
    ],
  },

  add_product: {
    title: "How to Add a New Product or Water Brand",
    summary: "Create a new bottled water brand, pack variant, and set prices & images.",
    steps: [
      "Navigate to **Products** (`/admin/products`).",
      "Click the blue **+ Add New Product** button in the top right.",
      "Fill in the **Product Name** (e.g. 'Bel-Aqua Natural Mineral Water'), **Brand**, and **Category**.",
      "Upload or select pack images (via Cloudinary or URL).",
      "Add one or more **Variants** (e.g. '500ml x 24 bottles', '1.5L x 12 bottles', '15L Dispenser Jar') with prices (GH₵) and initial stock.",
      "Set the **Status** to Active and click **Save Product**.",
    ],
    tips: [
      "If you need a new brand (e.g. Special Ice) or category, create it first under **Categories & Brands** (`/admin/categories`).",
    ],
    actionLinks: [
      { label: "Go to Products", href: "/admin/products", icon: "Package", primary: true },
      { label: "Categories & Brands", href: "/admin/categories", icon: "Layers" },
    ],
  },

  manage_orders: {
    title: "How to Manage & Update Order Delivery Status",
    summary: "View incoming orders, verify payments, dispatch drivers, and update order statuses.",
    steps: [
      "Navigate to **Orders** (`/admin/orders`).",
      "Use the top filter tabs to view **All**, **Pending**, **Processing**, **Ready**, or **Out for Delivery**.",
      "Click on any order row to open the **Order Details Modal**.",
      "To update status: Select the new status dropdown (e.g. `PROCESSING` → `READY_FOR_DELIVERY` → `OUT_FOR_DELIVERY` → `DELIVERED`).",
      "Optionally assign a delivery driver name and phone number.",
      "Click **Save Status** to update and automatically trigger SMS/Email notifications to the customer.",
    ],
    tips: [
      "You can print an invoice/receipt directly from the Order Details modal.",
      "Live orders can also be dispatched on the **Delivery > Active Deliveries** board (`/admin/delivery/active`).",
    ],
    actionLinks: [
      { label: "View All Orders", href: "/admin/orders", icon: "ShoppingBag", primary: true },
      { label: "Active Deliveries Dispatch", href: "/admin/delivery/active", icon: "Truck" },
    ],
  },

  process_refund: {
    title: "How to Process a Customer Refund",
    summary: "Review customer cancellation or return requests and issue refunds.",
    steps: [
      "Go to **Commerce > Refunds** (`/admin/refunds`).",
      "Locate the refund request and review the order number, customer reason, and requested amount.",
      "Click **Approve Refund** or **Reject Refund**.",
      "If approving: Select the refund method (**Paystack Automatic Reversal** or **Manual MoMo Payout**), add an internal note, and confirm.",
      "The order status will update to `REFUNDED` and an audit entry will be recorded.",
    ],
    tips: [
      "Once refunded, reserved inventory units are returned to stock if applicable.",
    ],
    actionLinks: [
      { label: "Open Refunds Management", href: "/admin/refunds", icon: "RotateCcw", primary: true },
    ],
  },

  create_promotion: {
    title: "How to Create Discount Coupons & Promo Codes",
    summary: "Set up promotional discount codes for special campaigns, bulk orders, or seasonal offers.",
    steps: [
      "Go to **Commerce > Promotions** (`/admin/promotions`).",
      "Click **+ Create Promotion**.",
      "Enter a **Coupon Code** (e.g. `EASTER10`, `HYDRATE20`, `FREESHIP`).",
      "Choose **Discount Type**: **Percentage** (e.g. 10%) or **Fixed Amount** (e.g. GH₵15).",
      "Set the **Minimum Spend Threshold** (e.g. orders over GH₵80) and **Max Usage Count**.",
      "Set the **Start Date** and **Expiry Date**, then click **Save Promotion**.",
    ],
    tips: [
      "Customers can enter the promo code at checkout and receive an instant cart discount.",
    ],
    actionLinks: [
      { label: "Manage Promotions", href: "/admin/promotions", icon: "Tag", primary: true },
    ],
  },

  export_reports: {
    title: "How to Export Financial & Stock Reports (CSV/PDF)",
    summary: "Download comprehensive sales summaries, tax calculations, and inventory records.",
    steps: [
      "Go to **Analytics & Reports > Export Reports** (`/admin/reports`).",
      "Select the **Report Type**: **Sales Summary**, **Order History**, **Stock Movement**, or **Customer Directory**.",
      "Select your desired **Date Range** (Today, Last 7 Days, This Month, Custom Range).",
      "Click **Export CSV** or **Export PDF** to generate and download the file.",
    ],
    tips: [
      "Exported CSV files can be imported directly into Microsoft Excel, Google Sheets, or accounting software.",
    ],
    actionLinks: [
      { label: "Export Reports", href: "/admin/reports", icon: "FileSpreadsheet", primary: true },
      { label: "Sales Analytics", href: "/admin/analytics/sales", icon: "TrendingUp" },
    ],
  },

  unlock_settings: {
    title: "How to Unlock Admin Settings Security Lock",
    summary: "Sensitive administrative settings (Payment keys, business config) are password protected.",
    steps: [
      "Navigate to **Settings** (`/admin/settings`).",
      "You will see the **Protected Settings** security prompt.",
      "Enter your admin password in the input field.",
      "Click the blue **Unlock Settings** button.",
      "Once verified, the full settings configuration dashboard is unlocked for your current browser session.",
    ],
    tips: [
      "The unlock state remains active in your browser session until you close your tab or log out.",
    ],
    actionLinks: [
      { label: "Open Settings", href: "/admin/settings", icon: "Settings", primary: true },
    ],
  },
};

// ─── 3. Local Smart Admin Engine ──────────────────────────────────────────────

/**
 * Identify intent from admin user prompt and execute live DB queries / return guides.
 */
export async function runLocalAdminEngine(
  messages: Array<{ role: string; content: string }>
): Promise<AdminChatResponse> {
  const lastMsg = messages[messages.length - 1]?.content || "";
  const t = lastMsg.toLowerCase().trim();

  // 1. Check for Order queries with Dates
  const isOrderQuery =
    /\b(order|orders|sales|revenue|delivered|pending|dispatch|dispatched|cancelled)\b/i.test(t);
  
  const isToday = /\b(today|today's|todays)\b/i.test(t);
  const isYesterday = /\b(yesterday|yesterday's|yesterdays)\b/i.test(t);
  const isDateMatch = t.match(/\b(\d{4}-\d{2}-\d{2}|\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{1,2}\/\d{1,2}\/\d{2,4})\b/i);

  if (isOrderQuery && (isToday || isYesterday || isDateMatch || /\b(check|show|list|find|view|how many)\b/i.test(t))) {
    let dateParam: string | undefined = undefined;
    if (isToday) dateParam = "today";
    else if (isYesterday) dateParam = "yesterday";
    else if (isDateMatch) dateParam = isDateMatch[0];

    // Status filter
    let statusParam: string | undefined = undefined;
    if (/\bpending\b/i.test(t)) statusParam = "PENDING";
    else if (/\b(out for delivery|in transit)\b/i.test(t)) statusParam = "OUT_FOR_DELIVERY";
    else if (/\b(delivered|completed)\b/i.test(t)) statusParam = "DELIVERED";
    else if (/\b(cancelled|canceled)\b/i.test(t)) statusParam = "CANCELLED";
    else if (/\b(processing|ready)\b/i.test(t)) statusParam = "PROCESSING";

    const ordersData = await getAdminOrdersSummary({
      date: dateParam,
      status: statusParam,
    });

    let reply = `### 📦 Order Summary for **${ordersData.dateLabel}**\n\n`;
    reply += `Found **${ordersData.totalCount}** total order${ordersData.totalCount === 1 ? "" : "s"} (${statusParam ? `Filter: **${statusParam}**` : "All statuses"}).\n`;
    reply += `- 💰 **Total Revenue:** **GH₵ ${ordersData.totalRevenue.toLocaleString()}**\n`;

    const statuses = Object.entries(ordersData.statusCounts);
    if (statuses.length > 0) {
      reply += `- 📊 **Status Breakdown:** ` + statuses.map(([st, cnt]) => `\`${st}\`: **${cnt}**`).join(" • ") + `\n\n`;
    } else {
      reply += `\n`;
    }

    if (ordersData.sampleOrders.length > 0) {
      reply += `#### Recent Orders:\n`;
      reply += `| Order # | Customer | Items | Total | Status |\n`;
      reply += `| :--- | :--- | :--- | :--- | :--- |\n`;
      for (const ord of ordersData.sampleOrders) {
        reply += `| **${ord.orderNumber}** | ${ord.customerName} | ${ord.itemsSummary || `${ord.itemCount} items`} | GH₵ ${ord.total} | \`${ord.status}\` |\n`;
      }
    } else {
      reply += `*No orders found matching this criteria on this date.*\n`;
    }

    return {
      reply,
      actionLinks: [
        { label: "View in Orders Manager", href: "/admin/orders", icon: "ShoppingBag", primary: true },
        { label: "Active Deliveries", href: "/admin/delivery/active", icon: "Truck" },
        { label: "Sales Analytics", href: "/admin/analytics/sales", icon: "TrendingUp" },
      ],
      statsCard: {
        title: `Orders (${ordersData.dateLabel})`,
        metrics: [
          { label: "Orders Count", value: ordersData.totalCount },
          { label: "Total Revenue", value: `GH₵ ${ordersData.totalRevenue}` },
        ],
      },
    };
  }

  // 2. Check for Specific Settings Lookups
  const isSettingsQuery =
    /\b(setting|settings|configure|configuration|setup|change|find setting|where is|how to set)\b/i.test(t);

  if (isSettingsQuery || /\b(minimum order|min order|operating hours|business hours|paystack|momo key|delivery fee|delivery pricing|free delivery|store name|maintenance mode|store online)\b/i.test(t)) {
    const settings = await getAdminSettingsLookup();

    // Check specific setting topic
    if (/\b(min|minimum)\s+order\b/i.test(t)) {
      const guide = ADMIN_KNOWLEDGE_BASE.minimum_order_amount;
      return {
        reply: `### ⚙️ Minimum Order Amount Setting\n\n` +
          `- **Current Value:** **GH₵ ${settings.minimumOrderAmount}**\n` +
          `- **Location:** Admin Settings → **Ordering Settings** card\n\n` +
          `#### 📋 Steps to Change:\n` +
          guide.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n") +
          `\n\n💡 *Tip: ${guide.tips[0]}*`,
        actionLinks: guide.actionLinks,
      };
    }

    if (/\b(business|operating)\s+hours\b/i.test(t) || /\b(opening|closing)\s+time\b/i.test(t)) {
      const guide = ADMIN_KNOWLEDGE_BASE.business_hours;
      let hoursList = "";
      if (settings.businessHours && settings.businessHours.length > 0) {
        hoursList = settings.businessHours
          .map((h: any) => `• **${h.day}:** ${h.isOpen ? `${h.open} – ${h.close}` : "*Closed*"}`)
          .join("\n");
      } else {
        hoursList = "• **Mon–Sat:** 08:00 – 18:00\n• **Sun:** Closed";
      }

      return {
        reply: `### 🕒 Store Operating Hours Setting\n\n` +
          `#### Current Hours:\n${hoursList}\n\n` +
          `#### 📋 Steps to Edit Hours:\n` +
          guide.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n"),
        actionLinks: guide.actionLinks,
      };
    }

    if (/\b(delivery fee|delivery price|delivery rates|free delivery|shipping fee)\b/i.test(t)) {
      const guide = ADMIN_KNOWLEDGE_BASE.delivery_fees;
      return {
        reply: `### 🚚 Delivery Fees & Pricing Configuration\n\n` +
          `- **Store Base Delivery Fee:** GH₵ ${settings.storeLocation.defaultDeliveryFee}\n` +
          `- **Price per KM (Distance GPS):** GH₵ ${settings.storeLocation.pricePerKm} / km\n` +
          `- **Free Delivery Threshold:** ${settings.storeLocation.freeDeliveryEnabled ? `Free for orders ≥ **GH₵ ${settings.storeLocation.freeDeliveryThreshold}**` : "Disabled"}\n` +
          `- **Accra Delivery Mode:** \`${settings.deliverySettings.greaterAccraMethod}\` (Zone / Distance)\n\n` +
          `#### 📋 How to Configure Different Delivery Types:\n` +
          guide.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n") +
          `\n\n💡 *Tip: ${guide.tips[0]}*`,
        actionLinks: guide.actionLinks,
      };
    }

    if (/\b(paystack|momo|payment|payment gateway|secret key|public key)\b/i.test(t)) {
      const guide = ADMIN_KNOWLEDGE_BASE.paystack_momo;
      return {
        reply: `### 💳 Paystack & Mobile Money (MoMo) Configuration\n\n` +
          `- **Paystack Status:** ${settings.paystackConfigured ? "✅ **Configured & Active**" : "⚠️ **Not Configured**"}\n` +
          `- **Mode:** \`${settings.paystackTestMode ? "TEST MODE" : "LIVE MODE"}\`\n` +
          `- **Supported Channels:** MTN MoMo, Telecel Cash, AT Money, Visa, Mastercard\n\n` +
          `#### 📋 How to Configure Paystack:\n` +
          guide.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n") +
          `\n\n💡 *Tip: ${guide.tips[0]}*`,
        actionLinks: guide.actionLinks,
      };
    }

    if (/\b(maintenance|pause store|enable store|disable store|store online|ordering enabled)\b/i.test(t)) {
      const guide = ADMIN_KNOWLEDGE_BASE.toggle_store_ordering;
      return {
        reply: `### 🛑 Store Online Ordering Status\n\n` +
          `- **Current Status:** ${settings.orderingEnabled ? "🟢 **Online (Accepting Orders)**" : "🔴 **Paused (Maintenance Mode)**"}\n\n` +
          `#### 📋 How to Change Ordering Status:\n` +
          guide.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n"),
        actionLinks: guide.actionLinks,
      };
    }

    // General settings overview
    return {
      reply: `### ⚙️ Store Settings Overview\n\n` +
        `Here is a snapshot of current system configurations:\n` +
        `- 🏢 **Business Name:** **${settings.businessName}**\n` +
        `- 📞 **Official Phone:** **${settings.phone}**\n` +
        `- ✉️ **Contact Email:** **${settings.email}**\n` +
        `- 📍 **Store Location:** **${settings.address}**\n` +
        `- 💰 **Minimum Order:** **GH₵ ${settings.minimumOrderAmount}**\n` +
        `- 🟢 **Store Status:** ${settings.orderingEnabled ? "Accepting Orders" : "Maintenance Mode"}\n` +
        `- 🚚 **Base Delivery Fee:** **GH₵ ${settings.storeLocation.defaultDeliveryFee}** (Free above GH₵ ${settings.storeLocation.freeDeliveryThreshold})\n` +
        `- 💳 **Paystack MoMo:** ${settings.paystackConfigured ? "Configured" : "Needs Setup"}\n\n` +
        `You can ask me specifically how to change any of these settings!`,
      actionLinks: [
        { label: "Open Store Settings", href: "/admin/settings", icon: "Settings", primary: true },
        { label: "Delivery Zones", href: "/admin/delivery/zones", icon: "Map" },
        { label: "Payments Registry", href: "/admin/payments", icon: "CreditCard" },
      ],
    };
  }

  // 3. Check for Inventory & Stock queries
  if (/\b(stock|inventory|low stock|out of stock|restock|units|warehouse|damaged|adjust stock)\b/i.test(t)) {
    const inv = await getAdminInventoryReport();
    const guide = ADMIN_KNOWLEDGE_BASE.restock_inventory;

    let reply = `### 📦 Live Inventory & Stock Report\n\n`;
    reply += `- **Total Units in Stock:** **${inv.totalUnitsInStock.toLocaleString()}** units\n`;
    reply += `- **Low Stock Alert:** **${inv.lowStockCount}** variant${inv.lowStockCount === 1 ? "" : "s"}\n`;
    reply += `- **Out of Stock:** **${inv.outOfStockCount}** variant${inv.outOfStockCount === 1 ? "" : "s"}\n\n`;

    if (inv.lowStockItems.length > 0) {
      reply += `#### ⚠️ Low Stock Variants (Action Needed):\n`;
      for (const it of inv.lowStockItems) {
        reply += `• **${it.name}**: Remaining: **${it.stock}** packs (Threshold: ${it.threshold})\n`;
      }
      reply += `\n`;
    }

    if (inv.outOfStockItems.length > 0) {
      reply += `#### 🚨 Out of Stock Variants:\n`;
      for (const it of inv.outOfStockItems) {
        reply += `• **${it.name}** (SKU: ${it.sku || "N/A"})\n`;
      }
      reply += `\n`;
    }

    reply += `#### 📋 How to Restock Units:\n`;
    reply += guide.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n");

    return {
      reply,
      actionLinks: [
        { label: "Open Inventory Manager", href: "/admin/inventory", icon: "Radio", primary: true },
        { label: "Manage Products", href: "/admin/products", icon: "Package" },
      ],
      statsCard: {
        title: "Inventory Health",
        metrics: [
          { label: "Total Units", value: inv.totalUnitsInStock },
          { label: "Low Stock Items", value: inv.lowStockCount, alert: inv.lowStockCount > 0 },
          { label: "Out of Stock", value: inv.outOfStockCount, alert: inv.outOfStockCount > 0 },
        ],
      },
    };
  }

  // 4. Check for How-To Guides (e.g. "how do i...", "how to...")
  if (/\b(how to|how do i|how can i|guide me|steps to|how do we)\b/i.test(t) || /\b(add product|create promotion|promo code|refund|export report|audit log|unlock)\b/i.test(t)) {
    if (/\b(add|create|new)\s+(product|pack|item|brand)\b/i.test(t)) {
      const g = ADMIN_KNOWLEDGE_BASE.add_product;
      return {
        reply: `### ➕ ${g.title}\n\n${g.summary}\n\n` +
          `#### 📋 Step-by-Step Instructions:\n` +
          g.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n") +
          `\n\n💡 *Tip: ${g.tips[0]}*`,
        actionLinks: g.actionLinks,
      };
    }

    if (/\b(refund|return|reversal)\b/i.test(t)) {
      const g = ADMIN_KNOWLEDGE_BASE.process_refund;
      return {
        reply: `### 🔄 ${g.title}\n\n${g.summary}\n\n` +
          `#### 📋 Step-by-Step Instructions:\n` +
          g.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n") +
          `\n\n💡 *Tip: ${g.tips[0]}*`,
        actionLinks: g.actionLinks,
      };
    }

    if (/\b(promo|discount|coupon|promotion|voucher)\b/i.test(t)) {
      const g = ADMIN_KNOWLEDGE_BASE.create_promotion;
      return {
        reply: `### 🏷️ ${g.title}\n\n${g.summary}\n\n` +
          `#### 📋 Step-by-Step Instructions:\n` +
          g.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n") +
          `\n\n💡 *Tip: ${g.tips[0]}*`,
        actionLinks: g.actionLinks,
      };
    }

    if (/\b(export|report|csv|excel|pdf|download sales)\b/i.test(t)) {
      const g = ADMIN_KNOWLEDGE_BASE.export_reports;
      return {
        reply: `### 📊 ${g.title}\n\n${g.summary}\n\n` +
          `#### 📋 Step-by-Step Instructions:\n` +
          g.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n") +
          `\n\n💡 *Tip: ${g.tips[0]}*`,
        actionLinks: g.actionLinks,
      };
    }

    if (/\b(unlock|security|password|protected)\b/i.test(t)) {
      const g = ADMIN_KNOWLEDGE_BASE.unlock_settings;
      return {
        reply: `### 🔒 ${g.title}\n\n${g.summary}\n\n` +
          `#### 📋 Step-by-Step Instructions:\n` +
          g.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n"),
        actionLinks: g.actionLinks,
      };
    }

    if (/\b(status|driver|dispatch|manage order)\b/i.test(t)) {
      const g = ADMIN_KNOWLEDGE_BASE.manage_orders;
      return {
        reply: `### 🚚 ${g.title}\n\n${g.summary}\n\n` +
          `#### 📋 Step-by-Step Instructions:\n` +
          g.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n") +
          `\n\n💡 *Tip: ${g.tips[0]}*`,
        actionLinks: g.actionLinks,
      };
    }
  }

  // 5. Sales & Financial Metrics
  if (/\b(sales|revenue|performance|earnings|how much|profit|aov|average order)\b/i.test(t)) {
    const sales = await getAdminSalesMetrics();
    return {
      reply: `### 📈 Real-Time Sales & Revenue Overview\n\n` +
        `- 💰 **Today's Revenue:** **GH₵ ${sales.todaySales.toLocaleString()}** (${sales.todayOrdersCount} orders)\n` +
        `- 📅 **Yesterday's Revenue:** **GH₵ ${sales.yesterdaySales.toLocaleString()}** (${sales.yesterdayOrdersCount} orders)\n` +
        `- 📊 **Last 7 Days Revenue:** **GH₵ ${sales.weekSales.toLocaleString()}** (${sales.weekOrdersCount} orders)\n` +
        `- 🏷️ **Average Order Value (AOV):** **GH₵ ${sales.avgOrderValue}**\n` +
        `- 🚚 **Pending Deliveries:** **${sales.pendingDeliveries}** orders waiting for fulfillment\n` +
        `- 📦 **All-Time Total Orders:** **${sales.totalAllTimeOrders}** orders\n`,
      actionLinks: [
        { label: "Sales Analytics Dashboard", href: "/admin/analytics/sales", icon: "TrendingUp", primary: true },
        { label: "Export Financial Reports", href: "/admin/reports", icon: "FileSpreadsheet" },
        { label: "Orders List", href: "/admin/orders", icon: "ShoppingBag" },
      ],
      statsCard: {
        title: "Sales Summary",
        metrics: [
          { label: "Today's Revenue", value: `GH₵ ${sales.todaySales}` },
          { label: "Today's Orders", value: sales.todayOrdersCount },
          { label: "7-Day Sales", value: `GH₵ ${sales.weekSales}` },
          { label: "AOV", value: `GH₵ ${sales.avgOrderValue}` },
        ],
      },
    };
  }

  // 6. System Health & Audit
  if (/\b(health|system|uptime|database|latency|audit|logs|server)\b/i.test(t)) {
    const health = await getAdminSystemHealthStatus();
    return {
      reply: `### 🩺 System Health & Database Diagnostics\n\n` +
        `- **Status:** 🟢 **${health.status}**\n` +
        `- **Database:** **${health.database}**\n` +
        `- **Ping Latency:** **${health.latencyMs} ms**\n` +
        `- **Store Ordering:** ${health.storeActive ? "🟢 Active" : "🔴 Maintenance Mode"}\n\n` +
        `#### Database Records Count:\n` +
        `• Orders: **${health.counts.orders}** | Products: **${health.counts.products}** | Customers: **${health.counts.users}** | Audit Logs: **${health.counts.auditLogs}**`,
      actionLinks: [
        { label: "System Health Page", href: "/admin/system-health", icon: "HeartPulse", primary: true },
        { label: "Audit Logs", href: "/admin/audit-logs", icon: "Activity" },
      ],
    };
  }

  // 7. General Assistant Greeting / Capabilities Fallback
  return {
    reply: `👋 Hello Admin! I am your **Operations AI Copilot** for Kay's Packs.\n\n` +
      `I can help you manage and understand literally everything across the admin panel:\n\n` +
      `• 📦 **Check Orders:** Ask *"Show me today's orders"*, *"Orders on August 30"*, or *"How many orders are pending?"*\n` +
      `• ⚙️ **Find & Configure Settings:** Ask *"Where is the minimum order setting?"*, *"How to change delivery fees"*, or *"How to set business hours"*\n` +
      `• 📉 **Inventory Checks:** Ask *"Check low stock"*, *"How to restock Voltic 500ml"*, or *"What is out of stock?"*\n` +
      `• 💳 **Payment & MoMo Setup:** Ask *"How to configure Paystack"* or *"Check payment methods"*\n` +
      `• 📈 **Sales Analytics:** Ask *"What is today's revenue?"* or *"Show 7-day sales"*\n` +
      `• 🚚 **Delivery Zones & GPS:** Ask *"How to edit delivery zones"* or *"How to set driver rates"*\n\n` +
      `What would you like assistance with right now?`,
    actionLinks: [
      { label: "Today's Orders", href: "/admin/orders", icon: "ShoppingBag", primary: true },
      { label: "Inventory Matrix", href: "/admin/inventory", icon: "Radio" },
      { label: "Store Settings", href: "/admin/settings", icon: "Settings" },
      { label: "Delivery Hub", href: "/admin/delivery", icon: "Truck" },
    ],
  };
}

// ─── 4. Gemini Engine for Admin Copilot ───────────────────────────────────────

export const ADMIN_COPILOT_TOOLS = [
  {
    name: "getOrdersSummary",
    description: "Get summary of store orders for today, yesterday, or a specific date with revenue, status counts, and sample orders.",
    parameters: {
      type: "OBJECT",
      properties: {
        date: { type: "STRING", description: "'today', 'yesterday', or 'YYYY-MM-DD'" },
        status: { type: "STRING", description: "Filter by status: PENDING, CONFIRMED, PROCESSING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED" },
        search: { type: "STRING", description: "Search by customer name, phone, or order number" },
      },
    },
  },
  {
    name: "getSettingsLookup",
    description: "Lookup live store settings (business hours, delivery rates, minimum order, paystack, GPS coordinates, notifications).",
    parameters: {
      type: "OBJECT",
      properties: {
        settingTopic: { type: "STRING", description: "Specific setting to lookup e.g. 'minimum_order', 'delivery_fees', 'paystack', 'hours'" },
      },
    },
  },
  {
    name: "getInventoryStatus",
    description: "Get current stock levels, low stock products, and out of stock variants from the warehouse inventory.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "getSalesMetrics",
    description: "Get real-time sales revenue, average order value, today vs yesterday comparison, and pending deliveries.",
    parameters: {
      type: "OBJECT",
      properties: {
        timeframe: { type: "STRING", description: "'today', '7days', '30days'" },
      },
    },
  },
  {
    name: "getSystemHealth",
    description: "Check database connection status, server response latency, and collection record counts.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
];

export async function runGeminiAdminEngine(
  messages: Array<{ role: string; content: string }>
): Promise<AdminChatResponse | null> {
  const systemInstruction = `You are "Kay's Admin Operations Copilot", the intelligent, authoritative operations AI assistant for the Kay's Packs administrative management portal.
You assist the business owner (Khadijah Abass) and operations staff with managing orders, configuring settings, tracking inventory, dispatching deliveries, analyzing sales, and executing administrative tasks.

ADMIN PANEL SITEMAP & CAPABILITIES:
- Main: Dashboard (/admin/dashboard), Orders (/admin/orders), Products (/admin/products), Categories & Brands (/admin/categories), Inventory (/admin/inventory), Customers (/admin/customers)
- Commerce: Payments (/admin/payments), Refunds (/admin/refunds), Promotions (/admin/promotions), Reviews (/admin/reviews)
- Delivery & GPS: Overview (/admin/delivery), Store Location & GPS (/admin/delivery/store-location), Delivery Zones (/admin/delivery/zones), Regions (/admin/delivery/regions), Pricing Rules (/admin/delivery/pricing), Active Deliveries (/admin/delivery/active)
- Analytics & Reports: Sales Analytics (/admin/analytics/sales), Products Analytics (/admin/analytics/products), Export Reports (/admin/reports)
- System: Audit Logs (/admin/audit-logs), System Health (/admin/system-health), Settings (/admin/settings)

OPERATIONAL RULES:
1. ALWAYS use the provided tools to query real live data for orders, settings, inventory, sales, and health. Never make up order numbers or fake stock counts.
2. When answering "how to" or "where is" questions, provide clear numbered step-by-step instructions with the exact page URL and input field names.
3. Be professional, direct, concise, and structured. Use Markdown tables and bullet points for readability.`;

  const contents: GeminiContent[] = [];
  for (const msg of messages) {
    const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
    contents.push({ role, parts: [{ text: msg.content || "" }] });
  }

  if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
    contents.push({ role: "user", parts: [{ text: "Hello!" }] });
  }

  const response = await callGeminiGenerateContent({
    model: GEMINI_MODEL_NAME,
    contents,
    systemInstruction,
    temperature: 0.1,
    tools: [{ functionDeclarations: ADMIN_COPILOT_TOOLS }],
  });

  if (response.functionCalls.length > 0) {
    // Execute tool
    for (const call of response.functionCalls) {
      if (call.name === "getOrdersSummary") {
        const res = await getAdminOrdersSummary(call.args as any);
        return {
          reply: `### 📦 Order Summary for **${res.dateLabel}**\n\n` +
            `Total Orders: **${res.totalCount}** | Total Revenue: **GH₵ ${res.totalRevenue.toLocaleString()}**\n\n` +
            (res.sampleOrders.length > 0 ? `#### Recent Orders:\n` + res.sampleOrders.map(o => `• **${o.orderNumber}** - ${o.customerName} (GH₵ ${o.total}) - \`${o.status}\``).join("\n") : "No orders found for this date."),
          actionLinks: [
            { label: "View in Orders Manager", href: "/admin/orders", icon: "ShoppingBag", primary: true },
          ],
        };
      } else if (call.name === "getSettingsLookup") {
        const s = await getAdminSettingsLookup();
        return {
          reply: `### ⚙️ Store Settings Lookup\n\n` +
            `- **Business Name:** ${s.businessName}\n` +
            `- **Minimum Order:** GH₵ ${s.minimumOrderAmount}\n` +
            `- **Store Ordering:** ${s.orderingEnabled ? "🟢 Online" : "🔴 Maintenance Mode"}\n` +
            `- **Base Delivery Fee:** GH₵ ${s.storeLocation.defaultDeliveryFee}\n` +
            `- **Free Delivery Threshold:** GH₵ ${s.storeLocation.freeDeliveryThreshold}\n` +
            `- **Paystack MoMo:** ${s.paystackConfigured ? "Configured" : "Not configured"}\n`,
          actionLinks: [
            { label: "Open Settings", href: "/admin/settings", icon: "Settings", primary: true },
          ],
        };
      } else if (call.name === "getInventoryStatus") {
        const inv = await getAdminInventoryReport();
        return {
          reply: `### 📦 Warehouse Inventory Status\n\n` +
            `- Total Units in Stock: **${inv.totalUnitsInStock}**\n` +
            `- Low Stock Alerts: **${inv.lowStockCount}** variants\n` +
            `- Out of Stock: **${inv.outOfStockCount}** variants\n\n` +
            (inv.lowStockItems.length > 0 ? inv.lowStockItems.map(i => `• ⚠️ **${i.name}**: ${i.stock} remaining (Threshold: ${i.threshold})`).join("\n") : "All stock levels healthy!"),
          actionLinks: [
            { label: "Open Inventory Manager", href: "/admin/inventory", icon: "Radio", primary: true },
          ],
        };
      } else if (call.name === "getSalesMetrics") {
        const sl = await getAdminSalesMetrics();
        return {
          reply: `### 📈 Sales Summary\n\n` +
            `- Today's Sales: **GH₵ ${sl.todaySales}** (${sl.todayOrdersCount} orders)\n` +
            `- Yesterday's Sales: **GH₵ ${sl.yesterdaySales}** (${sl.yesterdayOrdersCount} orders)\n` +
            `- Last 7 Days: **GH₵ ${sl.weekSales}** (${sl.weekOrdersCount} orders)\n` +
            `- Average Order Value: **GH₵ ${sl.avgOrderValue}**`,
          actionLinks: [
            { label: "Sales Analytics", href: "/admin/analytics/sales", icon: "TrendingUp", primary: true },
          ],
        };
      } else if (call.name === "getSystemHealth") {
        const h = await getAdminSystemHealthStatus();
        return {
          reply: `### 🩺 System Diagnostics\n\n` +
            `- Status: 🟢 **${h.status}**\n` +
            `- Database: **${h.database}** (${h.latencyMs}ms)\n` +
            `- Orders: **${h.counts.orders}** | Products: **${h.counts.products}** | Customers: **${h.counts.users}**`,
          actionLinks: [
            { label: "System Health", href: "/admin/system-health", icon: "HeartPulse", primary: true },
          ],
        };
      }
    }
  }

  if (response.text) {
    return {
      reply: response.text,
      actionLinks: [
        { label: "Admin Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard", primary: true },
        { label: "Orders", href: "/admin/orders", icon: "ShoppingBag" },
        { label: "Settings", href: "/admin/settings", icon: "Settings" },
      ],
    };
  }

  return null;
}
