import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  callGeminiGenerateContent,
  isGeminiConfigured,
  GeminiContent,
  GEMINI_MODEL_NAME,
} from "@/lib/gemini/client";
import { CHATBOT_FUNCTION_DECLARATIONS } from "@/lib/gemini/tools-definition";
import {
  executeChatbotTool,
  ClientAction,
  ChatSessionUser,
} from "@/services/chat/chat-tools.service";
import { detectIntent, ExtractedEntities, ChatIntent } from "@/lib/chat/intent-engine";
import * as RB from "@/lib/chat/response-builder";
import { STORE_PRODUCTS, STORE_PHONE_DISPLAY, STORE_WHATSAPP_LINK, StoreProduct } from "@/lib/constants";

// ─── Shared types ────────────────────────────────────────────────────────────

interface ChatAPIResponse {
  reply: string;
  clientActions: ClientAction[];
  suggestedProducts: StoreProduct[];
}

// ─── Local Engine ─────────────────────────────────────────────────────────────

/**
 * The fully-local chatbot engine.
 * Detects intent, resolves entities, executes the right tool, and builds a reply.
 * Never requires an external API — always works.
 */
async function runLocalEngine(
  messages: Array<{ role: string; content: string }>,
  clientCartItems: Array<{ productId: string; quantity: number }>,
  sessionUser: ChatSessionUser
): Promise<ChatAPIResponse> {
  const lastUserMsg = messages[messages.length - 1];
  const text = (lastUserMsg?.content || "").trim();
  const messageHistory = messages.slice(0, -1);

  // ── 1. Detect intent + extract entities ──────────────────────────────────
  const { intent, entities } = detectIntent(text, messageHistory);

  const context = { sessionUser, clientCartItems };
  const collectedClientActions: ClientAction[] = [];

  // Determine time of day if user said greeting
  let timeOfDay: string | undefined;
  if (/good\s+morning/i.test(text)) timeOfDay = "morning";
  else if (/good\s+afternoon/i.test(text)) timeOfDay = "afternoon";
  else if (/good\s+evening/i.test(text)) timeOfDay = "evening";

  // ── 2. Handle direct intents with no tool calls ──────────────────────────
  const directResponse = RB.buildDirectResponse(intent, sessionUser.name ?? undefined, {
    targetTheme: entities.targetTheme,
    timeOfDay,
  });

  if (directResponse) {
    if (intent === "CLEAR_CART") {
      collectedClientActions.push({ type: "CLEAR_CART" });
    } else if (intent === "TOGGLE_DARK_MODE") {
      collectedClientActions.push({
        type: "SET_THEME",
        payload: { theme: entities.targetTheme || "toggle" },
      });
    } else if (intent === "CONTACT_HUMAN") {
      collectedClientActions.push({
        type: "OPEN_WHATSAPP",
        payload: { url: STORE_WHATSAPP_LINK },
      });
    } else if (intent === "CREATE_ACCOUNT") {
      collectedClientActions.push({
        type: "NAVIGATE_TO_REGISTER",
        payload: { url: "/register" },
      });
    }

    return {
      reply: directResponse.reply,
      clientActions: collectedClientActions,
      suggestedProducts: directResponse.suggestedProducts ?? [],
    };
  }

  // ── 3. Handle specific in-memory intent responses ────────────────────────
  if (intent === "THIRSTY") {
    const thirstyResp = RB.buildThirstyResponse(STORE_PRODUCTS.filter((p) => p.inStock));
    return {
      reply: thirstyResp.reply,
      clientActions: [],
      suggestedProducts: thirstyResp.suggestedProducts ?? [],
    };
  }

  if (intent === "STORE_CATALOG_OVERVIEW") {
    const catalogResp = RB.buildStoreCatalogOverviewResponse(STORE_PRODUCTS.filter((p) => p.inStock));
    return {
      reply: catalogResp.reply,
      clientActions: [],
      suggestedProducts: catalogResp.suggestedProducts ?? [],
    };
  }

  if (intent === "PRICE_CALCULATION") {
    const matched = entities.matchedProduct || STORE_PRODUCTS[0];
    const qty = entities.quantity || 1;
    const priceResp = RB.buildPriceCalculationResponse(matched, qty);
    return {
      reply: priceResp.reply,
      clientActions: [],
      suggestedProducts: priceResp.suggestedProducts ?? [matched],
    };
  }

  if (intent === "BUDGET_RECOMMENDATION") {
    const budget = entities.budget || 50;
    const affordable = STORE_PRODUCTS.filter((p) => p.price <= budget && p.inStock);
    const budgetResp = RB.buildBudgetRecommendationResponse(budget, affordable);
    return {
      reply: budgetResp.reply,
      clientActions: [],
      suggestedProducts: budgetResp.suggestedProducts ?? affordable.slice(0, 4),
    };
  }

  if (intent === "WATER_RECOMMENDATION_BABY_GYM") {
    const healthResp = RB.buildWaterHealthResponse(STORE_PRODUCTS.filter((p) => p.inStock));
    return {
      reply: healthResp.reply,
      clientActions: [],
      suggestedProducts: healthResp.suggestedProducts ?? [],
    };
  }

  // ── 4. Map intent → tool call ─────────────────────────────────────────────
  type ToolCall = { name: string; args: Record<string, any> };
  const toolCalls = resolveToolCalls(intent, entities, clientCartItems);

  if (toolCalls.length === 0) {
    return {
      reply: RB.buildUnknownResponse().reply,
      clientActions: [],
      suggestedProducts: [],
    };
  }

  // ── 5. Execute tool(s) ────────────────────────────────────────────────────
  const suggestedProducts: StoreProduct[] = [];
  let lastResult: any = null;
  let lastToolName = "";

  for (const tc of toolCalls) {
    try {
      const toolResult = await executeChatbotTool(tc.name, tc.args, context);
      lastResult = toolResult.result;
      lastToolName = tc.name;

      if (toolResult.clientAction) {
        collectedClientActions.push(toolResult.clientAction);
      }
      if (toolResult.suggestedProducts) {
        for (const p of toolResult.suggestedProducts) {
          if (!suggestedProducts.some((e) => e.id === p.id)) {
            suggestedProducts.push(p);
          }
        }
      }
    } catch (err) {
      console.warn(`[LocalEngine] Tool "${tc.name}" failed:`, err);
    }
  }

  if (!lastResult) {
    return {
      reply: RB.buildUnknownResponse().reply,
      clientActions: collectedClientActions,
      suggestedProducts,
    };
  }

  // ── 6. Build response ─────────────────────────────────────────────────────
  const builtResponse = buildToolResponse(intent, lastToolName, lastResult, suggestedProducts, entities);

  return {
    reply: builtResponse.reply,
    clientActions: collectedClientActions,
    suggestedProducts: builtResponse.suggestedProducts ?? suggestedProducts,
  };
}

/** Map a detected intent to the correct tool name + arguments */
function resolveToolCalls(
  intent: ChatIntent,
  entities: ExtractedEntities,
  clientCartItems: Array<{ productId: string; quantity: number }>
): Array<{ name: string; args: Record<string, any> }> {
  const ident = entities.productIdentifier || entities.brand || "";

  switch (intent) {
    case "SEARCH_PRODUCTS":
      return [
        {
          name: "searchProducts",
          args: {
            query: entities.brand || undefined,
            brand: entities.brand || undefined,
            inStockOnly: false,
          },
        },
      ];

    case "BEST_SELLERS":
      return [
        {
          name: "searchProducts",
          args: { inStockOnly: true },
        },
      ];

    case "GET_PRODUCT_DETAIL":
      return [
        {
          name: "getProduct",
          args: { name: ident || undefined },
        },
      ];

    case "CHECK_STOCK":
      return [
        {
          name: "checkStock",
          args: {
            productIdentifier: ident,
            requestedQuantity: entities.quantity || 1,
          },
        },
      ];

    case "ADD_TO_CART": {
      const identifier =
        entities.matchedProduct?.name ||
        entities.productIdentifier ||
        entities.brand ||
        "";
      if (!identifier) {
        return [
          {
            name: "searchProducts",
            args: { inStockOnly: true },
          },
        ];
      }
      return [
        {
          name: "addToCart",
          args: {
            productIdentifier: identifier,
            quantity: entities.quantity || 1,
          },
        },
      ];
    }

    case "ADD_AND_CHECKOUT": {
      const identifier =
        entities.matchedProduct?.name ||
        entities.productIdentifier ||
        entities.brand ||
        "";
      if (!identifier) {
        return [{ name: "guideToCheckout", args: {} }];
      }
      return [
        {
          name: "addToCart",
          args: {
            productIdentifier: identifier,
            quantity: entities.quantity || 1,
            andCheckout: true,
          },
        },
        {
          name: "guideToCheckout",
          args: {},
        },
      ];
    }

    case "REMOVE_FROM_CART": {
      const identifier =
        entities.matchedProduct?.id ||
        entities.productIdentifier ||
        entities.brand ||
        "";
      if (!identifier) return [];
      return [
        {
          name: "removeFromCart",
          args: { productIdentifier: identifier },
        },
      ];
    }

    case "UPDATE_CART_QTY": {
      const identifier =
        entities.matchedProduct?.id ||
        entities.productIdentifier ||
        entities.brand ||
        "";
      if (!identifier) return [];
      return [
        {
          name: "updateCartQuantity",
          args: {
            productIdentifier: identifier,
            quantity: entities.newQuantity ?? entities.quantity ?? 1,
          },
        },
      ];
    }

    case "VIEW_CART":
      return [{ name: "getCart", args: {} }];

    case "CHECKOUT":
      return [{ name: "guideToCheckout", args: {} }];

    case "MY_ORDERS":
      return [{ name: "getCustomerOrders", args: { limit: 5 } }];

    case "TRACK_ORDER":
      if (!entities.orderNumber) return [{ name: "getCustomerOrders", args: { limit: 3 } }];
      return [
        {
          name: "getOrderStatus",
          args: { orderNumber: entities.orderNumber },
        },
      ];

    case "DELIVERY_INFO":
      return [
        {
          name: "getDeliveryInformation",
          args: {
            region: entities.region || "Greater Accra",
            city: entities.city || undefined,
          },
        },
      ];

    case "PAYMENT_INFO":
    case "STORE_INFO":
      return [{ name: "getStoreInfo", args: {} }];

    default:
      return [];
  }
}

/** Route the tool result to the correct response builder */
function buildToolResponse(
  intent: ChatIntent,
  toolName: string,
  result: any,
  suggestedProducts: StoreProduct[],
  entities?: ExtractedEntities
): { reply: string; suggestedProducts?: StoreProduct[] } {
  switch (toolName) {
    case "searchProducts":
      if (intent === "BEST_SELLERS") {
        return RB.buildBestSellersResponse(result, suggestedProducts);
      }
      return RB.buildSearchProductsResponse(result, suggestedProducts);

    case "getProduct":
      return RB.buildGetProductResponse(result, suggestedProducts);

    case "checkStock":
      return RB.buildCheckStockResponse(result, suggestedProducts);

    case "addToCart":
      if (intent === "ADD_AND_CHECKOUT" || entities?.andCheckout) {
        return RB.buildAddAndCheckoutResponse(result, suggestedProducts);
      }
      return RB.buildAddToCartResponse(result, suggestedProducts);

    case "removeFromCart":
      return RB.buildRemoveFromCartResponse(result);

    case "updateCartQuantity":
      return RB.buildUpdateQuantityResponse(result);

    case "getCart":
      return RB.buildViewCartResponse(result);

    case "guideToCheckout":
      return RB.buildCheckoutResponse(result);

    case "getCustomerOrders":
      return RB.buildGetOrdersResponse(result);

    case "getOrderStatus":
      return RB.buildOrderStatusResponse(result);

    case "getDeliveryInformation":
      return RB.buildDeliveryInfoResponse(result);

    case "getStoreInfo":
      if (intent === "PAYMENT_INFO") {
        return RB.buildPaymentInfoResponse(result);
      }
      return RB.buildStoreInfoResponse(result);

    default:
      return RB.buildUnknownResponse();
  }
}

// ─── Gemini Engine ────────────────────────────────────────────────────────────

/**
 * Runs the Gemini-powered engine with tool calling.
 * Returns null if it fails or times out (local engine will be used instead).
 */
async function runGeminiEngine(
  messages: Array<{ role: string; content: string }>,
  clientCartItems: Array<{ productId: string; quantity: number }>,
  sessionUser: ChatSessionUser
): Promise<ChatAPIResponse | null> {
  const isAuth = !!sessionUser.id;
  const userName =
    sessionUser.name ||
    (sessionUser.email ? sessionUser.email.split("@")[0] : "Valued Customer");

  const systemInstruction = `You are "Kay's Packs AI Hydration Assistant", the expert, friendly, and smart AI shopping assistant for Kay's Packs (Ghana's premier online mineral water delivery & dispenser hub).

CRITICAL DOMAIN RULES:
- Kay's Packs is strictly a BOTTLED MINERAL WATER & DISPENSER DELIVERY STORE in Ghana.
- We sell multi-bottle packs (shrink-wrapped packs of 12, 15, 16, 20, or 24 bottles), sachet water bags, and 15L/19L dispenser bottles.
- WE DO NOT SELL HIKING BACKPACKS, RUCKSACKS, HYDRATION BAGS, OR CAMPING GEAR. The name "Kay's Packs" refers to packs of water bottles. If a user asks about backpacks, kindly clarify that we are Ghana's mineral water delivery hub.
- Top Ghanaian mineral water brands we stock: Voltic Natural Mineral Water, Bel-Aqua, Verna Natural Mineral Water, Awake Purified Water, Perla, Slem Fit, and Special Ice.

CUSTOMER PROFILE:
- Name: ${userName}
- Logged in: ${isAuth ? "Yes (Authenticated Account)" : "No (Guest Visitor)"}
- User ID: ${sessionUser.id || "None"}
- Email: ${sessionUser.email || "None"}

STORE FACTS & POLICIES:
- Currency: Ghanaian Cedis (GH₵ / GHS).
- Greater Accra Delivery: Flat rate GH₵15. FREE delivery on all orders of GH₵100 and above.
- Same-Day Delivery Cutoff: 2:00 PM for Greater Accra orders (delivered within 2-4 hours).
- Nationwide Delivery (Tamale, Kumasi, Takoradi, Sunyani, Ho, Bolgatanga, Wa, etc.): Available to all 16 regions of Ghana via verified station parcel couriers (VIP, OA, Imperial, STC). Rates range from GH₵18 to GH₵30 (Tamale is GH₵25-30, arriving in 1-3 business days).
- Payment Methods: MTN Mobile Money (MoMo), Telecel Cash (Vodafone Cash), AT Money, Visa, and Mastercard (Paystack). MoMo prompt appears directly on phone to authorize with PIN.
- Official Support Phone: ${STORE_PHONE_DISPLAY}
- Official WhatsApp Support: ${STORE_WHATSAPP_LINK}
- Operating Hours: Monday to Saturday: 8:00 AM – 6:00 PM. (Online orders 24/7).
- Water Quality Guarantee: 100% genuine mineral water, FDA Ghana and Ghana Standards Authority (GSA) certified, factory-sealed tamper-evident caps, fresh batches.
- Health Recommendations: Verna (best for babies/infant formula due to balanced low sodium), Slem Fit (best for gym/fitness with alkaline pH & electrolytes).
- Dispenser Jars: 15L/19L refill exchange available with sanitized bottle swap.
- Theme Preference: Can switch dark/light mode via 'toggleThemePreference'.

OPERATIONAL & TOOL EXECUTION RULES:
1. TRUTHFUL DATA & TOOLS: NEVER invent prices or stock counts. ALWAYS call tools like 'searchProducts', 'getProduct', 'checkStock', 'calculatePrice', 'getBudgetRecommendations', 'getCustomerOrders', 'getOrderStatus' to fetch live store data.
2. PRICE CALCULATIONS: When a customer asks for the price of multiple packs (e.g. "what is the price of two packs of 500ml voltic?"), use 'calculatePrice' or calculate based on the exact pack price (e.g. 2 x GH₵45 = GH₵90).
3. BUDGET RECOMMENDATIONS: When a customer mentions a budget (e.g. "I have 50 cedis what can I buy?"), call 'getBudgetRecommendations' to suggest great options within their budget.
4. ADDING ITEMS TO CART: When a customer asks to buy or add water (e.g. "Add 2 packs of Voltic 500ml", "I want 3 Bel-Aqua"), ALWAYS execute 'addToCart'. If they say "add and checkout", pass 'andCheckout: true'.
5. CART & CHECKOUT: If the customer asks "What is in my cart?", call 'getCart'. When they want to pay or checkout, call 'guideToCheckout'.
6. DARK MODE: If the user asks to turn on dark mode or switch themes, call 'toggleThemePreference'.
7. HUMAN ESCALATION: If the customer wants to speak with the manager, owner, or human agent, call 'contactHumanSupport' and provide the official WhatsApp link and phone number.
8. TONE: Warm Ghanaian hospitality, professional, concise, helpful. Use Markdown with clean bullet points and bolding for readability.`;

  const contents: GeminiContent[] = [];

  // Filter out initial welcome bot greeting
  const cleanMessages = messages.filter((m, idx) => {
    if (idx === 0 && (m.role === "assistant" || m.role === "model")) return false;
    return true;
  });

  for (const msg of cleanMessages) {
    const role = msg.role === "assistant" || msg.role === "model" ? "model" : "user";
    contents.push({ role, parts: [{ text: msg.content || "" }] });
  }

  if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
    contents.push({ role: "user", parts: [{ text: "Hello!" }] });
  }

  const collectedClientActions: ClientAction[] = [];
  const collectedSuggestedProducts: StoreProduct[] = [];
  let finalReplyText = "";
  const MAX_TOOL_TURNS = 5;

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await callGeminiGenerateContent({
      model: GEMINI_MODEL_NAME,
      contents,
      systemInstruction,
      temperature: 0.2,
      tools: [{ functionDeclarations: CHATBOT_FUNCTION_DECLARATIONS }],
    });

    if (response.functionCalls.length === 0) {
      finalReplyText = response.text || "How can I assist you with your water orders today?";
      break;
    }

    contents.push({ role: "model", parts: response.candidateParts });

    const functionResponseParts: any[] = [];
    for (const call of response.functionCalls) {
      const toolResult = await executeChatbotTool(call.name, call.args || {}, {
        sessionUser,
        clientCartItems,
      });

      if (toolResult.clientAction) {
        collectedClientActions.push(toolResult.clientAction);
      }
      if (toolResult.suggestedProducts) {
        for (const p of toolResult.suggestedProducts) {
          if (!collectedSuggestedProducts.some((e) => e.id === p.id)) {
            collectedSuggestedProducts.push(p);
          }
        }
      }

      functionResponseParts.push({
        functionResponse: { name: call.name, response: toolResult.result },
      });
    }

    contents.push({ role: "user", parts: functionResponseParts });
  }

  if (!finalReplyText) {
    finalReplyText = "I have processed your request. Let me know if you need anything else!";
  }

  return {
    reply: finalReplyText,
    clientActions: collectedClientActions,
    suggestedProducts: collectedSuggestedProducts,
  };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], clientCartItems = [] } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    // 1. Resolve auth session
    const session = await auth();
    const sessionUser: ChatSessionUser = {
      id: session?.user?.id,
      name: session?.user?.name,
      email: session?.user?.email,
      phone: (session?.user as any)?.phone,
      role: (session?.user as any)?.role,
    };

    // 2. Always run local engine in parallel with Gemini (if configured)
    const localPromise = runLocalEngine(messages, clientCartItems, sessionUser);

    // 3. If Gemini is configured, race it against local engine with a 9s timeout
    if (isGeminiConfigured()) {
      const geminiWithTimeout = Promise.race<ChatAPIResponse | null>([
        runGeminiEngine(messages, clientCartItems, sessionUser),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 9000)),
      ]);

      try {
        const [geminiResult] = await Promise.allSettled([geminiWithTimeout]);

        if (
          geminiResult.status === "fulfilled" &&
          geminiResult.value !== null &&
          geminiResult.value.reply
        ) {
          if (process.env.NODE_ENV === "development") {
            console.log("[Chat] Using Gemini response");
          }
          return NextResponse.json(geminiResult.value);
        }
      } catch (err) {
        console.warn("[Chat] Gemini engine failed, falling back to local:", err);
      }
    }

    // 4. Fall back to local engine result
    const localResult = await localPromise;

    if (process.env.NODE_ENV === "development") {
      console.log("[Chat] Using local engine response (intent detected)");
    }

    return NextResponse.json(localResult);
  } catch (error: any) {
    console.error("[ChatAPI Error]:", error);

    return NextResponse.json(
      {
        reply:
          "I'm having a little trouble right now. You can reach us directly on WhatsApp at " +
          STORE_PHONE_DISPLAY +
          " for instant support!",
        clientActions: [],
        suggestedProducts: [],
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 200 }
    );
  }
}
