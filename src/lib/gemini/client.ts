export const GEMINI_MODEL_NAME = "gemini-2.5-flash";

export interface GeminiContentPart {
  text?: string;
  thoughtSignature?: string;
  functionCall?: {
    name: string;
    args: Record<string, any>;
    id?: string;
  };
  functionResponse?: {
    name: string;
    response: Record<string, any>;
    id?: string;
  };
}

export interface GeminiContent {
  role: "user" | "model" | "function";
  parts: GeminiContentPart[];
}

export interface GeminiGenerateOptions {
  contents: GeminiContent[];
  systemInstruction?: string;
  tools?: any[];
  temperature?: number;
  model?: string;
}

export interface GeminiGenerateResult {
  text: string;
  functionCalls: Array<{ name: string; args: Record<string, any> }>;
  candidateParts: GeminiContentPart[];
}

/**
 * Checks if the Gemini API key is configured
 */
export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return !!apiKey && apiKey !== "your_gemini_api_key_here" && apiKey !== "YOUR_KEY_HERE";
}

/**
 * Calls the official Google Gemini API (v1beta) using standard HTTPS fetch.
 * Fully compatible with Gemini 2.5 Flash, 2.0 Flash, and 1.5 Flash with tool calling.
 */
export async function callGeminiGenerateContent(
  options: GeminiGenerateOptions
): Promise<GeminiGenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !isGeminiConfigured()) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const model = options.model || GEMINI_MODEL_NAME;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload: Record<string, any> = {
    contents: options.contents,
    generationConfig: {
      temperature: options.temperature ?? 0.2,
    },
  };

  if (options.systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options.tools && options.tools.length > 0) {
    payload.tools = options.tools;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Gemini API Error ${response.status}]`, errorText);
    throw new Error(`Gemini API call failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const parts: GeminiContentPart[] = candidate?.content?.parts || [];

  const textParts = parts.filter((p) => p.text).map((p) => p.text).join("\n").trim();
  const functionCalls: Array<{ name: string; args: Record<string, any> }> = [];

  for (const part of parts) {
    if (part.functionCall) {
      functionCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args || {},
      });
    }
  }

  return {
    text: textParts,
    functionCalls,
    candidateParts: parts,
  };
}
