import { connectDB } from "@/lib/db/mongoose";
import DeliveryZone, { IDeliveryZone } from "@/models/DeliveryZone";
import DeliveryOrder from "@/models/DeliveryOrder";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import { logAdminAction } from "./audit.service";
import mongoose from "mongoose";

export async function getAdminDeliveryOverview() {
  await connectDB();

  const [zones, settings, activeDeliveries, totalDeliveries, completedDeliveries] = await Promise.all([
    DeliveryZone.find().sort({ priority: -1 }),
    Settings.findOne(),
    DeliveryOrder.find({
      status: { $in: ["CREATED", "DRIVER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
    })
      .populate("orderId", "orderNumber total deliveryAddress items")
      .sort({ updatedAt: -1 }),
    DeliveryOrder.countDocuments(),
    DeliveryOrder.countDocuments({ status: "DELIVERED" }),
  ]);

  return {
    storeLocation: settings?.storeLocation || {
      businessName: "Khady's Water Hub & Warehouse",
      address: "East Legon, Boundary Road, Accra",
      region: "Greater Accra",
      city: "Accra",
      coordinates: { lat: 5.6356, lng: -0.1601 },
      defaultDeliveryFee: 20,
      pricePerKm: 2.5,
      freeDeliveryThreshold: 350,
      maxDeliveryRadiusKm: 60,
    },
    zones,
    activeDeliveries,
    stats: {
      activeCount: activeDeliveries.length,
      totalCount: totalDeliveries,
      completedCount: completedDeliveries,
      zonesCount: zones.length,
    },
  };
}

export async function updateStoreLocationSettings(data: any, adminId?: string) {
  await connectDB();

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }

  const prevLocation = settings.storeLocation;
  settings.storeLocation = {
    ...settings.storeLocation,
    ...data,
  };

  await settings.save();

  await logAdminAction({
    performedBy: adminId,
    action: "STORE_LOCATION_UPDATED",
    resource: "Settings",
    description: `Updated warehouse origin GPS location to ${data.address || "new address"} (${data.coordinates?.lat}, ${data.coordinates?.lng})`,
  });

  return settings.storeLocation;
}

export async function createDeliveryZone(data: Partial<IDeliveryZone>, adminId?: string) {
  await connectDB();

  const zone = await DeliveryZone.create(data);

  await logAdminAction({
    performedBy: adminId,
    action: "DELIVERY_ZONE_CREATED",
    resource: "DeliveryZone",
    resourceId: zone._id.toString(),
    description: `Created delivery zone "${zone.name}" (${zone.pricingType}) with fee GH₵${zone.deliveryFee}`,
  });

  return zone;
}

export async function updateDeliveryZone(id: string, data: Partial<IDeliveryZone>, adminId?: string) {
  await connectDB();

  const zone = await DeliveryZone.findByIdAndUpdate(id, { $set: data }, { new: true });

  await logAdminAction({
    performedBy: adminId,
    action: "DELIVERY_ZONE_UPDATED",
    resource: "DeliveryZone",
    resourceId: id,
    description: `Updated delivery zone "${zone?.name}"`,
  });

  return zone;
}

export async function deleteDeliveryZone(id: string, adminId?: string) {
  await connectDB();

  const zone = await DeliveryZone.findByIdAndDelete(id);

  await logAdminAction({
    performedBy: adminId,
    action: "DELIVERY_ZONE_DELETED",
    resource: "DeliveryZone",
    resourceId: id,
    description: `Deleted delivery zone "${zone?.name}"`,
  });

  return true;
}

export async function getActiveDeliveries() {
  await connectDB();

  const deliveries = await DeliveryOrder.find({
    status: { $in: ["CREATED", "DRIVER_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
  })
    .populate("orderId")
    .sort({ updatedAt: -1 });

  return deliveries;
}

export async function getDeliveryHistory(params: {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  await connectDB();

  const { page = 1, limit = 20, dateFrom, dateTo } = params;
  const query: Record<string, unknown> = {
    status: { $in: ["DELIVERED", "FAILED", "CANCELLED"] },
  };

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) (query.createdAt as any).$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      (query.createdAt as any).$lte = end;
    }
  }

  const skip = (page - 1) * limit;

  const [deliveries, total] = await Promise.all([
    DeliveryOrder.find(query)
      .populate("orderId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    DeliveryOrder.countDocuments(query),
  ]);

  return {
    deliveries,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
