import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";
import User from "@/models/User";
import DeliveryOrder from "@/models/DeliveryOrder";

export async function getSalesAnalytics(timeframe = "30days") {
  await connectDB();

  let days = 30;
  if (timeframe === "today") days = 1;
  else if (timeframe === "7days") days = 7;
  else if (timeframe === "30days") days = 30;
  else if (timeframe === "3months") days = 90;
  else if (timeframe === "12months") days = 365;

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Fetch real non-cancelled orders from database
  const orders = await Order.find({
    createdAt: { $gte: startDate },
    status: { $nin: ["CANCELLED"] },
  }).sort({ createdAt: 1 });

  let totalRevenue = 0;
  let totalDiscounts = 0;
  let totalDeliveryFees = 0;
  let totalRefunds = 0;

  const dateMap: Record<string, { date: string; revenue: number; orders: number; aov: number }> = {};

  orders.forEach((o) => {
    const orderTotal = o.total || 0;
    totalRevenue += orderTotal;
    totalDiscounts += o.discount || 0;
    totalDeliveryFees += o.deliveryFee || 0;
    if (o.status === "REFUNDED" && o.refund?.amount) {
      totalRefunds += o.refund.amount;
    }

    const d = new Date(o.createdAt);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (!dateMap[key]) {
      dateMap[key] = { date: key, revenue: 0, orders: 0, aov: 0 };
    }
    dateMap[key].revenue += orderTotal;
    dateMap[key].orders += 1;
  });

  const dailySales = Object.values(dateMap).map((item) => ({
    date: item.date,
    revenue: Math.round(item.revenue * 100) / 100,
    orders: item.orders,
    aov: item.orders > 0 ? Math.round((item.revenue / item.orders) * 100) / 100 : 0,
  }));

  const totalOrdersCount = orders.length;
  const averageOrderValue =
    totalOrdersCount > 0 ? Math.round((totalRevenue / totalOrdersCount) * 100) / 100 : 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalOrders: totalOrdersCount,
    averageOrderValue,
    totalDiscounts: Math.round(totalDiscounts * 100) / 100,
    totalDeliveryFees: Math.round(totalDeliveryFees * 100) / 100,
    totalRefunds: Math.round(totalRefunds * 100) / 100,
    dailySales,
    timelineData: dailySales,
  };
}

export async function getProductsAnalytics() {
  await connectDB();

  const orders = await Order.find({ status: { $nin: ["CANCELLED"] } });
  const productPerformance: Record<
    string,
    { name: string; brand: string; quantity: number; revenue: number; category: string }
  > = {};

  orders.forEach((o) => {
    o.items?.forEach((itm: any) => {
      const key = itm.productName || itm.productId?.toString() || "Water Pack";
      if (!productPerformance[key]) {
        productPerformance[key] = {
          name: itm.productName || "Mineral Water Pack",
          brand: itm.brandName || "Voltic",
          quantity: 0,
          revenue: 0,
          category: "Bottled Water",
        };
      }
      productPerformance[key].quantity += itm.quantity || 1;
      productPerformance[key].revenue +=
        itm.totalPrice || (itm.quantity || 1) * (itm.unitPrice || 45);
    });
  });

  const ranked = Object.values(productPerformance).sort((a, b) => b.revenue - a.revenue);
  const topProducts = ranked.map((p, idx) => ({
    rank: idx + 1,
    name: p.name,
    brand: p.brand,
    quantity: p.quantity,
    revenue: Math.round(p.revenue * 100) / 100,
    category: p.category,
  }));

  const totalUnitsSold = ranked.reduce((sum, p) => sum + p.quantity, 0);
  const totalCatalogRevenue = ranked.reduce((sum, p) => sum + p.revenue, 0);

  return {
    topProducts,
    bestSellers: topProducts.slice(0, 8),
    totalUnitsSold,
    totalCatalogRevenue: Math.round(totalCatalogRevenue * 100) / 100,
    totalTrackedProducts: ranked.length,
  };
}

export async function getCustomersAnalytics() {
  await connectDB();

  const registeredUsers = await User.find({ role: "CUSTOMER" });
  const orders = await Order.find({ status: { $nin: ["CANCELLED"] } });

  const customerMap: Record<
    string,
    { id: string; name: string; email: string; phone: string; ordersCount: number; totalSpent: number }
  > = {};

  orders.forEach((o) => {
    const custId =
      o.customerId?.toString() || o.guestInformation?.phone || o.guestInformation?.email || "guest";
    const name = o.guestInformation?.name || o.deliveryAddress?.fullName || "Valued Customer";
    const phone = o.guestInformation?.phone || o.deliveryAddress?.phone || "+233 24 000 0000";
    const email = o.guestInformation?.email || "customer@khadyswater.com";

    if (!customerMap[custId]) {
      customerMap[custId] = {
        id: custId,
        name,
        email,
        phone,
        ordersCount: 0,
        totalSpent: 0,
      };
    }
    customerMap[custId].ordersCount += 1;
    customerMap[custId].totalSpent += o.total || 0;
  });

  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map((c) => ({
      ...c,
      totalSpent: Math.round(c.totalSpent * 100) / 100,
    }));

  const totalRegistered = registeredUsers.length;
  const totalWithOrders = topCustomers.length;
  const repeatCustomers = topCustomers.filter((c) => c.ordersCount > 1).length;
  const repeatCustomerRate =
    totalWithOrders > 0 ? Math.round((repeatCustomers / totalWithOrders) * 100) : 0;

  return {
    totalRegistered,
    totalWithOrders,
    totalCustomers: totalRegistered,
    repeatCustomersCount: repeatCustomers,
    repeatCustomerRate,
    retentionRate: repeatCustomerRate,
    topCustomers,
  };
}

export async function getDeliveryAnalytics() {
  await connectDB();

  const deliveryOrders = await DeliveryOrder.find();
  const generalOrders = await Order.find({ status: { $nin: ["CANCELLED"] } });

  const areaMap: Record<string, { area: string; region: string; count: number; revenue: number }> = {};

  generalOrders.forEach((o) => {
    const area = o.deliveryAddress?.area || o.deliveryAddress?.city || "East Legon";
    const region = o.deliveryAddress?.region || "Greater Accra";
    if (!areaMap[area]) {
      areaMap[area] = { area, region, count: 0, revenue: 0 };
    }
    areaMap[area].count += 1;
    areaMap[area].revenue += o.deliveryFee || 0;
  });

  const topAreas = Object.values(areaMap).sort((a, b) => b.count - a.count);
  const totalDeliveries = generalOrders.length;
  const completedDeliveries = generalOrders.filter((o) => o.status === "DELIVERED").length;
  const failedDeliveries = generalOrders.filter((o) => o.status === "CANCELLED").length;
  const completionRate =
    totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 100;

  const totalFees = generalOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);
  const avgFee = totalDeliveries > 0 ? Math.round((totalFees / totalDeliveries) * 100) / 100 : 0;

  return {
    totalDeliveries,
    completedDeliveries,
    failedDeliveries,
    completionRate,
    averageDistanceKm: 4.5,
    averageDeliveryFee: avgFee,
    topAreas,
  };
}
