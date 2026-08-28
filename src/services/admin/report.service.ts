import { connectDB } from "@/lib/db/mongoose";
import Order from "@/models/Order";
import ProductVariant from "@/models/ProductVariant";
import User from "@/models/User";
import Payment from "@/models/Payment";

export async function generateReportData(type: "sales" | "orders" | "inventory" | "customers" | "payments", params?: {
  dateFrom?: string;
  dateTo?: string;
}) {
  await connectDB();

  const query: Record<string, unknown> = {};
  if (params?.dateFrom || params?.dateTo) {
    query.createdAt = {};
    if (params.dateFrom) (query.createdAt as any).$gte = new Date(params.dateFrom);
    if (params.dateTo) {
      const end = new Date(params.dateTo);
      end.setHours(23, 59, 59, 999);
      (query.createdAt as any).$lte = end;
    }
  }

  switch (type) {
    case "sales":
    case "orders": {
      const orders = await Order.find(query).sort({ createdAt: -1 });
      return orders.map((o) => ({
        "Order Number": o.orderNumber,
        "Customer Name": o.guestInformation?.name || "Customer",
        "Phone": o.guestInformation?.phone || "",
        "Items Count": o.items?.reduce((cnt, itm) => cnt + itm.quantity, 0) || 0,
        "Subtotal (GH₵)": o.subtotal,
        "Discount (GH₵)": o.discount,
        "Delivery Fee (GH₵)": o.deliveryFee,
        "Total (GH₵)": o.total,
        "Status": o.status,
        "Payment Method": o.paymentMethod || "PAYSTACK",
        "Region": o.deliveryAddress?.region || "",
        "City": o.deliveryAddress?.city || "",
        "Date": new Date(o.createdAt).toISOString(),
      }));
    }

    case "inventory": {
      const variants = await ProductVariant.find().populate("productId", "name brand category");
      return variants.map((v: any) => ({
        "Product Name": v.productId?.name || v.name,
        "Variant": v.name,
        "SKU": v.sku || "",
        "Bottle Size": v.bottleSize,
        "Units Per Pack": v.unitsPerPack,
        "Price (GH₵)": v.price,
        "Stock Quantity": v.stockQuantity,
        "Reserved Quantity": v.reservedQuantity || 0,
        "Available Quantity": Math.max(0, v.stockQuantity - (v.reservedQuantity || 0)),
        "Low Stock Threshold": v.lowStockThreshold || 10,
        "Status": v.stockQuantity <= 0 ? "OUT_OF_STOCK" : v.stockQuantity <= (v.lowStockThreshold || 10) ? "LOW_STOCK" : "IN_STOCK",
      }));
    }

    case "customers": {
      const customers = await User.find({ role: "CUSTOMER" }).sort({ createdAt: -1 });
      const orders = await Order.find({ status: { $nin: ["CANCELLED", "REFUNDED"] } });
      return customers.map((c) => {
        const custOrders = orders.filter((o) => o.customerId?.toString() === c._id.toString());
        const totalSpent = custOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        return {
          "Customer Name": c.name,
          "Email": c.email || "",
          "Phone": c.phone || "",
          "Active": c.isActive ? "YES" : "NO",
          "Total Orders": custOrders.length,
          "Total Spent (GH₵)": totalSpent,
          "Joined Date": new Date(c.createdAt).toISOString(),
        };
      });
    }

    case "payments": {
      const payments = await Payment.find(query).populate("orderId", "orderNumber total").sort({ createdAt: -1 });
      return payments.map((p: any) => ({
        "Payment Reference": p.reference,
        "Order Number": p.orderId?.orderNumber || "N/A",
        "Amount (GH₵)": p.amount,
        "Currency": p.currency,
        "Method": p.method,
        "Status": p.status,
        "Transaction ID": p.transactionId || "",
        "Date": new Date(p.createdAt).toISOString(),
      }));
    }

    default:
      return [];
  }
}
