/**
 * Kay's Packs — Chat Response Builder
 * ────────────────────────────────────
 * Converts raw tool results into friendly, formatted Ghanaian-style
 * markdown replies. All responses are generated locally — no API needed.
 */

import { StoreProduct, STORE_PHONE_DISPLAY, STORE_WHATSAPP_LINK } from "@/lib/constants";
import { ChatIntent } from "./intent-engine";

export interface BuiltResponse {
  reply: string;
  suggestedProducts?: StoreProduct[];
}

// ─── Micro-helpers ────────────────────────────────────────────────────────────

function ghc(amount: number): string {
  return `GH₵${Number(amount).toFixed(2)}`;
}

function stockBadge(inStock: boolean, stock?: number): string {
  if (!inStock) return "❌ Out of stock";
  if (typeof stock === "number" && stock < 10) return `⚠️ Only ${stock} left`;
  return "✅ In Stock";
}

const STATUS_EMOJI: Record<string, string> = {
  PENDING_PAYMENT: "⏳",
  PAID: "✅",
  CONFIRMED: "✅",
  PROCESSING: "🔄",
  READY_FOR_DELIVERY: "📦",
  OUT_FOR_DELIVERY: "🚚",
  DELIVERED: "✅",
  CANCELLED: "❌",
  FAILED_DELIVERY: "⚠️",
  REFUND_PENDING: "↩️",
  REFUNDED: "↩️",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Payment received — being confirmed",
  CONFIRMED: "Confirmed & being prepared",
  PROCESSING: "Being processed",
  READY_FOR_DELIVERY: "Packed & ready for dispatch",
  OUT_FOR_DELIVERY: "Out for delivery 🏍️",
  DELIVERED: "Delivered successfully!",
  CANCELLED: "Order cancelled",
  FAILED_DELIVERY: "Delivery attempt failed — we'll retry",
  REFUND_PENDING: "Refund in progress",
  REFUNDED: "Refund completed",
};

// ─── Product Search ───────────────────────────────────────────────────────────

export function buildSearchProductsResponse(
  result: any,
  suggestedProducts: StoreProduct[]
): BuiltResponse {
  if (!result.products || result.products.length === 0) {
    return {
      reply:
        "I couldn't find anything matching that search. 🤔\n\n" +
        "We carry these brands: **Voltic**, **Bel-Aqua**, **Verna**, **Awake**, and **Slem Fit**.\n" +
        "Try searching by brand name or size, e.g. *\"Voltic 500ml\"* or *\"750ml water\"*.",
    };
  }

  const lines = (result.products as any[]).slice(0, 6).map(
    (p) =>
      `- **${p.name}** — ${ghc(p.priceInGHS)} · ${p.inStock ? "✅ In Stock" : "❌ Out of stock"}`
  );

  return {
    reply:
      `Here's what we have for you! 🛍️\n\n${lines.join("\n")}\n\n` +
      `💬 Say **"add [product name] to cart"** to order, or ask me for more details on any product!`,
    suggestedProducts,
  };
}

// ─── Product Detail ───────────────────────────────────────────────────────────

export function buildGetProductResponse(
  result: any,
  suggestedProducts: StoreProduct[]
): BuiltResponse {
  if (!result.found) {
    return {
      reply:
        "I couldn't find that specific product. 🤔\n\n" +
        "Try searching by brand and size, e.g. **\"Voltic 500ml\"** or **\"Bel-Aqua 750ml\"**.",
    };
  }

  const p = result.product;
  const stockInfo = p.inStock
    ? `✅ In Stock (${p.stockAvailable} packs available)`
    : "❌ Currently out of stock";

  return {
    reply:
      `**${p.name}**\n\n` +
      `💧 **Pack Size:** ${p.packSize || "N/A"}\n` +
      `💰 **Price:** ${ghc(p.priceInGHS)}\n` +
      `📦 **Stock:** ${stockInfo}\n` +
      `⭐ **Rating:** ${p.rating}/5 (${p.reviewCount} reviews)\n\n` +
      (p.description ? `${p.description}\n\n` : "") +
      `Just say **"add to cart"** or **"add 2 packs"** to order!`,
    suggestedProducts,
  };
}

// ─── Stock Check ──────────────────────────────────────────────────────────────

export function buildCheckStockResponse(
  result: any,
  suggestedProducts: StoreProduct[]
): BuiltResponse {
  if (!result.found) {
    return {
      reply:
        "I couldn't find that product in our catalog. 🤔\n\n" +
        "We stock **Voltic**, **Bel-Aqua**, **Verna**, **Awake**, and **Slem Fit** water brands. " +
        "Try being more specific — e.g. *\"Voltic 500ml\"*.",
    };
  }

  const cta = result.inStock
    ? `\n\nWould you like me to add **${result.productName}** to your cart?`
    : `\n\nWould you like to see similar in-stock products?`;

  return {
    reply: result.message + cta,
    suggestedProducts,
  };
}

// ─── Add to Cart ──────────────────────────────────────────────────────────────

export function buildAddToCartResponse(
  result: any,
  suggestedProducts: StoreProduct[]
): BuiltResponse {
  if (!result.success) {
    return { reply: `❌ ${result.message}` };
  }

  const p = result.addedProduct;
  const packs = p.quantityAdded === 1 ? "pack" : "packs";

  return {
    reply:
      `🛒 **Added to your cart!**\n\n` +
      `✅ **${p.quantityAdded} ${packs}** of **${p.name}**\n` +
      `💰 ${ghc(p.totalItemPrice)} (${ghc(p.priceInGHS)} per pack)\n\n` +
      `Say **"view cart"** to see your cart, or keep shopping! 😊`,
    suggestedProducts,
  };
}

// ─── Remove from Cart ────────────────────────────────────────────────────────

export function buildRemoveFromCartResponse(result: any): BuiltResponse {
  return {
    reply: result.success
      ? `✅ Removed from your cart!\n\nSay **"view cart"** to see what's left, or keep shopping.`
      : `❌ I couldn't find that item in your cart to remove.`,
  };
}

// ─── Update Cart Quantity ────────────────────────────────────────────────────

export function buildUpdateQuantityResponse(result: any): BuiltResponse {
  return {
    reply: result.success
      ? `✅ ${result.message}\n\nSay **"view cart"** to see your updated cart!`
      : `❌ I couldn't update that item. Please try again.`,
  };
}

// ─── View Cart ────────────────────────────────────────────────────────────────

export function buildViewCartResponse(result: any): BuiltResponse {
  if (result.itemCount === 0) {
    return {
      reply:
        `🛒 **Your cart is empty!**\n\n` +
        `Start shopping by telling me what you'd like. For example:\n` +
        `- *"Add 2 Voltic 500ml to my cart"*\n` +
        `- *"I want 3 packs of Bel-Aqua 750ml"*\n\n` +
        `We carry **Voltic**, **Bel-Aqua**, **Verna**, **Awake**, and **Slem Fit**!`,
    };
  }

  const itemLines = (result.items as any[]).map(
    (i) => `- **${i.quantity}x** ${i.name} — ${ghc(i.totalInGHS)}`
  );

  const deliveryNote = result.isFreeDelivery
    ? `🎉 **FREE Delivery** (your order is over ${ghc(100)}!)`
    : `🚚 Delivery: ${ghc(result.estimatedDeliveryFeeInGHS)} *(Free on orders of ${ghc(100)} or more!)*`;

  return {
    reply:
      `🛒 **Your Cart** (${result.itemCount} ${result.itemCount === 1 ? "pack" : "packs"})\n\n` +
      `${itemLines.join("\n")}\n\n---\n` +
      `Subtotal: ${ghc(result.subtotalInGHS)}\n` +
      `${deliveryNote}\n` +
      `**Total: ${ghc(result.totalInGHS)}**\n\n` +
      `Ready to order? Say **"checkout"** to pay! 💳`,
  };
}

// ─── Clear Cart ───────────────────────────────────────────────────────────────

export function buildClearCartResponse(): BuiltResponse {
  return {
    reply:
      `🗑️ Done! Your cart has been cleared.\n\n` +
      `Start fresh by telling me what you'd like to order. Just say something like *"add 2 Voltic 500ml"*!`,
  };
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export function buildCheckoutResponse(result: any): BuiltResponse {
  if (result.cartItemCount === 0) {
    return {
      reply:
        `Your cart is empty! 🛒\n\n` +
        `Add some water packs first before checking out. ` +
        `Say something like *"add 2 Voltic 500ml"* to get started!`,
    };
  }

  const packs = result.cartItemCount === 1 ? "pack" : "packs";

  return {
    reply:
      `💳 **Proceeding to checkout!**\n\n` +
      `You have **${result.cartItemCount} ${packs}** ready.\n` +
      `At checkout you can:\n` +
      `- 📍 Enter your delivery address\n` +
      `- 💰 Pay with **MTN MoMo, Telecel Cash, AT Money, Visa/Mastercard**\n\n` +
      `Taking you there now... 🚀`,
  };
}

// ─── Customer Orders ──────────────────────────────────────────────────────────

export function buildGetOrdersResponse(result: any): BuiltResponse {
  if (!result.authenticated) {
    return {
      reply:
        `🔐 **Please log in** to view your orders.\n\n` +
        `Sign in at the top of the page to access your full order history and real-time tracking!`,
    };
  }

  if (result.orderCount === 0) {
    return {
      reply:
        `You haven't placed any orders yet! 🛍️\n\n` +
        `Browse our fresh water packs and place your first order — we deliver across all 16 regions of Ghana!`,
    };
  }

  const lines = (result.orders as any[]).map(
    (o) =>
      `- ${STATUS_EMOJI[o.status] || "📋"} **${o.orderNumber}** · ${o.date} · ${ghc(o.totalInGHS)} · _${
        o.status?.replace(/_/g, " ") || "PENDING"
      }_`
  );

  return {
    reply:
      `📦 **Your Recent Orders** (${result.orderCount}):\n\n` +
      `${lines.join("\n")}\n\n` +
      `Paste any order number (e.g. **"KP-2026-0001"**) to get full tracking details!`,
  };
}

// ─── Order Status ─────────────────────────────────────────────────────────────

export function buildOrderStatusResponse(result: any): BuiltResponse {
  if (!result.found) {
    return { reply: `❌ ${result.message}` };
  }

  const statusEmoji = STATUS_EMOJI[result.orderStatus] || "📋";
  const statusLabel =
    STATUS_LABEL[result.orderStatus] ||
    result.orderStatus?.replace(/_/g, " ") ||
    "Unknown";

  const itemLines = (result.items || [])
    .map((i: any) => `  - ${i.quantity}x ${i.product} (${i.pack})`)
    .join("\n");

  let reply =
    `📦 **Order ${result.orderNumber}**\n\n` +
    `**Status:** ${statusEmoji} ${statusLabel}\n` +
    `**Date:** ${result.date}\n` +
    `**Delivery:** ${result.deliveryLocation}\n` +
    `**Total:** ${ghc(result.totalInGHS)}\n\n` +
    `**Items:**\n${itemLines}`;

  if (result.driverInfo) {
    reply += `\n\n🏍️ **Driver:** ${result.driverInfo.name} · 📞 ${result.driverInfo.phone}`;
  }

  return { reply };
}

// ─── Delivery Info ───────────────────────────────────────────────────────────

export function buildDeliveryInfoResponse(result: any): BuiltResponse {
  const region = result.queriedRegion || "Greater Accra";
  const fee = result.deliveryFeeForQueriedRegionInGHS ?? 15;

  return {
    reply:
      `🚚 **Delivery Information**\n\n` +
      `- 📍 **${region}:** ${ghc(fee)}\n` +
      `- 🎉 **FREE delivery** on orders of ${ghc(result.freeDeliveryThresholdInGHS)} and above!\n` +
      `- ⏰ **Same-day cutoff:** ${result.sameDayDeliveryCutoff}\n` +
      `- 🕐 **Greater Accra:** ${result.deliveryTimeframe?.greaterAccra || "Same-day before 2 PM"}\n` +
      `- 🌍 **Other regions:** ${result.deliveryTimeframe?.regionalParcel || "1–3 business days"}\n` +
      `- 🏭 **Free warehouse pickup** available in Accra!\n\n` +
      `Ask about any specific region, e.g. *"How much to deliver to Ashanti?"*`,
  };
}

// ─── Payment Info ────────────────────────────────────────────────────────────

export function buildPaymentInfoResponse(result: any): BuiltResponse {
  const methods: string[] = result.acceptedPaymentMethods || [
    "MTN Mobile Money (MoMo)",
    "Telecel Cash (Vodafone Cash)",
    "AT Money",
    "Visa & Mastercard (via Paystack)",
  ];

  const methodLines = methods.map((m: string) => `- ✅ ${m}`).join("\n");

  return {
    reply:
      `💳 **Accepted Payment Methods:**\n\n` +
      `${methodLines}\n\n` +
      `All card payments are processed securely via **Paystack**.\n` +
      `No cash on delivery for now.\n\n` +
      `Need help? Reach us on WhatsApp: ${STORE_PHONE_DISPLAY}`,
  };
}

// ─── Store Info ───────────────────────────────────────────────────────────────

export function buildStoreInfoResponse(result: any): BuiltResponse {
  return {
    reply:
      `🏪 **Kay's Packs Ghana**\n` +
      `_${result.tagline || "Pure Water Delivered to Your Door"}_\n\n` +
      `📞 **Phone:** ${result.phone || STORE_PHONE_DISPLAY}\n` +
      `💬 **WhatsApp:** [Chat with us](${result.whatsappLink || STORE_WHATSAPP_LINK})\n` +
      `🕐 **Hours:** ${result.workingHours || "Mon–Sat: 8 AM – 6 PM"}\n` +
      `🌍 **Coverage:** ${result.coverage || "Greater Accra & Nationwide"}`,
  };
}

// ─── Best Sellers ─────────────────────────────────────────────────────────────

export function buildBestSellersResponse(
  result: any,
  suggestedProducts: StoreProduct[]
): BuiltResponse {
  const bestSellers = suggestedProducts
    .filter((p) => p.isBestSeller && p.inStock)
    .slice(0, 4);

  if (bestSellers.length === 0 && result.products?.length > 0) {
    // Fall back to search results
    const lines = (result.products as any[])
      .slice(0, 4)
      .map((p: any) => `- **${p.name}** — ${ghc(p.priceInGHS)}`);
    return {
      reply: `⭐ **Popular Products:**\n\n${lines.join("\n")}\n\nSay **"add [product] to cart"** to order!`,
      suggestedProducts,
    };
  }

  const lines = bestSellers.map(
    (p) => `- **${p.name}** — ${ghc(p.price)} · ⭐ ${p.rating}/5 (${p.reviewCount} reviews)`
  );

  return {
    reply:
      `⭐ **Our Best Sellers — What Customers Love Most:**\n\n` +
      `${lines.join("\n")}\n\n` +
      `Just say **"add [product name] to cart"** to order any of these! 🛒`,
    suggestedProducts: bestSellers,
  };
}

// ─── Greeting & Thanks ───────────────────────────────────────────────────────

export function buildGreetingResponse(userName?: string): BuiltResponse {
  const firstName = userName ? userName.split(" ")[0] : "";
  const greetings = [
    `Hello${firstName ? ` ${firstName}` : ""}! 👋 Welcome to **Kay's Packs** — Ghana's water delivery hub.\n\n` +
      `I can help you:\n` +
      `- 🛍️ Browse water brands & check prices\n` +
      `- 📦 Check real-time stock\n` +
      `- 🛒 Add products to your cart\n` +
      `- 🚚 Get delivery fees & timelines\n` +
      `- 📋 Track your orders\n\n` +
      `What can I help you with today?`,

    `Hi${firstName ? ` ${firstName}` : ""} there! 💧 Ready to hydrate?\n\n` +
      `We have **Voltic**, **Bel-Aqua**, **Verna**, **Awake**, and **Slem Fit** water packs — ` +
      `delivered to your door across Ghana!\n\n` +
      `How can I assist you today?`,
  ];

  return { reply: greetings[Math.floor(Math.random() * greetings.length)] };
}

export function buildThanksResponse(): BuiltResponse {
  const responses = [
    `You're welcome! 😊 Is there anything else I can help you with?`,
    `My pleasure! 💧 Let me know if you need help with products, delivery, or tracking!`,
    `Happy to help! Anything else you'd like to know? 🛍️`,
  ];
  return { reply: responses[Math.floor(Math.random() * responses.length)] };
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

export function buildUnknownResponse(): BuiltResponse {
  return {
    reply:
      `I'm not quite sure I understood that. 🤔 Here's what I can help with:\n\n` +
      `- 🛍️ **Browse products** — *"What water do you sell?"*\n` +
      `- 📦 **Check stock** — *"Is Voltic 500ml available?"*\n` +
      `- 🛒 **Add to cart** — *"Add 2 Bel-Aqua to my cart"*\n` +
      `- 🗑️ **Remove from cart** — *"Remove Verna from cart"*\n` +
      `- 💰 **View cart** — *"What's in my cart?"*\n` +
      `- 🚚 **Delivery fees** — *"How much to deliver to Accra?"*\n` +
      `- 💳 **Payment options** — *"Do you accept MoMo?"*\n` +
      `- 📋 **Track order** — *"Where is my order KP-2026-0001?"*\n\n` +
      `Or reach us on [WhatsApp](${STORE_WHATSAPP_LINK}) for instant help!`,
  };
}

// ─── Intent → Response router (for direct intents with no tool) ───────────────

export function buildDirectResponse(
  intent: ChatIntent,
  userName?: string
): BuiltResponse | null {
  switch (intent) {
    case "GREETING":
      return buildGreetingResponse(userName);
    case "THANKS":
      return buildThanksResponse();
    case "CLEAR_CART":
      return buildClearCartResponse();
    case "UNKNOWN":
      return buildUnknownResponse();
    default:
      return null;
  }
}
