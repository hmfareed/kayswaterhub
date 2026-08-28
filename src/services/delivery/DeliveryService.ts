/**
 * Delivery Service Abstraction
 *
 * Architecture Rule 6: Never hard-code Yango throughout the application.
 * All delivery logic goes through DeliveryService → adapter pattern.
 */

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface CreateDeliveryPayload {
  orderId: string;
  orderReference: string;
  pickupAddress: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    coordinates?: { lat: number; lng: number };
    deliveryInstructions?: string;
  };
}

export interface DeliveryProviderResult {
  providerOrderId: string;
  trackingUrl?: string;
  estimatedTime?: string;
  driverName?: string;
  driverPhone?: string;
  rawResponse?: unknown;
}

// ─── Provider interface — implement this for each delivery company ─────────────

export interface IDeliveryAdapter {
  createDelivery(
    payload: CreateDeliveryPayload
  ): Promise<DeliveryProviderResult>;
  cancelDelivery(providerOrderId: string): Promise<void>;
  getStatus(providerOrderId: string): Promise<string>;
}

// ─── Yango Adapter ────────────────────────────────────────────────────────────

export class YangoAdapter implements IDeliveryAdapter {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = "https://api.yango.com/v1"; // placeholder — confirm with Yango docs

  constructor() {
    this.apiKey = process.env.YANGO_API_KEY ?? "";
    this.apiSecret = process.env.YANGO_API_SECRET ?? "";
  }

  async createDelivery(
    payload: CreateDeliveryPayload
  ): Promise<DeliveryProviderResult> {
    // TODO: implement Yango API call
    // Reference: https://yango.com/en_gh/business/
    console.log("[YangoAdapter] createDelivery called", payload);
    throw new Error(
      "YangoAdapter.createDelivery not yet implemented. Add Yango API credentials and implement the API call."
    );
  }

  async cancelDelivery(providerOrderId: string): Promise<void> {
    // TODO: implement Yango cancellation
    console.log("[YangoAdapter] cancelDelivery called", providerOrderId);
    throw new Error("YangoAdapter.cancelDelivery not yet implemented.");
  }

  async getStatus(providerOrderId: string): Promise<string> {
    // TODO: implement Yango status check
    console.log("[YangoAdapter] getStatus called", providerOrderId);
    throw new Error("YangoAdapter.getStatus not yet implemented.");
  }
}

// ─── DeliveryService — the single entry point used by the rest of the app ─────

export class DeliveryService {
  private adapter: IDeliveryAdapter;

  constructor(adapter?: IDeliveryAdapter) {
    // Default to Yango; swap adapter to change provider
    this.adapter = adapter ?? new YangoAdapter();
  }

  async createDelivery(
    payload: CreateDeliveryPayload
  ): Promise<DeliveryProviderResult> {
    return this.adapter.createDelivery(payload);
  }

  async cancelDelivery(providerOrderId: string): Promise<void> {
    return this.adapter.cancelDelivery(providerOrderId);
  }

  async getStatus(providerOrderId: string): Promise<string> {
    return this.adapter.getStatus(providerOrderId);
  }
}

// Singleton instance
export const deliveryService = new DeliveryService();
