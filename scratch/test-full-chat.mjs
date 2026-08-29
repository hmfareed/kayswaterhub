import fs from "fs";
import path from "path";

// Read .env.local
const envPath = path.join(process.cwd(), ".env.local");
let apiKey = "";
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  const match = content.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) apiKey = match[1];
}

const CHAT_TOOLS = [
  {
    name: "searchProducts",
    description: "Search the store catalog for bottled water, packs, and prices in GHS.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search term e.g. Voltic" }
      }
    }
  },
  {
    name: "addToCart",
    description: "Add water packs to customer cart.",
    parameters: {
      type: "OBJECT",
      properties: {
        productIdentifier: { type: "STRING", description: "Product name or slug" },
        quantity: { type: "NUMBER", description: "Quantity of packs" }
      },
      required: ["productIdentifier"]
    }
  },
  {
    name: "getDeliveryInformation",
    description: "Get real delivery rates and timelines for Greater Accra and nationwide.",
    parameters: {
      type: "OBJECT",
      properties: {
        region: { type: "STRING", description: "Region name" }
      }
    }
  }
];

async function testToolCalling(userPrompt) {
  console.log(`\n========================================`);
  console.log(`Testing Prompt: "${userPrompt}"`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }]
      }
    ],
    systemInstruction: {
      parts: [
        {
          text: "You are the AI shopping assistant for Kay's Packs. You sell bottled mineral water in Ghana. Use tools to query prices and add items to cart."
        }
      ]
    },
    tools: [
      {
        functionDeclarations: CHAT_TOOLS
      }
    ],
    generationConfig: {
      temperature: 0.1
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];

  console.log("Status:", res.status);
  for (const part of parts) {
    if (part.functionCall) {
      console.log("👉 TOOL CALLED:", part.functionCall.name, "with args:", part.functionCall.args);
    }
    if (part.text) {
      console.log("💬 TEXT REPLY:", part.text.trim());
    }
  }
}

async function runAll() {
  await testToolCalling("Do you have Voltic water in stock?");
  await testToolCalling("Add 3 packs of Voltic 500ml to my cart");
  await testToolCalling("How much is delivery in Greater Accra?");
}

runAll();
