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

console.log("Loaded API Key preview:", apiKey ? `${apiKey.slice(0, 8)}...` : "NONE");

async function testGeminiDirect() {
  if (!apiKey) {
    console.error("No GEMINI_API_KEY found in .env.local");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: "Hello! What is Kay's Packs?" }]
      }
    ],
    systemInstruction: {
      parts: [{ text: "You are the AI shopping assistant for Kay's Packs in Ghana." }]
    },
    generationConfig: {
      temperature: 0.2
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Status:", res.status);
    if (!res.ok) {
      console.error("Error payload:", JSON.stringify(data, null, 2));
    } else {
      console.log("Success! Gemini response:\n", data.candidates?.[0]?.content?.parts?.[0]?.text);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testGeminiDirect();
