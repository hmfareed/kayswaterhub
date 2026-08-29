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
import { STORE_PHONE_DISPLAY, STORE_WHATSAPP_LINK, StoreProduct } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], clientCartItems = [] } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required." },
        { status: 400 }
      );
    }

    // 1. Resolve authentication session securely from cookies
    const session = await auth();
    const sessionUser: ChatSessionUser = {
      id: session?.user?.id,
      name: session?.user?.name,
      email: session?.user?.email,
      phone: (session?.user as any)?.phone,
      role: (session?.user as any)?.role,
    };

    const isAuth = !!sessionUser.id;
    const userName =
      sessionUser.name ||
      (sessionUser.email ? sessionUser.email.split("@")[0] : "Valued Customer");

    // 2. Check if Gemini is configured
    if (!isGeminiConfigured()) {
      const lastUserMsg =
        messages[messages.length - 1]?.content?.toLowerCase() || "";
      let fallback = `Hello ${userName}! Our AI Hydration Assistant is temporarily running in offline mode. We deliver bottled water packs (Voltic, Bel-Aqua, Verna, Awake, Perla) and dispensers across Greater Accra (GH₵15 flat, free over GH₵100) and nationwide. Please reach us on WhatsApp at ${STORE_PHONE_DISPLAY} for instant support!`;

      if (lastUserMsg.includes("delivery") || lastUserMsg.includes("fee") || lastUserMsg.includes("shipping")) {
        fallback =
          "We deliver across Greater Accra for a flat GH₵15 (Free delivery on orders of GH₵100 and above!). Orders placed before 2:00 PM are delivered same-day. Nationwide shipping is also available to all 16 regions via parcel stations.";
      } else if (lastUserMsg.includes("momo") || lastUserMsg.includes("pay") || lastUserMsg.includes("cash")) {
        fallback =
          "We accept MTN Mobile Money, Telecel Cash (Vodafone Cash), AT Money, and Visa/Mastercard payments securely processed via Paystack.";
      } else if (
        lastUserMsg.includes("voltic") ||
        lastUserMsg.includes("bel aqua") ||
        lastUserMsg.includes("bel-aqua") ||
        lastUserMsg.includes("verna") ||
        lastUserMsg.includes("awake") ||
        lastUserMsg.includes("perla") ||
        lastUserMsg.includes("water") ||
        lastUserMsg.includes("price")
      ) {
        fallback =
          "We stock all premier Ghanaian mineral water brands including Voltic Natural Mineral Water, Bel-Aqua, Verna, Awake Purified, Perla, and Slem Fit in 500ml, 750ml, 1.5L bottle packs and 15L/19L dispensers! You can browse the catalog and add items directly to your cart.";
      }

      return NextResponse.json({
        reply: fallback,
        clientActions: [],
        suggestedProducts: [],
      });
    }

    // 3. Construct System Instruction with strict domain grounding
    const systemInstruction = `You are "Kay's Packs AI Hydration Assistant", the expert, friendly, and smart AI shopping assistant for Kay's Packs (Ghana's premier online mineral water delivery & dispenser hub).

CRITICAL DOMAIN RULES:
- Kay's Packs is strictly a BOTTLED MINERAL WATER & DISPENSER DELIVERY STORE in Ghana.
- We sell multi-bottle packs (shrink-wrapped packs of 12, 15, 20, or 24 bottles), sachet water bags, and 15L/19L dispenser bottles.
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
- Same-Day Delivery Cutoff: 2:00 PM for Greater Accra orders.
- Nationwide Delivery: Available to all 16 regions of Ghana via regional bus/parcel stations.
- Payment Methods: MTN Mobile Money (MoMo), Telecel Cash (Vodafone Cash), AT Money, Visa, and Mastercard (Paystack).
- Official Support Phone: ${STORE_PHONE_DISPLAY}
- Official WhatsApp Support: ${STORE_WHATSAPP_LINK}

OPERATIONAL & TOOL EXECUTION RULES:
1. TRUTHFUL DATA & TOOLS: NEVER invent prices, stock counts, discounts, or order status. ALWAYS call tools like 'searchProducts', 'getProduct', 'checkStock', 'getCustomerOrders', 'getOrderStatus' to fetch live store data.
2. ADDING ITEMS TO CART: When a customer asks to buy or add water (e.g. "Add 2 packs of Voltic 500ml", "I want 3 Bel-Aqua"), ALWAYS execute 'addToCart' with the product name and quantity.
3. CART & CHECKOUT: If the customer asks "What is in my cart?", call 'getCart'. When they want to pay or checkout, call 'guideToCheckout'.
4. ORDER LOOKUPS: If logged in and asking "Where is my order?", call 'getCustomerOrders'. If given an order reference like "KP-2026-0001", call 'getOrderStatus'.
5. TONE: Warm Ghanaian hospitality, professional, concise, helpful. Use Markdown with clean bullet points and bolding for readability.`;

    // 4. Format conversation history for Gemini API
    const contents: GeminiContent[] = [];

    // Filter out initial welcome bot greeting so the history sent to Gemini begins with user intent
    const cleanMessages = messages.filter((m: any, idx: number) => {
      if (idx === 0 && (m.role === "assistant" || m.role === "model")) return false;
      return true;
    });

    for (let i = 0; i < cleanMessages.length; i++) {
      const msg = cleanMessages[i];
      const role =
        msg.role === "assistant" || msg.role === "model" ? "model" : "user";
      contents.push({
        role,
        parts: [{ text: msg.content || "" }],
      });
    }

    if (contents.length === 0 || contents[contents.length - 1].role !== "user") {
      contents.push({
        role: "user",
        parts: [{ text: "Hello!" }],
      });
    }

    const collectedClientActions: ClientAction[] = [];
    const collectedSuggestedProducts: StoreProduct[] = [];

    // 5. Multi-turn tool execution loop
    let finalReplyText = "";
    const MAX_TOOL_TURNS = 5;

    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const response = await callGeminiGenerateContent({
        model: GEMINI_MODEL_NAME,
        contents,
        systemInstruction,
        temperature: 0.2,
        tools: [
          {
            functionDeclarations: CHATBOT_FUNCTION_DECLARATIONS,
          },
        ],
      });

      // If no function calls returned, we have the final assistant response
      if (response.functionCalls.length === 0) {
        finalReplyText =
          response.text ||
          "How can I assist you with your water orders today?";
        break;
      }

      // Add model's function call response to history
      contents.push({
        role: "model",
        parts: response.candidateParts,
      });

      // Execute each tool call
      const functionResponseParts: any[] = [];
      for (const call of response.functionCalls) {
        const toolResult = await executeChatbotTool(
          call.name,
          call.args || {},
          {
            sessionUser,
            clientCartItems,
          }
        );

        if (toolResult.clientAction) {
          collectedClientActions.push(toolResult.clientAction);
        }

        if (
          toolResult.suggestedProducts &&
          toolResult.suggestedProducts.length > 0
        ) {
          for (const p of toolResult.suggestedProducts) {
            if (
              !collectedSuggestedProducts.some(
                (existing) => existing.id === p.id
              )
            ) {
              collectedSuggestedProducts.push(p);
            }
          }
        }

        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: toolResult.result,
          },
        });
      }

      // Add tool responses back to history for next model turn
      contents.push({
        role: "user", // or functionResponse part
        parts: functionResponseParts,
      });
    }

    if (!finalReplyText) {
      finalReplyText =
        "I have processed your request. Let me know if you need anything else!";
    }

    return NextResponse.json({
      reply: finalReplyText,
      clientActions: collectedClientActions,
      suggestedProducts: collectedSuggestedProducts,
    });
  } catch (error: any) {
    console.error("[ChatAPI Error]:", error);
    return NextResponse.json(
      {
        reply:
          "I'm having a little trouble connecting right now, but you can call or WhatsApp us directly at " +
          STORE_PHONE_DISPLAY +
          " for instant support!",
        clientActions: [],
        suggestedProducts: [],
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 200 }
    );
  }
}
