import { detectIntent } from "../src/lib/chat/intent-engine.ts";
import * as RB from "../src/lib/chat/response-builder.ts";
import { executeChatbotTool } from "../src/services/chat/chat-tools.service.ts";
import { STORE_PRODUCTS } from "../src/lib/constants/index.ts";

async function testChatFlow(query, history = []) {
  const { intent, confidence, entities } = detectIntent(query, history);
  console.log(`\n💬 Prompt: "${query}"`);
  console.log(`🧠 Intent: ${intent} | Entities:`, JSON.stringify(entities));

  let reply = "";
  let clientActions = [];
  let suggestedProducts = [];

  const direct = RB.buildDirectResponse(intent, "Mohammed", { targetTheme: entities.targetTheme });
  if (direct) {
    reply = direct.reply;
    if (intent === "TOGGLE_DARK_MODE") {
      clientActions.push({ type: "SET_THEME", payload: { theme: entities.targetTheme || "toggle" } });
    }
  } else if (intent === "PRICE_CALCULATION") {
    const matched = entities.matchedProduct || STORE_PRODUCTS[0];
    const qty = entities.quantity || 1;
    const res = RB.buildPriceCalculationResponse(matched, qty);
    reply = res.reply;
    suggestedProducts = res.suggestedProducts || [matched];
  } else if (intent === "BUDGET_RECOMMENDATION") {
    const budget = entities.budget || 50;
    const affordable = STORE_PRODUCTS.filter((p) => p.price <= budget && p.inStock);
    const res = RB.buildBudgetRecommendationResponse(budget, affordable);
    reply = res.reply;
    suggestedProducts = res.suggestedProducts || [];
  } else if (intent === "THIRSTY") {
    const res = RB.buildThirstyResponse(STORE_PRODUCTS.filter((p) => p.inStock));
    reply = res.reply;
    suggestedProducts = res.suggestedProducts || [];
  } else if (intent === "ADD_AND_CHECKOUT") {
    const res = await executeChatbotTool(
      "addToCart",
      { productIdentifier: entities.matchedProduct?.name || "Voltic 500ml", quantity: entities.quantity || 1, andCheckout: true },
      { clientCartItems: [] }
    );
    if (res.clientAction) clientActions.push(res.clientAction);
    reply = RB.buildAddAndCheckoutResponse(res.result, res.suggestedProducts || []).reply;
    suggestedProducts = res.suggestedProducts || [];
  } else if (intent === "DELIVERY_INFO") {
    const res = await executeChatbotTool(
      "getDeliveryInformation",
      { region: entities.region || "Greater Accra", city: entities.city },
      {}
    );
    reply = RB.buildDeliveryInfoResponse(res.result).reply;
  } else if (intent === "CHECK_STOCK") {
    const res = await executeChatbotTool(
      "checkStock",
      { productIdentifier: entities.matchedProduct?.name || entities.brand || "Voltic", requestedQuantity: 1 },
      {}
    );
    reply = RB.buildCheckStockResponse(res.result, res.suggestedProducts || []).reply;
    suggestedProducts = res.suggestedProducts || [];
  } else {
    reply = `Default fallback for ${intent}`;
  }

  console.log(`🤖 Bot Reply:\n${reply.split("\n").slice(0, 3).join("\n")}...\n`);
  if (clientActions.length > 0) {
    console.log(`⚡ Client Actions Emitted:`, clientActions);
  }
}

async function runAll() {
  await testChatFlow("what is the price of two packs of 500ml voltic?");
  await testChatFlow("I have a budget of 50 cedis what can i purchase");
  await testChatFlow("can you add voltic 500ml to my cart and checkout");
  await testChatFlow("can you help me turn on dark mode");
  await testChatFlow("do you deliver to Tamale?");
  await testChatFlow("do you have bell-aqua/belaqua?");
  await testChatFlow("how are you");
}

runAll();
