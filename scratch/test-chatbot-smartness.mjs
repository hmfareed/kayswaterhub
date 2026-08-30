import { detectIntent, extractEntities } from "../src/lib/chat/intent-engine.ts";
import * as RB from "../src/lib/chat/response-builder.ts";
import { STORE_PRODUCTS } from "../src/lib/constants/index.ts";

const TEST_QUERIES = [
  "how are you",
  "I want a pack of water",
  "do you have Voltic?",
  "do you have bell-aqua/belaqua?",
  "can i pay with momo",
  "what is the delivery fee?",
  "what is the price of two packs of 500ml voltic?",
  "can you add voltic 500ml to my cart and checkout",
  "can you help me turn on dark mode",
  "i need to speak to the manager/agent/owner",
  "I have a budget of 50 cedis what can i purchase",
  "how do i create an account",
  "why should i buy from you",
  "is there water clean/fresh?",
  "do you deliver to Tamale?",
  "how is the delivery fee configured",
  "I need water, i'm thirsty",
  "can you give me the best selling products?",
  "Good morning",
  "Good afternoon",
  "Good evening",
  "Thank you",
  "can you help me?",
  "I need assistance",
  "check the store",
  "Which water is best for babies and infant formula?",
  "Do you do 15L dispenser water refills?",
  "Do you have bulk wholesale discounts for weddings?",
];

console.log(`\n===============================================================`);
console.log(`🤖 TESTING CHATBOT NATURAL LANGUAGE INTENTS & RESPONSES (${TEST_QUERIES.length} tests)`);
console.log(`===============================================================\n`);

let passed = 0;

for (let i = 0; i < TEST_QUERIES.length; i++) {
  const q = TEST_QUERIES[i];
  const { intent, confidence, entities } = detectIntent(q);

  console.log(`\n-----------------------------------------------------------`);
  console.log(`[#${i + 1}] USER QUERY: "${q}"`);
  console.log(`👉 DETECTED INTENT: ${intent} (Confidence: ${(confidence * 100).toFixed(1)}%)`);
  if (entities.brand) console.log(`   🏷️ Brand: ${entities.brand}`);
  if (entities.size) console.log(`   📏 Size: ${entities.size}`);
  if (entities.quantity) console.log(`   🔢 Quantity: ${entities.quantity}`);
  if (entities.budget) console.log(`   💰 Budget: GH₵${entities.budget}`);
  if (entities.city || entities.region) console.log(`   📍 Location: ${entities.city || entities.region}`);

  // Test response generation
  let responseText = "";
  if (intent === "PRICE_CALCULATION") {
    const matched = entities.matchedProduct || STORE_PRODUCTS[0];
    const qty = entities.quantity || 2;
    const res = RB.buildPriceCalculationResponse(matched, qty);
    responseText = res.reply;
  } else if (intent === "BUDGET_RECOMMENDATION") {
    const budget = entities.budget || 50;
    const affordable = STORE_PRODUCTS.filter((p) => p.price <= budget && p.inStock);
    const res = RB.buildBudgetRecommendationResponse(budget, affordable);
    responseText = res.reply;
  } else if (intent === "THIRSTY") {
    const res = RB.buildThirstyResponse(STORE_PRODUCTS.filter((p) => p.inStock));
    responseText = res.reply;
  } else if (intent === "STORE_CATALOG_OVERVIEW") {
    const res = RB.buildStoreCatalogOverviewResponse(STORE_PRODUCTS.filter((p) => p.inStock));
    responseText = res.reply;
  } else if (intent === "WATER_RECOMMENDATION_BABY_GYM") {
    const res = RB.buildWaterHealthResponse(STORE_PRODUCTS.filter((p) => p.inStock));
    responseText = res.reply;
  } else if (intent === "DELIVERY_INFO") {
    const res = RB.buildDeliveryInfoResponse({
      queriedRegion: entities.region || "Greater Accra",
      queriedCity: entities.city,
      deliveryFeeForQueriedRegionInGHS: entities.city === "Tamale" || entities.region === "Northern" ? 25 : 15,
    });
    responseText = res.reply;
  } else if (intent === "PAYMENT_INFO") {
    const res = RB.buildPaymentInfoResponse({});
    responseText = res.reply;
  } else if (intent === "BEST_SELLERS") {
    const res = RB.buildBestSellersResponse({}, STORE_PRODUCTS);
    responseText = res.reply;
  } else {
    const res = RB.buildDirectResponse(intent, "Mohammed", { targetTheme: entities.targetTheme });
    responseText = res ? res.reply : `[Routed to Tool for ${intent}]`;
  }

  if (intent !== "UNKNOWN") {
    passed++;
    console.log(`✅ TEST PASSED`);
    console.log(`💬 PREVIEW:\n${responseText.split("\n").slice(0, 4).join("\n")}...`);
  } else {
    console.log(`❌ TEST FAILED (Intent was UNKNOWN)`);
  }
}

console.log(`\n===============================================================`);
console.log(`📊 FINAL RESULTS: ${passed}/${TEST_QUERIES.length} tests passed successfully!`);
console.log(`===============================================================\n`);
