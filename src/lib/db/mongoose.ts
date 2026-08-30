import mongoose from "mongoose";
import dns from "node:dns";

// Fix for Node.js / Bun Windows DNS querySrv ECONNREFUSED on MongoDB Atlas SRV URLs
function configureDns() {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    if (typeof dns.setDefaultResultOrder === "function") {
      dns.setDefaultResultOrder("ipv4first");
    }
  } catch {
    // Ignore in environments where setting DNS servers is not allowed
  }
}

configureDns();

/**
 * Global cache to prevent creating multiple connections in Next.js
 * dev mode (module hot-reloading creates new imports on every change).
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cached;

/**
 * Register every Mongoose model so that .populate() references never throw
 * "Schema hasn't been registered for model X".
 *
 * Next.js hot-reloading clears the JS module cache between requests, but
 * the Mongoose connection (stored on `global`) persists. That means a model
 * referenced via .populate() may not have been imported by the calling route
 * yet. Importing all models here — after every connectDB() call — ensures
 * they are always registered before any query runs.
 */
function ensureModelsRegistered() {
  // Dynamic requires avoid circular-import issues and are safe in Node.js.
  // Each model file already guards against double-registration with the
  //   mongoose.models.X ?? mongoose.model("X", schema)
  // pattern, so importing them multiple times is a no-op.
  require("@/models/User");
  require("@/models/Order");
  require("@/models/Payment");
  require("@/models/DeliveryOrder");
  require("@/models/Product");
  require("@/models/ProductVariant");
  require("@/models/Brand");
  require("@/models/Category");
  require("@/models/Cart");
  require("@/models/Notification");
  require("@/models/InventoryTransaction");
  require("@/models/StockReservation");
  require("@/models/Address");
  require("@/models/Promotion");
  require("@/models/Review");
  require("@/models/Settings");
  require("@/models/AuditLog");
  require("@/models/DeliveryRegion");
  require("@/models/DeliveryZone");
  require("@/models/DeliveryException");
  require("@/models/BulkOrder");
  require("@/models/PricingRule");
}

export async function connectDB(): Promise<typeof mongoose> {
  configureDns();

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable in .env.local"
    );
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    // Connection already active — still ensure all models are registered
    // in case this module was re-imported after a hot-reload.
    ensureModelsRegistered();
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        dbName: "khadys_water",
      })
      .then((m) => {
        console.log("✅ MongoDB connected");
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  // Register all models after connection is confirmed
  ensureModelsRegistered();

  return cached.conn;
}

export default connectDB;
