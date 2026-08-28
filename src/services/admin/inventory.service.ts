import { connectDB } from "@/lib/db/mongoose";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";
import InventoryTransaction from "@/models/InventoryTransaction";
import { logAdminAction } from "./audit.service";
import mongoose from "mongoose";

export async function getAdminInventoryOverview(params: {
  search?: string;
  statusFilter?: "all" | "low_stock" | "out_of_stock" | "in_stock";
  page?: number;
  limit?: number;
}) {
  await connectDB();

  const { search, statusFilter = "all", page = 1, limit = 20 } = params;

  // 1. Overall stats
  const allVariants = await ProductVariant.find();
  const totalProducts = await Product.countDocuments();
  const totalUnits = allVariants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
  const lowStockCount = allVariants.filter(
    (v) => (v.stockQuantity - (v.reservedQuantity || 0)) <= (v.lowStockThreshold || 10) && (v.stockQuantity - (v.reservedQuantity || 0)) > 0
  ).length;
  const outOfStockCount = allVariants.filter(
    (v) => (v.stockQuantity - (v.reservedQuantity || 0)) <= 0
  ).length;

  // 2. Query variants with populated product
  const query: Record<string, unknown> = {};
  if (search && search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { sku: { $regex: search.trim(), $options: "i" } },
      { bottleSize: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const variants = await ProductVariant.find(query)
    .populate("productId", "name brandId categoryId images")
    .sort({ stockQuantity: 1 });

  let filtered = variants;
  if (statusFilter === "low_stock") {
    filtered = variants.filter(
      (v) => (v.stockQuantity - (v.reservedQuantity || 0)) <= (v.lowStockThreshold || 10) && (v.stockQuantity - (v.reservedQuantity || 0)) > 0
    );
  } else if (statusFilter === "out_of_stock") {
    filtered = variants.filter((v) => (v.stockQuantity - (v.reservedQuantity || 0)) <= 0);
  } else if (statusFilter === "in_stock") {
    filtered = variants.filter((v) => (v.stockQuantity - (v.reservedQuantity || 0)) > (v.lowStockThreshold || 10));
  }

  const skip = (page - 1) * limit;
  const paginatedVariants = filtered.slice(skip, skip + limit);

  return {
    stats: {
      totalProducts,
      totalUnits,
      lowStockCount,
      outOfStockCount,
    },
    items: paginatedVariants.map((v: any) => ({
      _id: v._id,
      productName: v.productId?.name || v.name,
      variantName: v.name,
      sku: v.sku || "N/A",
      bottleSize: v.bottleSize,
      unitsPerPack: v.unitsPerPack,
      price: v.price,
      stockQuantity: v.stockQuantity,
      reservedQuantity: v.reservedQuantity || 0,
      availableQuantity: Math.max(0, v.stockQuantity - (v.reservedQuantity || 0)),
      lowStockThreshold: v.lowStockThreshold || 10,
      isAvailable: v.isAvailable,
      status:
        v.stockQuantity <= 0
          ? "OUT_OF_STOCK"
          : v.stockQuantity <= (v.lowStockThreshold || 10)
          ? "LOW_STOCK"
          : "IN_STOCK",
    })),
    pagination: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
}

export async function adjustVariantStock(data: {
  variantId: string;
  adjustment: number; // e.g. +20 or -5
  reasonType: "RESTOCK" | "ADJUSTMENT" | "DAMAGED" | "RETURN";
  note?: string;
  adminId?: string;
  adminName?: string;
}) {
  await connectDB();

  const variant = await ProductVariant.findById(data.variantId).populate("productId", "name");
  if (!variant) throw new Error("Variant not found");

  const prevStock = variant.stockQuantity;
  const newStock = Math.max(0, prevStock + data.adjustment);
  variant.stockQuantity = newStock;
  await variant.save();

  // Record inventory transaction
  const tx = await InventoryTransaction.create({
    variantId: variant._id,
    productId: variant.productId,
    type: data.reasonType,
    quantityChange: data.adjustment,
    previousStock: prevStock,
    newStock,
    reason: data.note || `Manual adjustment: ${data.reasonType} (${data.adjustment > 0 ? "+" : ""}${data.adjustment})`,
    performedBy: data.adminId,
  });

  // Audit log
  await logAdminAction({
    performedBy: data.adminId,
    action: "INVENTORY_ADJUSTED",
    resource: "ProductVariant",
    resourceId: variant._id.toString(),
    description: `Adjusted stock for "${(variant.productId as any)?.name || variant.name} (${variant.name})": ${prevStock} → ${newStock} (${data.reasonType})`,
    changes: [
      {
        field: "stockQuantity",
        before: prevStock,
        after: newStock,
      },
    ],
  });

  return { variant, transaction: tx };
}

export async function getInventoryTransactions(limit = 30) {
  await connectDB();

  const transactions = await InventoryTransaction.find()
    .populate("productId", "name")
    .populate("variantId", "name bottleSize")
    .populate("performedBy", "name")
    .sort({ createdAt: -1 })
    .limit(limit);

  return transactions;
}
