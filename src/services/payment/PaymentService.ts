import crypto from "crypto";

/**
 * PaymentService — provider-agnostic payment abstraction.
 *
 * Architecture rules enforced:
 * - Rule 2: Payment only confirmed via server-side webhook, never frontend signal.
 * - Supports Ghana payment channels: MTN MoMo, Telecel Cash, AirtelTigo, Visa, Mastercard, Bank.
 */

export interface InitiatePaymentPayload {
  reference: string;
  amount: number; // in GHS
  email: string;
  phone?: string;
  method?: "MOBILE_MONEY" | "BANK" | "PAYSTACK" | string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitiatePaymentResult {
  authorizationUrl: string; // URL for Paystack checkout
  accessCode?: string;
  reference: string;
  providerReference?: string;
  isSimulated?: boolean;
}

export interface VerifyPaymentResult {
  success: boolean;
  amount: number; // in GHS
  currency: string;
  transactionId: string;
  paidAt: Date;
  channel?: string;
  customer?: {
    email: string;
    phone?: string;
  };
  metadata?: Record<string, unknown>;
  error?: string;
}

// ─── Provider interface ────────────────────────────────────────────────────────

export interface IPaymentAdapter {
  initiatePayment(payload: InitiatePaymentPayload): Promise<InitiatePaymentResult>;
  verifyPayment(reference: string): Promise<VerifyPaymentResult>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

// ─── Paystack Adapter ──────────────────────────────────────────────────────────

export class PaystackAdapter implements IPaymentAdapter {
  private secretKey: string;
  private baseUrl = "https://api.paystack.co";

  constructor() {
    this.secretKey = process.env.PAYMENT_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY || "";
  }

  async initiatePayment(
    payload: InitiatePaymentPayload
  ): Promise<InitiatePaymentResult> {
    const amountInPesewas = Math.round(payload.amount * 100);

    // If secret key is not provided (e.g. sandbox mock testing)
    if (!this.secretKey || this.secretKey.startsWith("mock_")) {
      console.warn(
        "[PaystackAdapter] PAYMENT_SECRET_KEY is not set. Using test sandbox simulator."
      );
      return {
        authorizationUrl: `${payload.callbackUrl}${
          payload.callbackUrl.includes("?") ? "&" : "?"
        }ref=${payload.reference}&mock_payment=true`,
        reference: payload.reference,
        isSimulated: true,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email,
          amount: amountInPesewas,
          reference: payload.reference,
          callback_url: payload.callbackUrl,
          currency: "GHS",
          channels: ["card", "mobile_money", "bank"],
          metadata: {
            ...payload.metadata,
            custom_fields: [
              {
                display_name: "Customer Phone",
                variable_name: "customer_phone",
                value: payload.phone ?? "",
              },
            ],
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(
          data.message || "Failed to initialize Paystack transaction."
        );
      }

      return {
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        reference: data.data.reference,
      };
    } catch (error) {
      console.error("[PaystackAdapter.initiatePayment] Error:", error);
      throw error;
    }
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    if (!this.secretKey || this.secretKey.startsWith("mock_")) {
      return {
        success: true,
        amount: 0,
        currency: "GHS",
        transactionId: `mock_tx_${reference}`,
        paidAt: new Date(),
        channel: "mobile_money",
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.status) {
        return {
          success: false,
          amount: 0,
          currency: "GHS",
          transactionId: "",
          paidAt: new Date(),
          error: data.message || "Verification request failed",
        };
      }

      const tx = data.data;
      const isSuccess = tx.status === "success";

      return {
        success: isSuccess,
        amount: (tx.amount ?? 0) / 100, // convert from pesewas to GHS
        currency: tx.currency ?? "GHS",
        transactionId: String(tx.id),
        paidAt: tx.paid_at ? new Date(tx.paid_at) : new Date(),
        channel: tx.channel,
        customer: {
          email: tx.customer?.email,
          phone: tx.customer?.phone,
        },
        metadata: tx.metadata,
        error: isSuccess ? undefined : tx.gateway_response,
      };
    } catch (error) {
      console.error("[PaystackAdapter.verifyPayment] Error:", error);
      return {
        success: false,
        amount: 0,
        currency: "GHS",
        transactionId: "",
        paidAt: new Date(),
        error: (error as Error).message,
      };
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret =
      process.env.PAYMENT_WEBHOOK_SECRET || process.env.PAYMENT_SECRET_KEY;

    if (!secret) {
      // In dev sandbox mode
      return true;
    }

    try {
      const hash = crypto
        .createHmac("sha512", secret)
        .update(rawBody)
        .digest("hex");

      return hash === signature;
    } catch (error) {
      console.error("[PaystackAdapter.verifyWebhookSignature] Error:", error);
      return false;
    }
  }
}

// ─── PaymentService ────────────────────────────────────────────────────────────

export class PaymentService {
  private adapter: IPaymentAdapter;

  constructor(adapter?: IPaymentAdapter) {
    this.adapter = adapter ?? new PaystackAdapter();
  }

  async initiatePayment(
    payload: InitiatePaymentPayload
  ): Promise<InitiatePaymentResult> {
    return this.adapter.initiatePayment(payload);
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResult> {
    return this.adapter.verifyPayment(reference);
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    return this.adapter.verifyWebhookSignature(rawBody, signature);
  }
}

// Singleton instance
export const paymentService = new PaymentService();
