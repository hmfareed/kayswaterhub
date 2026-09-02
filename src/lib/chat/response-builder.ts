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

// ─── How Are You & Polite Assistance ──────────────────────────────────────────

export function buildHowAreYouResponse(): BuiltResponse {
  return {
    reply:
      `I'm doing fantastic, thank you for asking! 💧😊\n\n` +
      `I'm **Kay's Packs AI Hydration Assistant**, ready to help you order Ghana's purest mineral water packs, ` +
      `check prices, find budget options, track orders, or answer any questions.\n\n` +
      `How can I assist you today?`,
  };
}

export function buildNeedAssistanceResponse(): BuiltResponse {
  return {
    reply:
      `I'm right here to assist you! 🤝💧\n\n` +
      `Here are some things I can do for you immediately:\n` +
      `- 🛍️ **Check water prices & live stock** (e.g. *"How much is Voltic 500ml?"*)\n` +
      `- 🛒 **Add items to cart & checkout** (e.g. *"Add 2 packs of Bel-Aqua and checkout"*)\n` +
      `- 🚚 **Delivery fees & regional shipping** (e.g. *"Do you deliver to Tamale or Kumasi?"*)\n` +
      `- 💳 **Payment options** (MTN MoMo, Telecel Cash, Visa, Mastercard)\n` +
      `- 💰 **Budget recommendations** (e.g. *"I have 50 cedis what can I buy?"*)\n` +
      `- 📞 **Contact our Manager** directly via WhatsApp or phone call\n` +
      `- 🌙 **Turn on Dark Mode** for easy reading\n\n` +
      `What would you like help with?`,
  };
}

export function buildThirstyResponse(suggestedProducts: StoreProduct[]): BuiltResponse {
  return {
    reply:
      `Stay hydrated! 💧 We've got pure, crisp mineral water ready to dispatch to your doorstep right away.\n\n` +
      `Here are our top quick hydration picks:\n` +
      `- 💧 **Voltic Natural Mineral Water 500ml x 15** — ${ghc(45.00)}\n` +
      `- 💧 **Bel-Aqua Mineral Water 750ml x 15** — ${ghc(42.00)}\n` +
      `- 💧 **Verna Mineral Water 500ml x 15** — ${ghc(40.00)}\n\n` +
      `Say **"add [water name] to cart"** to get fast doorstep delivery! 🚀`,
    suggestedProducts: suggestedProducts.slice(0, 3),
  };
}

// ─── Multi-Pack Price Calculation ─────────────────────────────────────────────

export function buildPriceCalculationResponse(
  product: StoreProduct,
  quantity: number
): BuiltResponse {
  const unitPrice = product.price;
  const totalPrice = unitPrice * quantity;
  const packsLabel = quantity === 1 ? "pack" : "packs";

  return {
    reply:
      `💧 **Price Calculation for ${product.name}:**\n\n` +
      `- 📦 **Pack Size:** ${product.packSize}\n` +
      `- 💰 **Unit Price:** ${ghc(unitPrice)} per pack\n` +
      `- 🔢 **Quantity:** **${quantity} ${packsLabel}**\n\n` +
      `💵 **Total Price: ${ghc(totalPrice)}** (${quantity} × ${ghc(unitPrice)})\n\n` +
      `🚚 **Greater Accra Delivery:** Flat ${ghc(15)} (bulk promotions & free delivery thresholds may apply).\n\n` +
      `Would you like me to add **${quantity} ${packsLabel}** of **${product.name}** to your cart? 🛒`,
    suggestedProducts: [product],
  };
}

// ─── Budget Recommendation ───────────────────────────────────────────────────

export function buildBudgetRecommendationResponse(
  budget: number,
  matchingProducts: StoreProduct[]
): BuiltResponse {
  if (matchingProducts.length === 0) {
    return {
      reply:
        `With a budget of **${ghc(budget)}**, our standard packs start around ${ghc(30)} – ${ghc(45)}.\n\n` +
        `Our most affordable single options include:\n` +
        `- **Verna Jar Dispenser 15L** — ${ghc(30.00)}\n` +
        `- **Voltic Pocket 350ml x 15** — ${ghc(32.00)}\n` +
        `- **Slem Fit 500ml x 16** — ${ghc(38.00)}\n` +
        `- **Verna 500ml x 15** — ${ghc(40.00)}\n\n` +
        `Tell me which brand you'd like to check out!`,
    };
  }

  const lines = matchingProducts
    .slice(0, 5)
    .map((p) => `- **${p.name}** (${p.packSize}) — **${ghc(p.price)}** · ${p.inStock ? "✅ In Stock" : "❌ Out of stock"}`);

  return {
    reply:
      `💰 **What you can purchase with a budget of ${ghc(budget)}:**\n\n` +
      `Here are the best water packs that fit comfortably within your budget:\n\n` +
      `${lines.join("\n")}\n\n` +
      `💡 *Tip: Bundle multiple packs together for the best delivery value!*\n\n` +
      `Say **"add [product name] to cart"** or click Add on any card below to order! 🛍️`,
    suggestedProducts: matchingProducts.slice(0, 4),
  };
}

// ─── Theme Toggles (Dark / Light Mode) ─────────────────────────────────────────

export function buildToggleThemeResponse(targetTheme?: "dark" | "light" | "toggle"): BuiltResponse {
  const isLight = targetTheme === "light";
  return {
    reply: isLight
      ? `☀️ **Light Mode Activated!**\n\nI've switched your theme to light mode. You can switch back to dark mode anytime by saying *"turn on dark mode"* or clicking the theme toggle in the header.`
      : `🌙 **Dark Mode Activated!** 🌟\n\nI've enabled dark mode for a sleek, comfortable viewing experience.\n\nYou can toggle between dark and light mode at any time using the theme icon in the header or in your **[Account Settings](/account)**.`,
  };
}

// ─── Contact Human / Speak to Manager ─────────────────────────────────────────

export function buildContactHumanResponse(): BuiltResponse {
  return {
    reply:
      `📞 **Speak Directly With Our Manager & Support Team:**\n\n` +
      `We're always available for personal assistance, custom bulk quotes, or special delivery instructions!\n\n` +
      `- 📱 **Phone Call:** **[${STORE_PHONE_DISPLAY}](tel:${STORE_PHONE_DISPLAY.replace(/[\s-]/g, "")})**\n` +
      `- 💬 **WhatsApp:** [Click here to Chat with Manager on WhatsApp](${STORE_WHATSAPP_LINK})\n` +
      `- ⏰ **Customer Service Hours:** Monday – Saturday: 8:00 AM – 6:00 PM\n` +
      `- 📍 **Central Distribution Hub:** Accra, Ghana\n\n` +
      `Feel free to reach out via WhatsApp or call us directly! 🚀`,
  };
}

// ─── Create Account Guide ─────────────────────────────────────────────────────

export function buildCreateAccountResponse(): BuiltResponse {
  return {
    reply:
      `📝 **How to Create Your Kay's Packs Account in 30 Seconds:**\n\n` +
      `Creating an account is quick and unlocks great perks:\n` +
      `1. 📍 **Save delivery addresses** for seamless 1-click re-ordering\n` +
      `2. 📦 **Live order tracking** & driver dispatch updates\n` +
      `3. 🎁 **Earn hydration reward points** on every purchase\n` +
      `4. 📋 **Full order history** & instant digital receipts\n\n` +
      `👉 **[Click here to Create Account / Register](/register)**\n\n` +
      `Already registered? **[Sign In here](/login)**.`,
  };
}

// ─── Why Buy From Us (Value Proposition) ──────────────────────────────────────

export function buildWhyBuyFromUsResponse(): BuiltResponse {
  return {
    reply:
      `✨ **Why You Should Buy From Kay's Packs Ghana:**\n\n` +
      `1. 💧 **100% Genuine & Factory Sealed:** Direct from verified manufacturer bottling lines (Voltic, Bel-Aqua, Verna, Awake, Slem Fit).\n` +
      `2. ❄️ **Pristine, Sun-Protected Storage:** Our water is stored in clean, temperature-controlled warehouses — never left in the hot sun.\n` +
      `3. 🚀 **Lightning Doorstep Delivery:** Same-day delivery across Greater Accra (order before 2:00 PM) & reliable station parcel dispatch to all 16 regions.\n` +
      `4. 💰 **Affordable Prices & Reliable Service:** Best wholesale rates with seasonal discounts and bulk promotions.\n` +
      `5. 📱 **Instant MoMo & Card Payments:** Pay securely with MTN MoMo, Telecel Cash, AT Money, Visa, or Mastercard via Paystack.`,
  };
}

// ─── Water Purity & Freshness Guarantee ───────────────────────────────────────

export function buildWaterPurityResponse(): BuiltResponse {
  return {
    reply:
      `🛡️ **100% Clean, Fresh & Certified Safe Mineral Water:**\n\n` +
      `- ✅ **FDA & GSA Certified:** Every brand we sell is fully certified by the **Food and Drugs Authority (FDA Ghana)** and **Ghana Standards Authority (GSA)**.\n` +
      `- 🔒 **Tamper-Evident Factory Seals:** All bottles and shrink-wrap packs are factory-sealed directly at the mineral spring source.\n` +
      `- 📅 **Fresh Production Batches:** We enforce strict inventory turnover so you always receive fresh, newly bottled water.\n` +
      `- 🚫 **No Re-bottling / No Counterfeits:** 100% authentic mineral water rich in essential natural minerals.\n\n` +
      `You and your family can drink with complete peace of mind! 💧`,
  };
}

// ─── Store Catalog Overview ───────────────────────────────────────────────────

export function buildStoreCatalogOverviewResponse(products: StoreProduct[]): BuiltResponse {
  return {
    reply:
      `🏪 **Welcome to Kay's Packs Water Hub!**\n\n` +
      `We supply Ghana's top mineral water brands in all popular pack sizes:\n\n` +
      `- 💧 **Voltic Natural Mineral Water** (350ml Pocket, 500ml x 15, 750ml, 1.5L)\n` +
      `- 💧 **Bel-Aqua Mineral Water** (500ml, 750ml x 15, 1.5L)\n` +
      `- 💧 **Verna Mineral Water** (500ml x 15, 750ml x 16, 15L Jars)\n` +
      `- 💧 **Awake Purified Water** (750ml x 16)\n` +
      `- 💧 **Slem Fit Alkaline Water** (500ml x 16)\n` +
      `- 🏢 **15L & 19L Dispenser Bottles** for homes and offices\n\n` +
      `Ask me about any specific brand or price, or say **"best sellers"**! 🛒`,
    suggestedProducts: products.slice(0, 4),
  };
}

// ─── Bulk, Wholesale & Event Orders ───────────────────────────────────────────

export function buildBulkWholesaleResponse(): BuiltResponse {
  return {
    reply:
      `📦 **Bulk, Wholesale & Event Water Delivery:**\n\n` +
      `Planning a wedding, funeral, church conference, party, or corporate event? We make bulk hydration easy!\n\n` +
      `- 💰 **Tiered Discounts:** Special volume pricing on orders of **50+ packs** and **100+ packs**.\n` +
      `- 🚚 **Scheduled Event Dispatch:** Schedule your delivery date & time in advance so water arrives chilled and ready.\n` +
      `- 📞 **Custom Quotes:** Chat directly with our manager on WhatsApp at **${STORE_PHONE_DISPLAY}** or [Click to Chat on WhatsApp](${STORE_WHATSAPP_LINK}) for an instant bulk quotation!`,
  };
}

// ─── Dispenser Refill & Bottle Returns ────────────────────────────────────────

export function buildDispenserRefillResponse(): BuiltResponse {
  return {
    reply:
      `🏢 **15L / 19L Dispenser Bottle Refills & Exchange:**\n\n` +
      `- 💧 **Sealed Refills:** We supply fresh **Verna 15L Dispenser Jars** (${ghc(30.00)}).\n` +
      `- 🔄 **Empty Bottle Exchange:** If you have an empty standard 15L/19L bottle, our rider will swap it with a fresh sealed jar at standard refill price.\n` +
      `- 🆕 **New Jar Deposit:** If you don't have an empty bottle, you can purchase a full jar including bottle deposit.\n` +
      `- 🚚 **Office Subscriptions:** Set up recurring weekly deliveries for your workplace by contacting us!`,
  };
}

// ─── Delivery Speed & Timeframe ───────────────────────────────────────────────

export function buildDeliverySpeedResponse(): BuiltResponse {
  return {
    reply:
      `⏰ **Delivery Speeds & Cutoff Times:**\n\n` +
      `- 🚀 **Greater Accra Same-Day:** Orders placed **before 2:00 PM** are delivered the same day (usually within 2–4 hours)!\n` +
      `- 🌅 **Evening Orders:** Orders placed after 2:00 PM are dispatched first thing the next morning.\n` +
      `- 🌍 **Regional Deliveries (Tamale, Kumasi, Takoradi, etc.):** 1–3 business days via verified station couriers.\n` +
      `- 🏭 **Free Warehouse Pickup:** Available at our central Accra hub Monday to Saturday (8 AM – 6 PM).`,
  };
}

// ─── Cancellation & Refunds ───────────────────────────────────────────────────

export function buildCancelRefundResponse(): BuiltResponse {
  return {
    reply:
      `🔄 **Order Cancellation & Return Policy:**\n\n` +
      `- 🛑 **Cancellations:** You can cancel any unpaid or processing order from your **[Account Orders Tab](/account?tab=orders)** before dispatch.\n` +
      `- 📦 **Damaged Bottles:** If any bottle arrives punctured or damaged, our driver will exchange it immediately with a fresh pack at zero cost.\n` +
      `- 💰 **Refunds:** Prompt mobile money or card refunds processed within 24 hours for approved cancellations.`,
  };
}

// ─── Water Recommendations for Health, Babies & Gym ──────────────────────────

export function buildWaterHealthResponse(suggestedProducts: StoreProduct[]): BuiltResponse {
  return {
    reply:
      `💧 **Water Recommendations for Health, Babies & Fitness:**\n\n` +
      `- 👶 **Best for Babies & Infant Formula:** **Verna Natural Mineral Water** — famous for low-sodium, balanced mineral composition ideal for infant feeding.\n` +
      `- 🏋️ **Best for Gym & Workouts:** **Slem Fit Mineral Water** — alkaline-balanced pH formula with electrolytes to combat muscle fatigue.\n` +
      `- 🌿 **Best for Daily Family Hydration:** **Voltic** & **Bel-Aqua** — natural mineral water filtered through Ghanaian underground springs.\n` +
      `- ❤️ **Charity & Community Impact:** **Awake Purified Water** — a portion of proceeds supports the National Cardiothoracic Center.`,
    suggestedProducts: suggestedProducts.slice(0, 4),
  };
}

// ─── Discounts, Promo Codes & Loyalty Points ──────────────────────────────────

export function buildDiscountPromoPointsResponse(): BuiltResponse {
  return {
    reply:
      `🎁 **Discounts, Promo Codes & Loyalty Rewards:**\n\n` +
      `- 💎 **Hydration Points:** Registered accounts earn reward points on every order redeemable for instant checkout discounts.\n` +
      `- 🏷️ **Promo Codes:** Enter your promo/voucher code during **[Checkout](/checkout)** for instant savings.\n` +
      `- 📦 **Wholesale Savings:** Volume discount rates on multi-pack and bulk event orders!\n` +
      `- 🚚 **Delivery Deals:** Periodic free delivery promotions enabled by store management on qualifying carts.`,
  };
}

// ─── Operating Hours ──────────────────────────────────────────────────────────

export function buildWorkingHoursResponse(): BuiltResponse {
  return {
    reply:
      `⏰ **Kay's Packs Working Hours:**\n\n` +
      `- 📅 **Monday – Saturday:** 8:00 AM – 6:00 PM\n` +
      `- 📅 **Sunday:** Closed (Emergency deliveries available via WhatsApp)\n` +
      `- 🌐 **Online Store:** Open **24/7** — orders placed after hours are dispatched first thing the next morning!\n` +
      `- 💬 **WhatsApp Support:** Available 7 days a week at **${STORE_PHONE_DISPLAY}**.`,
  };
}

// ─── Product Search ───────────────────────────────────────────────────────────

export function buildSearchProductsResponse(
  result: any,
  suggestedProducts: StoreProduct[]
): BuiltResponse {
  if (!result.products || result.products.length === 0) {
    return {
      reply:
        "I couldn't find anything matching that search. 🤔\n\n" +
        "We carry these top brands: **Voltic**, **Bel-Aqua**, **Verna**, **Awake**, **Slem Fit**, and **Perla**.\n" +
        "Try searching by brand name or size, e.g. *\"Voltic 500ml\"*, *\"Bel-Aqua 750ml\"*, or *\"15L dispenser\"*.",
    };
  }

  const lines = (result.products as any[]).slice(0, 6).map(
    (p) =>
      `- **${p.name}** — ${ghc(p.priceInGHS)} · ${p.inStock ? "✅ In Stock" : "❌ Out of stock"}`
  );

  return {
    reply:
      `Here's what we have in stock for you! 🛍️\n\n${lines.join("\n")}\n\n` +
      `💬 Say **"add [product name] to cart"** to order, or ask me for more details on any pack!`,
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
        "Try searching by name, e.g. *\"Voltic 500ml\"* or *\"Bel-Aqua 750ml\"*.",
    };
  }

  const cta = result.inStock
    ? `\n\nWould you like me to add **${result.productName}** to your cart? 🛒`
    : `\n\nWould you like to see similar in-stock alternatives?`;

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
      `💰 Total: **${ghc(p.totalItemPrice)}** (${ghc(p.priceInGHS)} per pack)\n\n` +
      `Say **"view cart"** to check your cart, or say **"checkout"** to pay! 💳`,
    suggestedProducts,
  };
}

// ─── Add to Cart & Checkout Combined ─────────────────────────────────────────

export function buildAddAndCheckoutResponse(
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
      `🛒 **Added & Redirecting to Checkout!**\n\n` +
      `✅ Added **${p.quantityAdded} ${packs}** of **${p.name}** (${ghc(p.totalItemPrice)}) to your cart.\n\n` +
      `Taking you straight to the checkout page now so you can enter your address and pay with MoMo or Card! 🚀`,
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
    ? `🎉 **FREE Delivery Applied!**`
    : `🚚 Delivery: ${ghc(result.estimatedDeliveryFeeInGHS)} (calculated at checkout based on location)`;

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
        `[Sign in here](/login) to access your full order history and real-time tracking!`,
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

// ─── Delivery Info (Tamale, Greater Accra & Nationwide) ─────────────────────────

export function buildDeliveryInfoResponse(result: any): BuiltResponse {
  const region = result.queriedRegion || "Greater Accra";
  const city = result.queriedCity;
  const fee = result.deliveryFeeForQueriedRegionInGHS ?? 15;
  const isTamale = (city && city.toLowerCase() === "tamale") || region.toLowerCase().includes("northern");

  return {
    reply:
      `🚚 **Delivery Fees & Coverage Information:**\n\n` +
      (isTamale
        ? `📍 **Tamale & Northern Region Delivery:**\n` +
          `- **Fee:** **${ghc(25.00)} – ${ghc(30.00)}** per shipment via trusted parcel station couriers (VIP, OA, Imperial, STC).\n` +
          `- **Timeline:** **1 – 3 business days** to Tamale.\n\n`
        : `- 📍 **${city ? `${city} (${region})` : region}:** ${ghc(fee)}\n`) +
      `- 💰 **Greater Accra Flat Rate:** Flat **${ghc(15.00)}** (bulk delivery promotions may apply)\n` +
      `- ⏰ **Same-Day Cutoff:** Order before **2:00 PM** for same-day delivery in Greater Accra.\n` +
      `- 🌍 **Nationwide Coverage:** Delivered to all 16 regions of Ghana via verified bus & parcel stations.\n` +
      `- 🏭 **Warehouse Pickup:** Free pickup available from our central Accra hub!`,
  };
}

// ─── Payment Info (MoMo, Telecel, AT Money, Cards) ────────────────────────────

export function buildPaymentInfoResponse(result: any): BuiltResponse {
  return {
    reply:
      `💳 **Accepted Payment Methods:**\n\n` +
      `- 📱 **MTN Mobile Money (MoMo)** — Instant prompt to your phone\n` +
      `- 📱 **Telecel Cash (Vodafone Cash)** — Secure mobile wallet prompt\n` +
      `- 📱 **AT Money (AirtelTigo)** — Quick direct payment\n` +
      `- 💳 **Visa & Mastercard** — Encrypted payments powered by **Paystack**\n\n` +
      `💡 **How MoMo Works at Checkout:**\n` +
      `1. Enter your MoMo number at checkout.\n` +
      `2. Authorize the prompt on your phone by entering your PIN.\n` +
      `3. Your order is confirmed instantly! ✅\n\n` +
      `Need human help? WhatsApp us at: **${STORE_PHONE_DISPLAY}**`,
  };
}

// ─── Store Info ───────────────────────────────────────────────────────────────

export function buildStoreInfoResponse(result: any): BuiltResponse {
  return {
    reply:
      `🏪 **Kay's Packs Ghana**\n` +
      `_${result.tagline || "Pure Water Delivered to Your Door"}_\n\n` +
      `📞 **Phone:** ${result.phone || STORE_PHONE_DISPLAY}\n` +
      `💬 **WhatsApp:** [Chat with Manager on WhatsApp](${result.whatsappLink || STORE_WHATSAPP_LINK})\n` +
      `🕐 **Hours:** ${result.workingHours || "Mon–Sat: 8 AM – 6 PM"}\n` +
      `🌍 **Coverage:** Greater Accra & Nationwide across all 16 regions of Ghana`,
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
    const lines = (result.products as any[])
      .slice(0, 4)
      .map((p: any) => `- **${p.name}** — ${ghc(p.priceInGHS)}`);
    return {
      reply: `⭐ **Our Best Selling Water Packs:**\n\n${lines.join("\n")}\n\nSay **"add [product] to cart"** to order!`,
      suggestedProducts,
    };
  }

  const lines = bestSellers.map(
    (p) => `- **${p.name}** — ${ghc(p.price)} · ⭐ ${p.rating}/5 (${p.reviewCount} reviews)`
  );

  return {
    reply:
      `⭐ **Our Best Sellers — Customer Favorites in Ghana:**\n\n` +
      `${lines.join("\n")}\n\n` +
      `Say **"add [product name] to cart"** or click Add on any card below! 🛒`,
    suggestedProducts: bestSellers,
  };
}

// ─── Greeting & Thanks ───────────────────────────────────────────────────────

export function buildGreetingResponse(userName?: string, timeOfDay?: string): BuiltResponse {
  const firstName = userName ? userName.split(" ")[0] : "";
  const timeGreeting = timeOfDay ? `Good ${timeOfDay}${firstName ? `, ${firstName}` : ""}!` : `Hello${firstName ? ` ${firstName}` : ""}!`;

  const greetings = [
    `${timeGreeting} 👋 Welcome to **Kay's Packs** — Ghana's premier mineral water delivery hub.\n\n` +
      `I can assist you with:\n` +
      `- 🛍️ **Browsing water brands & checking prices** (Voltic, Bel-Aqua, Verna, etc.)\n` +
      `- 📦 **Checking stock & calculating multi-pack totals**\n` +
      `- 🛒 **Adding items to cart & checking out**\n` +
      `- 🚚 **Delivery fees & regional shipping (e.g. Tamale, Kumasi, Accra)**\n` +
      `- 💳 **MoMo and card payment questions**\n` +
      `- 📞 **Connecting with our store manager**\n\n` +
      `What would you like assistance with today?`,

    `Hi${firstName ? ` ${firstName}` : ""} there! 💧 Ready to stay hydrated?\n\n` +
      `We carry **Voltic**, **Bel-Aqua**, **Verna**, **Awake**, and **Slem Fit** water packs — delivered right to your doorstep across Ghana!\n\n` +
      `How can I help you today?`,
  ];

  return { reply: greetings[Math.floor(Math.random() * greetings.length)] };
}

export function buildThanksResponse(): BuiltResponse {
  const responses = [
    `You're very welcome! 😊 Stay hydrated, and let me know if you need anything else! 💧`,
    `My pleasure! Medaase! 💧 Let me know if you need help with products, delivery, or tracking!`,
    `Happy to help! Reach out anytime. 🛍️`,
  ];
  return { reply: responses[Math.floor(Math.random() * responses.length)] };
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

export function buildUnknownResponse(): BuiltResponse {
  return {
    reply:
      `I'm here to help you with everything water and delivery! 💧 Here's what I can do:\n\n` +
      `- 🛍️ **Browse products** — *"Do you have Voltic 500ml or Bel-Aqua?"*\n` +
      `- 💵 **Calculate prices** — *"What is the price of two packs of 500ml Voltic?"*\n` +
      `- 💰 **Budget help** — *"I have a budget of 50 cedis what can I buy?"*\n` +
      `- 🛒 **Add to cart & checkout** — *"Add 2 packs of Verna and checkout"*\n` +
      `- 🚚 **Delivery fees** — *"What is the delivery fee to Tamale / Accra?"*\n` +
      `- 💳 **Payments** — *"Can I pay with MoMo?"*\n` +
      `- 📞 **Manager Contact** — *"I need to speak to the manager/agent"*\n` +
      `- 🌙 **Dark Mode** — *"Can you help me turn on dark mode?"*\n\n` +
      `Or reach us directly on [WhatsApp](${STORE_WHATSAPP_LINK}) for instant help!`,
  };
}

// ─── Intent → Response router (for direct intents with no tool) ───────────────

export function buildDirectResponse(
  intent: ChatIntent,
  userName?: string,
  extra?: { targetTheme?: "dark" | "light" | "toggle"; timeOfDay?: string }
): BuiltResponse | null {
  switch (intent) {
    case "HOW_ARE_YOU":
      return buildHowAreYouResponse();
    case "GREETING":
      return buildGreetingResponse(userName, extra?.timeOfDay);
    case "THANKS":
      return buildThanksResponse();
    case "NEED_ASSISTANCE":
      return buildNeedAssistanceResponse();
    case "TOGGLE_DARK_MODE":
      return buildToggleThemeResponse(extra?.targetTheme);
    case "CONTACT_HUMAN":
      return buildContactHumanResponse();
    case "CREATE_ACCOUNT":
      return buildCreateAccountResponse();
    case "WHY_BUY_FROM_US":
      return buildWhyBuyFromUsResponse();
    case "WATER_PURITY_QUALITY":
      return buildWaterPurityResponse();
    case "BULK_WHOLESALE_ORDERS":
      return buildBulkWholesaleResponse();
    case "DISPENSER_REFILL_POLICY":
      return buildDispenserRefillResponse();
    case "DELIVERY_SPEED_TIMEFRAME":
      return buildDeliverySpeedResponse();
    case "CANCEL_REFUND_POLICY":
      return buildCancelRefundResponse();
    case "DISCOUNT_PROMO_POINTS":
      return buildDiscountPromoPointsResponse();
    case "WORKING_HOURS":
      return buildWorkingHoursResponse();
    case "CLEAR_CART":
      return buildClearCartResponse();
    // ── New static intents ────────────────────────────────────────────────────
    case "PAYMENT_FAILURE":
      return buildPaymentFailureResponse();
    case "PROMO_CODE_APPLY":
      return buildPromoCodeResponse();
    case "LOYALTY_POINTS_CHECK":
      return buildLoyaltyPointsResponse();
    case "ACCOUNT_LOGIN_HELP":
      return buildAccountLoginHelpResponse();
    case "EMERGENCY_DELIVERY":
      return buildEmergencyDeliveryResponse();
    case "DRIVER_CONTACT":
      return buildDriverContactResponse();
    case "ORDER_ETA":
      return buildOrderEtaResponse();
    case "MINIMUM_ORDER_INQUIRY":
      return buildMinimumOrderResponse();
    case "CORPORATE_ACCOUNT":
      return buildCorporateAccountResponse();
    case "GIFT_ORDER":
      return buildGiftOrderResponse();
    case "REFUND_REQUEST":
      return buildRefundRequestResponse();
    case "PRODUCT_COMPLAINT":
      return buildProductComplaintResponse();
    case "SOCIAL_MEDIA_INQUIRY":
      return buildSocialMediaResponse();
    case "SAVED_ADDRESSES":
      return buildSavedAddressesResponse();
    case "NEARBY_PICKUP":
      return buildNearbyPickupResponse();
    case "CHANGE_DELIVERY_ADDRESS":
      return buildChangeDeliveryAddressResponse();
    case "INVOICE_RECEIPT":
      return buildInvoiceReceiptResponse();
    case "ORDER_MODIFICATION":
      return buildOrderModificationResponse();
    case "CHANGE_PAYMENT_METHOD":
      return buildChangePaymentMethodResponse();
    case "DIETARY_WATER_INQUIRY":
      return buildDietaryWaterResponse();
    case "PACKAGING_INQUIRY":
      return buildPackagingInquiryResponse();
    case "STOCK_ALERT_REQUEST":
      return buildStockAlertResponse();
    case "UPSELL_COMBO":
      return buildUpsellComboResponse();
    case "MULTIPLE_DELIVERY_ADDRESSES":
      return buildMultipleAddressesResponse();
    case "UNKNOWN":
      return buildUnknownResponse();
    default:
      return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── NEW RESPONSE BUILDERS ─────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ─── Compare Products ─────────────────────────────────────────────────────────

export function buildCompareProductsResponse(result: any): BuiltResponse {
  if (!result.found || (!result.productA && !result.productB)) {
    return {
      reply:
        `❌ I couldn't find those products to compare.\n\n` +
        `We carry **Voltic**, **Bel-Aqua**, **Verna**, **Awake**, **Slem Fit**, and **Perla**.\n` +
        `Try: *"Compare Voltic and Verna"* or *"Bel-Aqua vs Slem Fit"*.`,
    };
  }

  const a = result.productA;
  const b = result.productB;

  if (!a || !b) {
    const single = a || b;
    return {
      reply:
        `💧 **${single.name}**\n\n` +
        `💰 **Price:** ${ghc(single.priceInGHS)}\n` +
        `📦 **Pack Size:** ${single.packSize}\n` +
        `📊 **Stock:** ${single.inStock ? "✅ In Stock" : "❌ Out of stock"}\n` +
        `⭐ **Rating:** ${single.rating}/5\n\n` +
        `Tell me the second product to compare! 🔍`,
    };
  }

  const cheaperLabel = a.priceInGHS < b.priceInGHS ? `💡 **${a.brand}** is ${ghc(b.priceInGHS - a.priceInGHS)} cheaper per pack.` : a.priceInGHS > b.priceInGHS ? `💡 **${b.brand}** is ${ghc(a.priceInGHS - b.priceInGHS)} cheaper per pack.` : `💡 Both are the same price!`;

  return {
    reply:
      `⚖️ **Product Comparison: ${a.brand} vs ${b.brand}**\n\n` +
      `| Feature | ${a.brand} | ${b.brand} |\n` +
      `|---------|-----------|----------|\n` +
      `| 📦 Pack Size | ${a.packSize} | ${b.packSize} |\n` +
      `| 💰 Price | **${ghc(a.priceInGHS)}** | **${ghc(b.priceInGHS)}** |\n` +
      `| 📊 Stock | ${a.inStock ? "✅ In Stock" : "❌ Out"} | ${b.inStock ? "✅ In Stock" : "❌ Out"} |\n` +
      `| ⭐ Rating | ${a.rating}/5 (${a.reviewCount} reviews) | ${b.rating}/5 (${b.reviewCount} reviews) |\n\n` +
      `${cheaperLabel}\n\n` +
      `Say **"add [brand] to cart"** to order your preferred one! 🛒`,
  };
}

// ─── Cancel Order ─────────────────────────────────────────────────────────────

export function buildCancelOrderResponse(result: any): BuiltResponse {
  if (!result.authenticated) {
    return {
      reply:
        `🔐 **Please log in** to cancel an order.\n\n` +
        `[Sign in here](/login) to view and manage your orders.`,
    };
  }

  if (result.guidedToPage) {
    return {
      reply:
        `🛑 **Order Cancellation:**\n\n` +
        `To cancel an order, please:\n` +
        `1. Share your **order number** (e.g. *KP-2026-0001*) here, or\n` +
        `2. Go directly to **[My Orders](/account?tab=orders)** to cancel from there.\n\n` +
        `Note: Orders can only be cancelled before they are dispatched for delivery. 📦`,
    };
  }

  if (!result.found) {
    return { reply: `❌ ${result.message}\n\nCheck your order number and try again, or view **[all your orders here](/account?tab=orders)**.` };
  }

  if (!result.canCancel) {
    return {
      reply:
        `⚠️ **Cannot Cancel Order ${result.orderNumber}**\n\n` +
        `Your order is currently **${result.status?.replace(/_/g, " ")}** — it's already too far in the delivery process to cancel via chat.\n\n` +
        `📞 **Need urgent help?** Contact our manager directly:\n` +
        `- [WhatsApp us immediately](${STORE_WHATSAPP_LINK})\n` +
        `- 📱 Call: **${STORE_PHONE_DISPLAY}**`,
    };
  }

  return {
    reply:
      `✅ **Order ${result.orderNumber} is eligible for cancellation!**\n\n` +
      `Your order is currently **${result.status?.replace(/_/g, " ")}**. ` +
      `To finalize the cancellation, please visit your **[Orders Page](/account?tab=orders)** and click the cancel button.\n\n` +
      `💰 **Refunds** are processed within **24 hours** to your original payment method.`,
  };
}

// ─── Repeat / Reorder ────────────────────────────────────────────────────────

export function buildRepeatOrderResponse(result: any): BuiltResponse {
  if (!result.authenticated) {
    return {
      reply:
        `🔐 **Please log in** to reorder your previous purchase.\n\n` +
        `[Sign in here](/login) to access your order history.`,
    };
  }

  if (!result.found) {
    return {
      reply:
        `No previous completed orders found! 🛍️\n\n` +
        `Let me help you place your **first order**. Browse our top water brands:\n` +
        `- 💧 **Voltic 500ml x 15** — ${ghc(45.00)}\n` +
        `- 💧 **Bel-Aqua 750ml x 15** — ${ghc(42.00)}\n` +
        `- 💧 **Verna 500ml x 15** — ${ghc(40.00)}\n\n` +
        `Say **"add [product] to cart"** to order! 🛒`,
    };
  }

  const itemLines = (result.items || [])
    .slice(0, 5)
    .map((i: any) => `- **${i.quantity}x** ${i.name} — ${ghc(i.priceInGHS)}`);

  return {
    reply:
      `🔄 **Your Last Order — ${result.orderNumber}** *(${result.orderDate})*\n\n` +
      `${itemLines.join("\n")}\n\n` +
      `**Order Total:** ${ghc(result.totalInGHS)}\n\n` +
      `Would you like me to **add these items to your cart** again? Just say *"yes, add them all"* or specify which ones! 🛒`,
  };
}

// ─── Payment Failure ──────────────────────────────────────────────────────────

export function buildPaymentFailureResponse(): BuiltResponse {
  return {
    reply:
      `⚠️ **Payment Issue? Here's What To Do:**\n\n` +
      `**If MoMo was deducted but your order wasn't confirmed:**\n` +
      `1. ✅ Check your **[Order History](/account?tab=orders)** first — it may have been processed.\n` +
      `2. 🔄 Wait up to **5 minutes** for the MoMo payment to reflect.\n` +
      `3. 📸 Take a screenshot of your MoMo deduction SMS.\n` +
      `4. 💬 **[WhatsApp our manager immediately](${STORE_WHATSAPP_LINK})** with the screenshot.\n\n` +
      `**Payment Failed at Checkout?**\n` +
      `- Try a different payment method (Card, Telecel Cash, AT Money).\n` +
      `- Ensure your MoMo account has sufficient funds.\n` +
      `- Try again or contact us for manual payment: **${STORE_PHONE_DISPLAY}**\n\n` +
      `We resolve all payment issues within **1 business hour!** ⚡`,
  };
}

// ─── Promo Code ───────────────────────────────────────────────────────────────

export function buildPromoCodeResponse(): BuiltResponse {
  return {
    reply:
      `🏷️ **Using a Promo or Discount Code:**\n\n` +
      `1. Add your water packs to cart\n` +
      `2. Proceed to **[Checkout](/checkout)**\n` +
      `3. Look for the **"Promo Code"** field and enter your code\n` +
      `4. Click **Apply** — your discount will be reflected instantly!\n\n` +
      `🎁 **Don't have a promo code?**\n` +
      `- Registered accounts earn **Hydration Points** on every order\n` +
      `- Bulk orders of 50+ packs qualify for **automatic volume discounts**\n` +
      `- Follow us on social media for exclusive promo announcements!\n\n` +
      `Need a custom bulk quote? [WhatsApp us](${STORE_WHATSAPP_LINK})`,
  };
}

// ─── Loyalty Points ───────────────────────────────────────────────────────────

export function buildLoyaltyPointsResponse(): BuiltResponse {
  return {
    reply:
      `💎 **Your Hydration Loyalty Points:**\n\n` +
      `Check your current points balance in your **[Account Dashboard](/account)**.\n\n` +
      `**How points work:**\n` +
      `- 🛍️ Earn points on every completed order\n` +
      `- 💰 Redeem points for **instant checkout discounts**\n` +
      `- 🎁 Special bonus points on bulk orders and referrals\n\n` +
      `**[View My Points Balance → /account](/account)**\n\n` +
      `Not registered yet? **[Create an account](/register)** to start earning! 🚀`,
  };
}

// ─── Account Login Help ───────────────────────────────────────────────────────

export function buildAccountLoginHelpResponse(): BuiltResponse {
  return {
    reply:
      `🔐 **Account Login Help:**\n\n` +
      `**Forgot your password?**\n` +
      `1. Go to the **[Login page](/login)**\n` +
      `2. Click **"Forgot Password?"**\n` +
      `3. Enter your registered email address\n` +
      `4. Check your inbox for the password reset link\n\n` +
      `**Still can't log in?**\n` +
      `- Make sure you're using the email address you registered with\n` +
      `- Check your spam/junk folder for the reset email\n` +
      `- 💬 **[WhatsApp our team](${STORE_WHATSAPP_LINK})** for account recovery assistance\n\n` +
      `Don't have an account yet? **[Register here](/register)** — it only takes 30 seconds!`,
  };
}

// ─── Emergency / Urgent Delivery ─────────────────────────────────────────────

export function buildEmergencyDeliveryResponse(): BuiltResponse {
  return {
    reply:
      `🚨 **Urgent / Emergency Water Delivery:**\n\n` +
      `Need water delivered **right now?** Here's the fastest route:\n\n` +
      `1. 💬 **WhatsApp our manager directly** → [Click to WhatsApp](${STORE_WHATSAPP_LINK})\n` +
      `2. 📱 **Call us** → **${STORE_PHONE_DISPLAY}**\n` +
      `3. Mention **"URGENT DELIVERY"** so we can prioritize your order\n\n` +
      `⏰ **Same-Day Delivery:** Orders placed before **2:00 PM** in Greater Accra are delivered the same day (usually within **2–4 hours**).\n\n` +
      `Outside Accra? Our team will confirm the fastest available option for your region. 🚀`,
  };
}

// ─── Driver Contact ───────────────────────────────────────────────────────────

export function buildDriverContactResponse(): BuiltResponse {
  return {
    reply:
      `🏍️ **Contact Your Delivery Driver:**\n\n` +
      `Driver contact details are shared via **SMS/WhatsApp** when your order is dispatched.\n\n` +
      `**Can't reach your driver?**\n` +
      `- 💬 **[WhatsApp our dispatch team](${STORE_WHATSAPP_LINK})** — we'll connect you immediately\n` +
      `- 📱 **Call us:** ${STORE_PHONE_DISPLAY}\n` +
      `- 📦 Check your order status in **[My Orders](/account?tab=orders)**\n\n` +
      `Our team monitors all deliveries in real-time. We'll resolve any delivery issue fast! ⚡`,
  };
}

// ─── Order ETA ────────────────────────────────────────────────────────────────

export function buildOrderEtaResponse(): BuiltResponse {
  return {
    reply:
      `⏰ **Estimated Delivery Times:**\n\n` +
      `- 🚀 **Greater Accra (Same-Day):** Orders before **2:00 PM** arrive within **2–4 hours**\n` +
      `- 🌅 **Greater Accra (Next-Day):** Orders after 2:00 PM are dispatched from **8:00 AM the next morning**\n` +
      `- 🌍 **Ashanti (Kumasi):** 1–2 business days via parcel station\n` +
      `- 🌍 **Northern (Tamale), Western (Takoradi):** 1–3 business days\n` +
      `- 🌍 **All Other Regions:** 2–4 business days via verified bus stations\n\n` +
      `📦 **Track your specific order** in **[My Orders](/account?tab=orders)** or share your order number here for a live status update!`,
  };
}

// ─── Minimum Order ────────────────────────────────────────────────────────────

export function buildMinimumOrderResponse(): BuiltResponse {
  return {
    reply:
      `📦 **Minimum Order Information:**\n\n` +
      `- ✅ **No minimum order** — you can order as little as **1 pack**!\n` +
      `- Our packs are pre-bundled (e.g. 15 bottles per pack, 16 bottles per pack) — you cannot split a pack.\n` +
      `- 🚚 **Delivery:** Flat **${ghc(15.00)}** in Greater Accra regardless of order size.\n\n` +
      `💡 **Tip:** Bundle 2+ different packs in one order to maximize delivery value!\n\n` +
      `Say **"show me your cheapest products"** to see our most affordable options. 💧`,
  };
}

// ─── Corporate Account ────────────────────────────────────────────────────────

export function buildCorporateAccountResponse(): BuiltResponse {
  return {
    reply:
      `🏢 **Corporate & Business Water Supply:**\n\n` +
      `We supply offices, hotels, schools, hospitals, and institutions across Ghana!\n\n` +
      `**Corporate Benefits:**\n` +
      `- 💰 **Volume pricing** — significant discounts on large recurring orders\n` +
      `- 📅 **Scheduled deliveries** — weekly or monthly dispatch on your schedule\n` +
      `- 🧾 **Corporate invoicing** — official receipts for accounting purposes\n` +
      `- 🏢 **Dedicated account manager** for all your water supply needs\n` +
      `- 🔄 **Dispenser bottle exchange service** for office coolers\n\n` +
      `📞 **Get a custom corporate quote today:**\n` +
      `- 💬 [WhatsApp our Business Team](${STORE_WHATSAPP_LINK})\n` +
      `- 📱 Call: **${STORE_PHONE_DISPLAY}**\n\n` +
      `_We currently supply 50+ businesses across Greater Accra!_ 🌟`,
  };
}

// ─── Gift Order ───────────────────────────────────────────────────────────────

export function buildGiftOrderResponse(): BuiltResponse {
  return {
    reply:
      `🎁 **Send Water as a Gift:**\n\n` +
      `A thoughtful and practical gift! Here's how to send water to someone:\n\n` +
      `1. 🛒 **Add the water pack(s)** to your cart as normal\n` +
      `2. 💳 **Proceed to checkout**\n` +
      `3. 📍 Enter the **recipient's delivery address** (not yours)\n` +
      `4. 📝 Add a **gift note** in the order notes section\n` +
      `5. ✅ Complete payment — we'll deliver it to them!\n\n` +
      `💬 **For a personal touch**, WhatsApp us at **${STORE_PHONE_DISPLAY}** and we can coordinate special delivery instructions for your recipient.`,
  };
}

// ─── Refund Request ───────────────────────────────────────────────────────────

export function buildRefundRequestResponse(): BuiltResponse {
  return {
    reply:
      `💰 **Refund Request:**\n\n` +
      `We're sorry to hear you need a refund! Here's our process:\n\n` +
      `**Eligible for refunds:**\n` +
      `- ❌ Order cancelled before dispatch\n` +
      `- 🔄 Wrong product delivered\n` +
      `- 📦 Damaged or leaking bottles on delivery\n\n` +
      `**How to request a refund:**\n` +
      `1. 💬 **[WhatsApp our manager](${STORE_WHATSAPP_LINK})** with your order number and issue\n` +
      `2. 📱 Or **call us** at **${STORE_PHONE_DISPLAY}**\n` +
      `3. Provide your **payment screenshot / MoMo number** for faster processing\n\n` +
      `⚡ **Refunds are processed within 24 hours** to your original MoMo or card.`,
  };
}

// ─── Product Complaint ────────────────────────────────────────────────────────

export function buildProductComplaintResponse(): BuiltResponse {
  return {
    reply:
      `😟 **We're Sorry to Hear That! Let Us Fix This:**\n\n` +
      `Your satisfaction is our top priority. Here's how we resolve complaints:\n\n` +
      `**For damaged or wrong products:**\n` +
      `- 🔄 Our driver will **immediately exchange** any damaged/leaking bottles on delivery at zero cost\n` +
      `- If the driver has left, contact us and we'll arrange a replacement\n\n` +
      `**To make a complaint right now:**\n` +
      `1. 💬 **[WhatsApp us immediately](${STORE_WHATSAPP_LINK})** — fastest resolution\n` +
      `2. 📱 **Call us:** **${STORE_PHONE_DISPLAY}**\n` +
      `3. Share your **order number** and a **photo** of the issue\n\n` +
      `⚡ We resolve all complaints within **2 hours** during business hours. *Medaase* (Thank you) for your patience! 🙏`,
  };
}

// ─── Social Media ─────────────────────────────────────────────────────────────

export function buildSocialMediaResponse(): BuiltResponse {
  return {
    reply:
      `📱 **Kay's Packs on Social Media:**\n\n` +
      `Follow us for exclusive promos, water facts, and delivery updates!\n\n` +
      `- 📘 **Facebook:** [Kay's Packs Ghana](https://facebook.com/kayspacks)\n` +
      `- 📸 **Instagram:** [@kayspacks](https://instagram.com/kayspacks)\n` +
      `- 🎵 **TikTok:** [@kayspacks](https://tiktok.com/@kayspacks)\n` +
      `- 💬 **WhatsApp:** [Chat with us directly](${STORE_WHATSAPP_LINK})\n\n` +
      `👍 **Like & Follow** to stay updated on flash sales, bundle deals, and new product launches! 🎉`,
  };
}

// ─── Saved Addresses ─────────────────────────────────────────────────────────

export function buildSavedAddressesResponse(): BuiltResponse {
  return {
    reply:
      `📍 **Manage Your Saved Delivery Addresses:**\n\n` +
      `View, add, or edit your saved delivery addresses in your **[Account Settings](/account?tab=addresses)**.\n\n` +
      `**Benefits of saving addresses:**\n` +
      `- ⚡ **1-click reordering** — no need to re-type your address every time\n` +
      `- 📦 **Multiple locations** — save home, office, or gift delivery addresses\n` +
      `- 🚀 **Faster checkout** — skip the address form entirely\n\n` +
      `**[Manage Addresses → /account?tab=addresses](/account?tab=addresses)**`,
  };
}

// ─── Nearby Pickup / Warehouse Collection ────────────────────────────────────

export function buildNearbyPickupResponse(): BuiltResponse {
  return {
    reply:
      `🏭 **Warehouse Pickup — Self-Collection:**\n\n` +
      `Yes! You can pick up your order for **FREE** directly from our central Accra distribution hub.\n\n` +
      `**How it works:**\n` +
      `1. 🛒 Place your order normally on the website\n` +
      `2. 📦 At checkout, select **"Warehouse Pickup"** as your delivery method\n` +
      `3. 💬 You'll receive a **WhatsApp notification** when your order is ready for collection\n` +
      `4. 🏭 Come collect during **working hours: Mon–Sat, 8:00 AM – 6:00 PM**\n\n` +
      `📍 **Location:** Central Accra Distribution Hub, Ghana\n` +
      `📱 **For directions:** [WhatsApp us](${STORE_WHATSAPP_LINK}) — we'll send you the exact location pin!`,
  };
}

// ─── Change Delivery Address ─────────────────────────────────────────────────

export function buildChangeDeliveryAddressResponse(): BuiltResponse {
  return {
    reply:
      `📍 **Change Delivery Address:**\n\n` +
      `**Before placing your order:**\n` +
      `- Simply enter your correct address at checkout — no action needed!\n\n` +
      `**After placing your order:**\n` +
      `- 🚨 Contact us **immediately** before dispatch:\n` +
      `  - 💬 [WhatsApp: ${STORE_PHONE_DISPLAY}](${STORE_WHATSAPP_LINK})\n` +
      `  - 📱 Call: **${STORE_PHONE_DISPLAY}**\n` +
      `- Share your **order number** and the **new address**\n` +
      `- Address changes can only be made before the rider is dispatched\n\n` +
      `**For future orders**, save your addresses in **[Account Settings](/account?tab=addresses)** for 1-click reordering!`,
  };
}

// ─── Invoice / Receipt ────────────────────────────────────────────────────────

export function buildInvoiceReceiptResponse(): BuiltResponse {
  return {
    reply:
      `🧾 **Order Receipts & Invoices:**\n\n` +
      `**Digital receipts** are automatically sent to your registered email after every completed order.\n\n` +
      `**To get your receipt:**\n` +
      `1. 📋 Visit **[My Orders](/account?tab=orders)**\n` +
      `2. Click on the order you need a receipt for\n` +
      `3. Click **"Download Receipt / Invoice"**\n\n` +
      `**Don't see it?**\n` +
      `- Check your spam/junk folder\n` +
      `- 💬 WhatsApp us your **order number** and we'll send the receipt directly: [${STORE_PHONE_DISPLAY}](${STORE_WHATSAPP_LINK})`,
  };
}

// ─── Order Modification ───────────────────────────────────────────────────────

export function buildOrderModificationResponse(): BuiltResponse {
  return {
    reply:
      `✏️ **Modify an Existing Order:**\n\n` +
      `**Orders can be modified before dispatch** (usually within 30 minutes of placing).\n\n` +
      `**To modify your order:**\n` +
      `1. 💬 **[WhatsApp us immediately](${STORE_WHATSAPP_LINK})** with:\n` +
      `   - Your **order number**\n` +
      `   - What you'd like to **add, remove, or change**\n` +
      `2. 📱 Or **call us:** **${STORE_PHONE_DISPLAY}**\n\n` +
      `⚠️ Once an order is **"Out for Delivery"**, modifications are no longer possible.\n\n` +
      `**Adding more items?** You can always place a **new order** and we can combine delivery where possible!`,
  };
}

// ─── Change Payment Method ───────────────────────────────────────────────────

export function buildChangePaymentMethodResponse(): BuiltResponse {
  return {
    reply:
      `💳 **Changing Your Payment Method:**\n\n` +
      `**At checkout**, you can freely choose between:\n` +
      `- 📱 **MTN Mobile Money (MoMo)**\n` +
      `- 📱 **Telecel Cash** (Vodafone Cash)\n` +
      `- 📱 **AT Money** (AirtelTigo)\n` +
      `- 💳 **Visa / Mastercard** (secured by Paystack)\n\n` +
      `**For an existing unpaid order:**\n` +
      `- Simply go to **[My Orders](/account?tab=orders)** and click **"Pay Now"** — you can choose a different payment method.\n\n` +
      `💬 Need help? **[WhatsApp us](${STORE_WHATSAPP_LINK})** and we'll send you a manual payment link!`,
  };
}

// ─── Dietary / Mineral Water Inquiry ─────────────────────────────────────────

export function buildDietaryWaterResponse(): BuiltResponse {
  return {
    reply:
      `🔬 **Water Types & Mineral Content Guide:**\n\n` +
      `| Brand | Type | Best For | pH Level |\n` +
      `|-------|------|----------|----------|\n` +
      `| **Verna** | Natural Mineral | Babies, low-sodium diets | ~7.0 (neutral) |\n` +
      `| **Slem Fit** | Alkaline Mineral | Gym & fitness recovery | ~8.0+ (alkaline) |\n` +
      `| **Voltic** | Natural Mineral | Daily hydration | ~7.0 (neutral) |\n` +
      `| **Bel-Aqua** | Natural Mineral | Daily hydration | ~7.0 (neutral) |\n` +
      `| **Awake** | Purified | General use, supports heart charity | ~7.0 (neutral) |\n\n` +
      `💡 **All brands are FDA Ghana & GSA certified** with full factory seals.\n` +
      `For specific mineral content sheets, WhatsApp us: [${STORE_PHONE_DISPLAY}](${STORE_WHATSAPP_LINK})`,
  };
}

// ─── Packaging / Single Bottle Inquiry ───────────────────────────────────────

export function buildPackagingInquiryResponse(): BuiltResponse {
  return {
    reply:
      `📦 **Packaging & Bottle Options:**\n\n` +
      `We sell water in **pre-packed bundles** — here are our smallest options:\n\n` +
      `| Size | Pack Content | Price |\n` +
      `|------|-------------|-------|\n` +
      `| 🥤 **Voltic Pocket 350ml** | 15 bottles per pack | ${ghc(32.00)} |\n` +
      `| 💧 **Verna 500ml** | 15 bottles per pack | ${ghc(40.00)} |\n` +
      `| 💧 **Bel-Aqua 500ml** | 15 bottles per pack | ${ghc(38.00)} |\n` +
      `| 🏺 **Verna Jar 15L** | 1 dispenser jar | ${ghc(30.00)} |\n\n` +
      `⚠️ **We don't sell individual bottles** — minimum is 1 pack (15–16 bottles).\n\n` +
      `For large quantities or custom packaging, contact us: [WhatsApp](${STORE_WHATSAPP_LINK})`,
  };
}

// ─── Stock Alert Request ──────────────────────────────────────────────────────

export function buildStockAlertResponse(): BuiltResponse {
  return {
    reply:
      `🔔 **Stock Availability Alerts:**\n\n` +
      `To be notified when a product is back in stock:\n\n` +
      `1. **[Create or sign in to your account](/login)** (if you haven't already)\n` +
      `2. Visit the product page and click **"Notify Me When Available"**\n` +
      `3. ✅ You'll receive a WhatsApp/email notification the moment it's restocked!\n\n` +
      `**Prefer instant updates?** 💬 **[WhatsApp us](${STORE_WHATSAPP_LINK})** with the product name and we'll notify you personally when it's available.\n\n` +
      `Which product are you waiting for? I can check current stock right now! 📦`,
  };
}

// ─── Upsell / Combo Recommendations ─────────────────────────────────────────

export function buildUpsellComboResponse(): BuiltResponse {
  return {
    reply:
      `🎁 **Best Value Water Combos & Bundles:**\n\n` +
      `Here are our most popular combinations customers love:\n\n` +
      `**🏆 Family Hydration Bundle:**\n` +
      `- 2x Voltic 500ml x 15 (${ghc(90.00)}) + 1x Verna 15L Jar (${ghc(30.00)}) = **${ghc(120.00)}**\n\n` +
      `**💪 Office Starter Pack:**\n` +
      `- 1x Bel-Aqua 750ml x 15 (${ghc(42.00)}) + 1x Awake 750ml x 16 (${ghc(45.00)}) = **${ghc(87.00)}**\n\n` +
      `**🏋️ Gym & Fitness Pack:**\n` +
      `- 2x Slem Fit 500ml x 16 (${ghc(76.00)}) + 1x Verna 500ml x 15 (${ghc(40.00)}) = **${ghc(116.00)}**\n\n` +
      `💡 *Combine orders to maximize delivery value!*\n\n` +
      `Say **"add [product] to cart"** for any of these, or let me build a custom bundle for you! 🛒`,
  };
}

// ─── Multiple Delivery Addresses ─────────────────────────────────────────────

export function buildMultipleAddressesResponse(): BuiltResponse {
  return {
    reply:
      `📍 **Delivering to Multiple Addresses:**\n\n` +
      `Currently, each order can only be delivered to **one address**.\n\n` +
      `**To deliver to two different locations:**\n` +
      `1. 🛒 **Place Order 1** with the first address\n` +
      `2. 🛒 **Place Order 2** with the second address\n` +
      `3. 💬 **[WhatsApp us](${STORE_WHATSAPP_LINK})** — we may be able to combine both into a single delivery trip if they're in the same area!\n\n` +
      `📱 Contact: **${STORE_PHONE_DISPLAY}** for custom multi-address arrangements.`,
  };
}
