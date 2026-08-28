import mongoose from "mongoose";
import Settings from "@/models/Settings";
import { connectDB } from "@/lib/db/mongoose";

export interface SystemHealthStatus {
  database: {
    status: "OPERATIONAL" | "DEGRADED" | "DOWN";
    latencyMs: number;
    connections: number;
    message?: string;
  };
  api: {
    status: "OPERATIONAL" | "DEGRADED" | "DOWN";
    uptimeSeconds: number;
    nodeVersion: string;
    environment: string;
  };
  paystack: {
    status: "CONNECTED" | "NOT_CONFIGURED" | "TEST_MODE" | "LIVE_MODE";
    configured: boolean;
    testMode: boolean;
  };
  deliveryProvider: {
    provider: "INTERNAL" | "YANGO";
    status: "CONNECTED" | "READY" | "DISABLED";
    message: string;
  };
  storage: {
    status: "OPERATIONAL" | "WARNING";
    provider: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  lastChecked: string;
}

export async function getSystemHealth(): Promise<SystemHealthStatus> {
  const start = Date.now();
  let dbStatus: "OPERATIONAL" | "DEGRADED" | "DOWN" = "DOWN";
  let dbLatency = 0;
  let connections = 1;

  try {
    await connectDB();
    const state = mongoose.connection.readyState;
    dbLatency = Date.now() - start;
    if (state === 1) {
      dbStatus = "OPERATIONAL";
    } else {
      dbStatus = "DEGRADED";
    }
  } catch (err: any) {
    dbStatus = "DOWN";
  }

  const settings = await Settings.findOne();

  const isPaystackConfigured = Boolean(
    process.env.PAYSTACK_SECRET_KEY || settings?.paystack?.secretKey
  );
  const isPaystackTestMode = settings?.paystack?.testMode !== false;

  return {
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
      connections,
    },
    api: {
      status: "OPERATIONAL",
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
    },
    paystack: {
      status: isPaystackConfigured
        ? isPaystackTestMode
          ? "TEST_MODE"
          : "LIVE_MODE"
        : "CONNECTED",
      configured: isPaystackConfigured,
      testMode: isPaystackTestMode,
    },
    deliveryProvider: {
      provider: settings?.deliveryProvider?.defaultProvider || "INTERNAL",
      status: settings?.deliveryProvider?.yangoEnabled ? "CONNECTED" : "READY",
      message: settings?.deliveryProvider?.yangoEnabled
        ? "Yango Delivery Dispatch integration enabled"
        : "Internal driver / GPS Zone dispatcher active",
    },
    storage: {
      status: "OPERATIONAL",
      provider: process.env.CLOUDINARY_CLOUD_NAME ? "CLOUDINARY / LOCAL" : "LOCAL / PUBLIC",
    },
    notifications: {
      email: settings?.notifications?.emailEnabled !== false,
      sms: settings?.notifications?.smsEnabled === true,
      inApp: settings?.notifications?.inAppEnabled !== false,
    },
    lastChecked: new Date().toISOString(),
  };
}
