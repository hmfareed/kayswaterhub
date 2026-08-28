import { connectDB } from "@/lib/db/mongoose";
import User from "@/models/User";
import Order from "@/models/Order";
import Address from "@/models/Address";
import Review from "@/models/Review";
import { logAdminAction } from "./audit.service";
import mongoose from "mongoose";

export async function getAdminCustomers(params: {
  search?: string;
  status?: "all" | "active" | "disabled";
  page?: number;
  limit?: number;
}) {
  await connectDB();

  const { search, status = "all", page = 1, limit = 20 } = params;
  const query: Record<string, unknown> = { role: "CUSTOMER" };

  if (status === "active") query.isActive = true;
  if (status === "disabled") query.isActive = false;

  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  // Aggregate order stats for returned customers
  const customerIds = customers.map((c) => c._id);
  const orders = await Order.find({ customerId: { $in: customerIds } });

  const enrichedCustomers = customers.map((cust) => {
    const custOrders = orders.filter(
      (o) => o.customerId?.toString() === cust._id.toString()
    );
    const totalSpent = custOrders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED")
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const lastOrder = custOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    return {
      _id: cust._id,
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      isActive: cust.isActive,
      avatar: cust.avatar,
      ordersCount: custOrders.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      lastOrderDate: lastOrder ? lastOrder.createdAt : null,
      lastOrderAmount: lastOrder ? lastOrder.total : null,
      createdAt: cust.createdAt,
    };
  });

  return {
    customers: enrichedCustomers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAdminCustomerById(id: string) {
  await connectDB();

  const customer = await User.findById(id).populate("addresses");
  if (!customer) return null;

  const [orders, reviews, addresses] = await Promise.all([
    Order.find({ customerId: customer._id }).sort({ createdAt: -1 }),
    Review.find({ customerId: customer._id }).sort({ createdAt: -1 }),
    Address.find({ userId: customer._id }),
  ]);

  const totalSpent = orders
    .filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED")
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return {
    customer,
    addresses,
    orders,
    reviews,
    stats: {
      totalOrders: orders.length,
      totalSpent: Math.round(totalSpent * 100) / 100,
      averageOrderValue: orders.length > 0 ? Math.round((totalSpent / orders.length) * 100) / 100 : 0,
    },
  };
}

export async function toggleCustomerActive(id: string, isActive: boolean, adminId?: string) {
  await connectDB();

  const customer = await User.findByIdAndUpdate(
    id,
    { $set: { isActive } },
    { new: true }
  );

  await logAdminAction({
    performedBy: adminId,
    action: isActive ? "CUSTOMER_RESTORED" : "CUSTOMER_DISABLED",
    resource: "User",
    resourceId: id,
    description: `${isActive ? "Restored" : "Disabled"} customer account "${customer?.name}" (${customer?.email || customer?.phone})`,
  });

  return customer;
}
