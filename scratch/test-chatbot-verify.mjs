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

const apiKey = process.env.GEMINI_API_KEY;

const CHATBOT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "searchProducts",
        description: "Search the Kay's Packs store catalog for bottled water, dispenser bottles, sachets, or brand names.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: { type: "STRING", description: "Search keyword" }
          }
        }
      },
      {
        name: "addToCart",
        description: "Add a specified product pack and quantity to the customer's shopping cart.",
        parameters: {
          type: "OBJECT",
          properties: {
            productIdentifier: { type: "STRING", description: "Product name or slug" },
            quantity: { type: "NUMBER", description: "Quantity" }
          },
          required: ["productIdentifier"]
        }
      },
      {
        name: "getDeliveryInformation",
        description: "Get real delivery rates, timelines, same-day delivery cutoff times for Kay's Packs.",
        parameters: {
          type: "OBJECT",
          properties: {
            region: { type: "STRING", description: "Ghanaian region" }
          }
        }
      }
    ]
  }
];

const systemInstruction = `You are "Kay's Packs AI Hydration Assistant", the expert, friendly, and smart AI shopping assistant for Kay's Packs (Ghana's premier online mineral water delivery & dispenser hub).

CRITICAL DOMAIN RULES:
- Kay's Packs is strictly a BOTTLED MINERAL WATER & DISPENSER DELIVERY STORE in Ghana.
- We sell multi-bottle packs (shrink-wrapped packs of 12, 15, 20, or 24 bottles), sachet water bags, and 15L/19L dispenser bottles.
- WE DO NOT SELL HIKING BACKPACKS, RUCKSACKS, HYDRATION BAGS, OR CAMPING GEAR. The name "Kay's Packs" refers to packs of water bottles. If a user asks about backpacks, kindly clarify that we are Ghana's mineral water delivery hub.
- Top Ghanaian mineral water brands we stock: Voltic Natural Mineral Water, Bel-Aqua, Verna Natural Mineral Water, Awake Purified Water, Perla, Slem Fit, and Special Ice.

STORE FACTS & POLICIES:
- Currency: Ghanaian Cedis (GH₵ / GHS).
- Greater Accra Delivery: Flat rate GH₵15. FREE delivery on all orders of GH₵100 and above.
- Same-Day Delivery Cutoff: 2:00 PM for Greater Accra orders.
- Nationwide Delivery: Available to all 16 regions of Ghana via regional bus/parcel stations.
- Payment Methods: MTN Mobile Money (MoMo), Telecel Cash (Vodafone Cash), AT Money, Visa, and Mastercard (Paystack).`;

async function testPrompt(userQuery) {
  console.log(`\n======================================================`);
  console.log(`🔍 USER PROMPT: "${userQuery}"`);

  const contents = [
    { role: "user", parts: [{ text: userQuery }] }
  ];

  const payload = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    tools: CHATBOT_TOOLS,
    generationConfig: { temperature: 0.1 }
  };

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  for (const part of parts) {
    if (part.functionCall) {
      console.log(`⚡ TOOL CALLED: [${part.functionCall.name}] with args:`, part.functionCall.args);
    }
    if (part.text) {
      console.log(`💬 RESPONSE:\n${part.text}`);
    }
  }
}

async function runAll() {
  await testPrompt("Do you have Voltic 500ml in stock and how much is it?");
  await testPrompt("What backpacks or hiking bags do you have for sale?");
  await testPrompt("How much is delivery in Greater Accra?");
  await testPrompt("Can I pay with Mobile Money or card?");
  await testPrompt("Add 3 packs of Bel-Aqua 750ml to my cart");
}

runAll().catch(console.error);
