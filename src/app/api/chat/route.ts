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
      let fallback = `Hello ${userName}! Our smart assistant is active. How can we help with your water delivery today? (Contact us anytime on WhatsApp: ${STORE_PHONE_DISPLAY})`;

      if (lastUserMsg.includes("delivery") || lastUserMsg.includes("fee")) {
        fallback =
          "We deliver across Greater Accra for GH₵15 (free on orders over GH₵100!). Orders placed before 2:00 PM are delivered same-day. Nationwide shipping is also available.";
      } else if (lastUserMsg.includes("momo") || lastUserMsg.includes("pay")) {
        fallback =
          "We accept MTN Mobile Money, Telecel Cash, AT Money, and Visa/Mastercard payments via Paystack.";
      } else if (
        lastUserMsg.includes("voltic") ||
        lastUserMsg.includes("bel aqua") ||
        lastUserMsg.includes("verna") ||
        lastUserMsg.includes("water")
      ) {
        fallback =
          "We stock all major mineral water brands including Voltic, Bel-Aqua, Verna, Awake, Perla, and Slem Fit in 500ml, 750ml, 1.5L packs and dispenser bottles! Visit our Shop page to view all packs.";
      }

      return NextResponse.json({
        reply: fallback,
        clientActions: [],
        suggestedProducts: [],
      });
    }

    // 3. Construct System Instruction
    const systemInstruction = `You are "Kay's Packs AI Hydration Assistant", the smart, helpful, and friendly Ghanaian e-commerce shopping assistant for Kay's Packs (Ghana's premier online water delivery hub).

CUSTOMER PROFILE:
- Name: ${userName}
- Logged in: ${isAuth ? "Yes (Authenticated Account)" : "No (Guest Visitor)"}
- User ID: ${sessionUser.id || "None"}
- Email: ${sessionUser.email || "None"}

STORE FACTS:
- Top mineral water brands: Voltic, Bel-Aqua, Verna, Awake, Perla, Slem Fit, and heavy-duty 15L/19L dispensers.
- Currency: Ghanaian Cedis (GH₵).
- Standard Greater Accra delivery: GH₵15 (Free for orders GH₵100 and above).
- Same-Day Delivery cutoff: 2:00 PM in Greater Accra.
- Nationwide Delivery: Covers all 16 regions in Ghana via regional parcel stations.
- Accepted Payments: MTN MoMo, Telecel Cash, AT Money, Visa, Mastercard (Paystack).
- Official Support Phone: ${STORE_PHONE_DISPLAY}
- WhatsApp: ${STORE_WHATSAPP_LINK}

CRITICAL OPERATIONAL RULES:
1. TRUTHFULNESS & LIVE DATABASE: NEVER invent prices, stock numbers, discounts, or fake order numbers. You MUST call tools like 'searchProducts', 'getProduct', 'checkStock', 'getCustomerOrders', 'getOrderStatus', etc. to get actual store data.
2. GUEST vs AUTHENTICATED: Guests can search, view catalog, check stock, and ask questions. If a guest asks "Where is my order?", politely ask for their order reference number or encourage them to log in.
3. CART ACTIONS: When a customer asks to add water to their cart (e.g. "Add 2 packs of Voltic 500ml"), ALWAYS call 'addToCart' with the product and quantity.
4. CHECKOUT: When customer says "I want to checkout" or "Let's pay", call 'guideToCheckout'.
5. TONE & STYLE: Warm Ghanaian hospitality, professional, concise, and structured with clean markdown bullet points.`;

    // 4. Format conversation history for Gemini API
    const contents: GeminiContent[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
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
