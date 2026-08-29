import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

async function runTest() {
  const { isGeminiConfigured, callGeminiGenerateContent, GEMINI_MODEL_NAME } = await import("../src/lib/gemini/client.ts");
  const { CHATBOT_FUNCTION_DECLARATIONS } = await import("../src/lib/gemini/tools-definition.ts");
  const { executeChatbotTool } = await import("../src/services/chat/chat-tools.service.ts");
  const { STORE_PHONE_DISPLAY, STORE_WHATSAPP_LINK } = await import("../src/lib/constants.ts");

  console.log("Is Gemini Configured:", isGeminiConfigured());
  console.log("Model:", GEMINI_MODEL_NAME);

  const testPrompts = [
    "Do you have Voltic 500ml?",
    "How much is delivery in Greater Accra?",
    "Can I pay with Mobile Money?",
    "Add 2 packs of Bel-Aqua 750ml to my cart",
    "Where is order KP-2026-0001?"
  ];

  for (const prompt of testPrompts) {
    console.log(`\n======================================================`);
    console.log(`Testing User Query: "${prompt}"`);

    const messages = [{ role: "user", content: prompt }];
    const systemInstruction = `You are "Kay's Packs AI Hydration Assistant", the smart, helpful, and friendly Ghanaian e-commerce shopping assistant for Kay's Packs (Ghana's premier online water delivery hub).
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
1. TRUTHFULNESS & LIVE DATABASE: NEVER invent prices, stock numbers, discounts, or fake order numbers. You MUST call tools like 'searchProducts', 'getProduct', 'checkStock', 'getCustomerOrders', 'getOrderStatus', etc. to get actual store data.`;

    const contents = messages.map(m => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    let finalReply = "";
    const collectedActions = [];
    const collectedProducts = [];

    for (let turn = 0; turn < 5; turn++) {
      const response = await callGeminiGenerateContent({
        model: GEMINI_MODEL_NAME,
        contents,
        systemInstruction,
        temperature: 0.2,
        tools: [{ functionDeclarations: CHATBOT_FUNCTION_DECLARATIONS }]
      });

      if (response.functionCalls.length === 0) {
        finalReply = response.text;
        break;
      }

      console.log(`Turn ${turn + 1} Tools Called:`, response.functionCalls.map(c => `${c.name}(${JSON.stringify(c.args)})`).join(", "));

      contents.push({
        role: "model",
        parts: response.candidateParts
      });

      const functionResponseParts = [];
      for (const call of response.functionCalls) {
        const toolResult = await executeChatbotTool(
          call.name,
          call.args || {},
          {
            sessionUser: { id: "test-user-id", name: "Mohammed", email: "user@test.com" },
            clientCartItems: []
          }
        );

        if (toolResult.clientAction) collectedActions.push(toolResult.clientAction);
        if (toolResult.suggestedProducts) collectedProducts.push(...toolResult.suggestedProducts);

        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: toolResult.result
          }
        });
      }

      contents.push({
        role: "user",
        parts: functionResponseParts
      });
    }

    console.log(`\nFinal Bot Reply:\n${finalReply}`);
    if (collectedActions.length > 0) {
      console.log("Actions Triggered:", JSON.stringify(collectedActions, null, 2));
    }
    if (collectedProducts.length > 0) {
      console.log("Suggested Products:", collectedProducts.map(p => p.name));
    }
  }
}

runTest().catch(console.error);
