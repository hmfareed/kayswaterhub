import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";
import DeliveryOrder from "@/models/DeliveryOrder";

export interface DashboardOverviewData {
  stats: {
    todaySales: number;
    todaySalesChange: number;
    totalOrders: number;
    totalOrdersChange: number;
    totalCustomers: number;
    totalCustomersChange: number;
    totalProducts: number;
    lowStockCount: number;
    pendingDeliveriesCount: number;
  };
  salesOverview: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalRefunds: number;
    totalDeliveryFees: number;
    chartData: {
      date: string;
      revenue: number;
      orders: number;
    }[];
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    phone: string;
    amount: number;
    status: string;
    date: string;
    itemsCount: number;
  }[];
  lowStockProducts: {
    id: string;
    name: string;
    variant: string;
    stock: number;
    threshold: number;
    price: number;
    brand: string;
  }[];
  recentActivity: {
    id: string;
    action: string;
    description: string;
    resource: string;
    date: string;
  }[];
  orderStatusCounts: Record<string, number>;
}

export async function getDashboardOverview(timeframe = "7days"): Promise<DashboardOverviewData> {
  await connectDB();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

  // Timeframe calculation
  let timeframeDays = 7;
  if (timeframe === "today") timeframeDays = 1;
  else if (timeframe === "30days") timeframeDays = 30;
  else if (timeframe === "3months") timeframeDays = 90;
  else if (timeframe === "12months") timeframeDays = 365;

  const timeframeStartDate = new Date(now.getTime() - timeframeDays * 24 * 60 * 60 * 1000);

  // 1. Today's sales vs Yesterday
  const todayOrders = await Order.find({
    createdAt: { $gte: startOfToday },
    status: { $nin: ["CANCELLED", "REFUNDED"] },
  });
  const todaySales = todayOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);

  const yesterdayOrders = await Order.find({
    createdAt: { $gte: startOfYesterday, $lt: startOfToday },
    status: { $nin: ["CANCELLED", "REFUNDED"] },
  });
  const yesterdaySales = yesterdayOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);
  const todaySalesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

  // 2. Orders count
  const totalOrders = await Order.countDocuments();
  const lastWeekOrders = await Order.countDocuments({
    createdAt: { $gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
  });
  const thisWeekOrders = await Order.countDocuments({
    createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
  });
  const totalOrdersChange = lastWeekOrders > 0 ? ((thisWeekOrders - lastWeekOrders) / lastWeekOrders) * 100 : 0;

  // 3. Customers count
  const totalCustomers = await User.countDocuments({ role: "CUSTOMER" });
  const newCustomersThisWeek = await User.countDocuments({
    role: "CUSTOMER",
    createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
  });
  const totalCustomersChange = totalCustomers > 0 ? (newCustomersThisWeek / Math.max(1, totalCustomers)) * 100 : 0;

  // 4. Products count & Low Stock
  const totalProducts = await Product.countDocuments();
  const variants = await ProductVariant.find().populate("productId");
  
  const lowStockVariants = variants.filter(
    (v) => (v.stockQuantity - (v.reservedQuantity || 0)) <= (v.lowStockThreshold || 10)
  );

  // 5. Pending deliveries
  const pendingDeliveriesCount = await Order.countDocuments({
    status: { $in: ["PROCESSING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY"] },
  });

  // 6. Timeframe Chart Data & Aggregations
  const timeframeOrders = await Order.find({
    createdAt: { $gte: timeframeStartDate },
    status: { $nin: ["CANCELLED"] },
  }).sort({ createdAt: 1 });

  let totalRevenue = 0;
  let totalDeliveryFees = 0;
  let totalRefunds = 0;

  const chartMap: Record<string, { revenue: number; orders: number }> = {};

  // Initialize chart buckets
  const daysToGenerate = Math.min(timeframeDays, 30);
  for (let i = daysToGenerate - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    chartMap[key] = { revenue: 0, orders: 0 };
  }

  timeframeOrders.forEach((ord) => {
    totalRevenue += ord.total || 0;
    totalDeliveryFees += ord.deliveryFee || 0;
    if (ord.status === "REFUNDED" && ord.refund?.amount) {
      totalRefunds += ord.refund.amount;
    }

    const key = new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (chartMap[key]) {
      chartMap[key].revenue += ord.total || 0;
      chartMap[key].orders += 1;
    }
  });

  const chartData = Object.keys(chartMap).map((date) => ({
    date,
    revenue: Math.round(chartMap[date].revenue * 100) / 100,
    orders: chartMap[date].orders,
  }));

  const averageOrderValue = timeframeOrders.length > 0 ? totalRevenue / timeframeOrders.length : 0;

  // 7. Recent Orders
  const recentOrdersRaw = await Order.find()
    .sort({ createdAt: -1 })
    .limit(6)
    .populate("customerId", "name phone email");

  const recentOrders = recentOrdersRaw.map((ord) => ({
    id: ord._id.toString(),
    orderNumber: ord.orderNumber,
    customer: ord.guestInformation?.name || (ord.customerId as any)?.name || "Guest Customer",
    phone: ord.guestInformation?.phone || (ord.customerId as any)?.phone || "N/A",
    amount: ord.total,
    status: ord.status,
    date: new Date(ord.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    itemsCount: ord.items?.reduce((cnt, itm) => cnt + itm.quantity, 0) || 0,
  }));

  // 8. Low stock list
  const lowStockProducts = lowStockVariants.slice(0, 6).map((v: any) => ({
    id: v._id.toString(),
    name: v.productId?.name || v.name,
    variant: v.name,
    stock: Math.max(0, v.stockQuantity - (v.reservedQuantity || 0)),
    threshold: v.lowStockThreshold,
    price: v.price,
    brand: v.productId?.brand || "Kay's Water",
  }));

  // 9. Recent Activity from Audit Logs
  const recentAuditLogs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(6);

  const recentActivity = recentAuditLogs.map((log) => ({
    id: log._id.toString(),
    action: log.action,
    description: log.description,
    resource: log.resource,
    date: new Date(log.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  // 10. Status Breakdown
  const orderStatusCounts: Record<string, number> = {};
  const allOrders = await Order.find().select("status");
  allOrders.forEach((o) => {
    orderStatusCounts[o.status] = (orderStatusCounts[o.status] || 0) + 1;
  });

  return {
    stats: {
      todaySales: Math.round(todaySales * 100) / 100,
      todaySalesChange: Math.round(todaySalesChange * 10) / 10,
      totalOrders,
      totalOrdersChange: Math.round(totalOrdersChange * 10) / 10,
      totalCustomers,
      totalCustomersChange: Math.round(totalCustomersChange * 10) / 10,
      totalProducts,
      lowStockCount: lowStockVariants.length,
      pendingDeliveriesCount,
    },
    salesOverview: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: timeframeOrders.length,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      totalRefunds: Math.round(totalRefunds * 100) / 100,
      totalDeliveryFees: Math.round(totalDeliveryFees * 100) / 100,
      chartData,
    },
    recentOrders,
    lowStockProducts,
    recentActivity,
    orderStatusCounts,
  };
}
