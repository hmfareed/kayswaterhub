/**
 * Kay's Packs — Local NLP Intent Engine
 * ────────────────────────────────────────
 * Fully self-contained: no external API required.
 * Uses weighted keyword/regex scoring + entity extraction to understand
 * what the customer wants, then resolves it against the live product catalog.
 */

import { STORE_PRODUCTS, StoreProduct } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatIntent =
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "UPDATE_CART_QTY"
  | "VIEW_CART"
  | "CLEAR_CART"
  | "CHECKOUT"
  | "CHECK_STOCK"
  | "SEARCH_PRODUCTS"
  | "GET_PRODUCT_DETAIL"
  | "TRACK_ORDER"
  | "MY_ORDERS"
  | "DELIVERY_INFO"
  | "PAYMENT_INFO"
  | "STORE_INFO"
  | "BEST_SELLERS"
  | "GREETING"
  | "THANKS"
  | "UNKNOWN";

export interface ExtractedEntities {
  brand?: string;
  brandSlug?: string;
  size?: string;
  quantity?: number;
  productIdentifier?: string;
  productId?: string;
  matchedProduct?: StoreProduct;
  orderNumber?: string;
  region?: string;
  newQuantity?: number; // for UPDATE_CART_QTY ("change it to 3")
}

export interface IntentResult {
  intent: ChatIntent;
  confidence: number; // 0-1
  entities: ExtractedEntities;
  rawText: string;
}

// ─── Dictionaries ─────────────────────────────────────────────────────────────

const BRAND_PATTERNS: Array<{ pattern: RegExp; brand: string; slug: string }> = [
  { pattern: /\bvoltic\b/i, brand: "Voltic", slug: "voltic" },
  { pattern: /\bbel[- ]?aqua\b/i, brand: "Bel-Aqua", slug: "bel-aqua" },
  { pattern: /\bverna\b/i, brand: "Verna", slug: "verna" },
  { pattern: /\bawake\b/i, brand: "Awake", slug: "awake" },
  { pattern: /\bslem[- ]?fit\b/i, brand: "Slem Fit", slug: "slem-fit" },
  { pattern: /\bperla\b/i, brand: "Perla", slug: "perla" },
  { pattern: /\bspecial[- ]?ice\b/i, brand: "Special Ice", slug: "special-ice" },
];

const SIZE_PATTERNS: Array<{ pattern: RegExp; size: string }> = [
  { pattern: /\b350\s*ml\b/i, size: "350ml" },
  { pattern: /\b500\s*ml\b/i, size: "500ml" },
  { pattern: /\b750\s*ml\b/i, size: "750ml" },
  { pattern: /\b1\.?5\s*l(?:itre|iter|s)?\b/i, size: "1.5L" },
  { pattern: /\b15\s*l(?:itre|iter|s)?\b/i, size: "15L" },
  { pattern: /\b19\s*l(?:itre|iter|s)?\b/i, size: "19L" },
  { pattern: /\bpocket\b/i, size: "350ml" },
  { pattern: /\bdispenser\b/i, size: "15L" },
  { pattern: /\bjar\b/i, size: "15L" },
];

const REGION_PATTERNS: Array<{ pattern: RegExp; region: string }> = [
  { pattern: /greater\s+accra|accra\b|gra\b/i, region: "Greater Accra" },
  { pattern: /\bashanti\b|\bkumasi\b/i, region: "Ashanti" },
  { pattern: /\bwestern\b/i, region: "Western" },
  { pattern: /\bcentral\b/i, region: "Central" },
  { pattern: /\beastern\b/i, region: "Eastern" },
  { pattern: /\bvolta\b/i, region: "Volta" },
  { pattern: /\bnorthern\b/i, region: "Northern" },
  { pattern: /upper\s+east\b/i, region: "Upper East" },
  { pattern: /upper\s+west\b/i, region: "Upper West" },
  { pattern: /bono\s+east\b/i, region: "Bono East" },
  { pattern: /\bahafo\b/i, region: "Ahafo" },
];

// ─── Intent Scoring ───────────────────────────────────────────────────────────

type ScoreMap = Record<ChatIntent, number>;

function buildZeroScores(): ScoreMap {
  return {
    ADD_TO_CART: 0, REMOVE_FROM_CART: 0, UPDATE_CART_QTY: 0,
    VIEW_CART: 0, CLEAR_CART: 0, CHECKOUT: 0, CHECK_STOCK: 0,
    SEARCH_PRODUCTS: 0, GET_PRODUCT_DETAIL: 0, TRACK_ORDER: 0,
    MY_ORDERS: 0, DELIVERY_INFO: 0, PAYMENT_INFO: 0, STORE_INFO: 0,
    BEST_SELLERS: 0, GREETING: 0, THANKS: 0, UNKNOWN: 0,
  };
}

function scoreIntents(text: string): Array<{ intent: ChatIntent; score: number }> {
  const t = text.toLowerCase().trim();
  const s = buildZeroScores();
  const hasBrand = BRAND_PATTERNS.some((b) => b.pattern.test(t));
  const hasNumber = /\b\d+\b/.test(t);

  // ── ADD_TO_CART ──────────────────────────────────────────────────────────────
  if (/\b(add|put|place|drop|throw)\b.{0,30}\b(cart|bag|order)\b/i.test(t)) s.ADD_TO_CART += 12;
  if (/\b(i want|give me|get me|send me)\s+\d+/i.test(t)) s.ADD_TO_CART += 10;
  if (/\b(buy|order|purchase)\s+\d+/i.test(t)) s.ADD_TO_CART += 10;
  if (/\b\d+\s*(packs?|pieces?|bottles?|units?)\b.{0,30}(of\s+)?\b(voltic|bel.?aqua|verna|awake|slem)/i.test(t)) s.ADD_TO_CART += 12;
  if (/\b(add|buy|order|get)\s+\d+\b/i.test(t)) s.ADD_TO_CART += 8;
  if (hasBrand && hasNumber && /\b(cart|want|buy|order|get|add)\b/i.test(t)) s.ADD_TO_CART += 6;
  if (/\bplease\s+(add|send|bring|get)\b/i.test(t) && hasBrand) s.ADD_TO_CART += 5;
  // "I want Voltic" without a number is ambiguous — treat as stock check not add-to-cart
  if (/\bi want\b/i.test(t) && !hasNumber) s.ADD_TO_CART += 2;

  // ── REMOVE_FROM_CART ─────────────────────────────────────────────────────────
  if (/\b(remove|delete|take out|drop|ditch)\b.{0,30}\b(cart|bag)\b/i.test(t)) s.REMOVE_FROM_CART += 12;
  if (/\b(remove|delete|take out|cancel)\b.{0,25}(voltic|bel.?aqua|verna|awake|slem|perla)/i.test(t)) s.REMOVE_FROM_CART += 12;
  if (/\bi\s+don.?t\s+want.{0,30}(anymore|no\s+longer)/i.test(t)) s.REMOVE_FROM_CART += 10;
  if (/\btake\s+(off|it\s+off|that\s+off)\b/i.test(t) && hasBrand) s.REMOVE_FROM_CART += 8;

  // ── UPDATE_CART_QTY ──────────────────────────────────────────────────────────
  if (/\b(change|update|modify|set|make\s+it)\b.{0,30}\bto\b.{0,10}\d+/i.test(t)) s.UPDATE_CART_QTY += 12;
  if (/\b(increase|decrease|reduce)\b.{0,20}\b(quantity|qty|amount|number)\b/i.test(t)) s.UPDATE_CART_QTY += 10;
  if (/\b(quantity|qty)\b.{0,15}\d+/i.test(t)) s.UPDATE_CART_QTY += 8;

  // ── VIEW_CART ─────────────────────────────────────────────────────────────────
  if (/\b(what.?s\s+in|show|view|see|check|display)\b.{0,20}\b(my\s+)?cart\b/i.test(t)) s.VIEW_CART += 14;
  if (/\bmy\s+cart\b/i.test(t) && !/\b(add|remove|clear|empty|checkout|pay)\b/i.test(t)) s.VIEW_CART += 10;
  if (/\b(cart\s+summary|cart\s+total|what\s+did\s+i\s+add)\b/i.test(t)) s.VIEW_CART += 12;

  // ── CLEAR_CART ────────────────────────────────────────────────────────────────
  if (/\b(clear|empty|reset|wipe|clean)\b.{0,20}\b(cart|bag|everything|all)\b/i.test(t)) s.CLEAR_CART += 14;
  if (/\bremove\s+everything\b/i.test(t)) s.CLEAR_CART += 12;
  if (/\bstart\s+over\b|\bstart\s+fresh\b/i.test(t)) s.CLEAR_CART += 8;

  // ── CHECKOUT ─────────────────────────────────────────────────────────────────
  if (/\b(checkout|check\s*out|proceed\s+to\s+(pay|checkout)|place\s+order|confirm\s+order|complete\s+order)\b/i.test(t)) s.CHECKOUT += 14;
  if (/\b(ready\s+to\s+pay|go\s+to\s+payment|finalize|make\s+payment)\b/i.test(t)) s.CHECKOUT += 12;
  if (/\bi.?m\s+ready\b/i.test(t)) s.CHECKOUT += 6;
  // standalone "pay" but NOT "pay with momo" / "how to pay"
  if (/\bpay\b/i.test(t) && !/\b(pay\s+with|how\s+to\s+pay|payment\s+method|accept|momo|visa|card|cash|options?)\b/i.test(t)) s.CHECKOUT += 6;

  // ── CHECK_STOCK ───────────────────────────────────────────────────────────────
  if (/\b(in\s+stock|available|have\s+in\s+stock|do\s+you\s+have|is\s+there|any\s+left|still\s+have)\b/i.test(t)) s.CHECK_STOCK += 12;
  if (/\b(stock|availability|units\s+left|remaining|how\s+many)\b/i.test(t)) s.CHECK_STOCK += 8;
  if (/\bcan\s+i\s+(get|buy)\b/i.test(t)) s.CHECK_STOCK += 5;
  if (hasBrand && !hasNumber && /\b(i\s+want|need|looking\s+for)\b/i.test(t)) s.CHECK_STOCK += 5;

  // ── SEARCH_PRODUCTS ───────────────────────────────────────────────────────────
  if (/\b(what\s+water|which\s+water|what\s+brands?|what\s+products?|what\s+do\s+you\s+(have|sell|offer|carry))\b/i.test(t)) s.SEARCH_PRODUCTS += 12;
  if (/\b(show\s+me|list|browse|see\s+all|view\s+all|catalogue|catalog)\b.{0,20}\b(products?|water|brands?|items?)\b/i.test(t)) s.SEARCH_PRODUCTS += 10;
  if (/\b(cheapest|affordable|budget|price\s+list|all\s+products?|everything\s+you\s+have)\b/i.test(t)) s.SEARCH_PRODUCTS += 8;
  if (/\bwhat\s+do\s+you\s+sell\b/i.test(t)) s.SEARCH_PRODUCTS += 14;

  // ── GET_PRODUCT_DETAIL ────────────────────────────────────────────────────────
  if (/\b(tell\s+me\s+about|info\s+(about|on)|information\s+about|details?\s+(about|on)|describe)\b.{0,30}(voltic|bel.?aqua|verna|awake|slem|perla)/i.test(t)) s.GET_PRODUCT_DETAIL += 14;
  if (/\bwhat\s+is\b.{0,20}(voltic|bel.?aqua|verna|awake|slem|perla)/i.test(t)) s.GET_PRODUCT_DETAIL += 12;
  if (/\bmore\s+about\b/i.test(t)) s.GET_PRODUCT_DETAIL += 8;
  if (/\bthis\s+product\b|\babout\s+it\b/i.test(t)) s.GET_PRODUCT_DETAIL += 5;

  // ── TRACK_ORDER ───────────────────────────────────────────────────────────────
  if (/\b(track|tracking|where\s+is|where.?s\s+my|status\s+of|what\s+happened\s+to)\b.{0,30}\border\b/i.test(t)) s.TRACK_ORDER += 14;
  if (/\b(KP|ORD)-?\d{4}/i.test(t)) s.TRACK_ORDER += 18; // order number found
  if (/\border\s+(number|#|no\.?|ref(erence)?)\b/i.test(t)) s.TRACK_ORDER += 10;
  if (/\bwhen\b.{0,20}\b(arrive|deliver|come|get\s+here)\b/i.test(t)) s.TRACK_ORDER += 6;

  // ── MY_ORDERS ─────────────────────────────────────────────────────────────────
  if (/\b(my\s+orders?|order\s+history|past\s+orders?|previous\s+orders?|recent\s+orders?|all\s+my\s+orders?)\b/i.test(t)) s.MY_ORDERS += 14;
  if (/\borders?\s+(i.?ve\s+(made|placed)|list)\b/i.test(t)) s.MY_ORDERS += 12;
  if (/\bhow\s+many\s+orders?\b/i.test(t)) s.MY_ORDERS += 10;

  // ── DELIVERY_INFO ─────────────────────────────────────────────────────────────
  if (/\b(delivery\s+fee|delivery\s+cost|shipping\s+(fee|cost|charge))\b/i.test(t)) s.DELIVERY_INFO += 14;
  if (/\bhow\s+much.{0,15}(deliver|ship|bring)\b/i.test(t)) s.DELIVERY_INFO += 12;
  if (/\b(same.?day|express|next.?day)\b.{0,30}\b(deliver|arrive|shipping)\b/i.test(t)) s.DELIVERY_INFO += 10;
  if (/\bfree\s+(delivery|shipping)\b/i.test(t)) s.DELIVERY_INFO += 10;
  if (/\b(do\s+you\s+deliver|can\s+you\s+deliver|delivery\s+to)\b/i.test(t)) s.DELIVERY_INFO += 10;
  if (/\b(deliver|shipping|ship)\b/i.test(t)) s.DELIVERY_INFO += 5;

  // ── PAYMENT_INFO ─────────────────────────────────────────────────────────────
  if (/\b(payment\s+(methods?|options?)|ways?\s+to\s+pay|how\s+(can|do)\s+i\s+pay)\b/i.test(t)) s.PAYMENT_INFO += 14;
  if (/\b(accept|take|support)\b.{0,20}\b(momo|mobile\s+money|visa|card|cash|telecel|vodafone\s+cash|at\s+money)\b/i.test(t)) s.PAYMENT_INFO += 12;
  if (/\b(pay\s+with|using\s+momo|momo|mobile\s+money|paystack|telecel|at\s+money)\b/i.test(t)) s.PAYMENT_INFO += 10;
  if (/\bcash\s+on\s+delivery\b/i.test(t)) s.PAYMENT_INFO += 10;

  // ── STORE_INFO ────────────────────────────────────────────────────────────────
  if (/\b(contact|phone\s+number|call\s+you|reach\s+you|whatsapp|location|address|where\s+are\s+you)\b/i.test(t)) s.STORE_INFO += 12;
  if (/\b(opening\s+hours?|working\s+hours?|when\s+(are\s+you\s+)?open|close)\b/i.test(t)) s.STORE_INFO += 12;
  if (/\b(about\s+(you|the\s+store|kay.?s|your\s+store)|who\s+are\s+you)\b/i.test(t)) s.STORE_INFO += 10;

  // ── BEST_SELLERS ─────────────────────────────────────────────────────────────
  if (/\b(best\s*seller|bestseller|most\s+popular|top\s+seller)\b/i.test(t)) s.BEST_SELLERS += 14;
  if (/\b(recommend|what\s+should\s+i\s+(buy|order|get)|suggest)\b/i.test(t)) s.BEST_SELLERS += 12;
  if (/\b(popular|people.?s\s+choice|commonly\s+ordered|favourite|favorite|top\s+(pick|product))\b/i.test(t)) s.BEST_SELLERS += 10;
  if (/\bbest\s+water\b/i.test(t)) s.BEST_SELLERS += 10;

  // ── GREETING ─────────────────────────────────────────────────────────────────
  if (/^(hi|hey|hello|good\s+(morning|afternoon|evening|day)|greetings|howdy|yo|sup|what.?s\s+up)[.!,? ]*$/i.test(t)) s.GREETING += 16;
  if (/^(hi\s+there|hey\s+there|hello\s+there|good\s+one)[.!,? ]*$/i.test(t)) s.GREETING += 14;

  // ── THANKS ───────────────────────────────────────────────────────────────────
  if (/\b(thank\s+you|thanks|thank\s+u|thx|cheers|much\s+appreciated)\b/i.test(t)) s.THANKS += 12;
  if (/\b(that.?s\s+(great|perfect|awesome|helpful|good|exactly\s+what\s+i\s+needed)|you.?re\s+(amazing|the\s+best))\b/i.test(t)) s.THANKS += 10;
  if (/\b(great|awesome|perfect|wonderful|excellent)\b/i.test(t) && t.split(" ").length <= 4) s.THANKS += 6;

  return (Object.entries(s) as Array<[ChatIntent, number]>)
    .map(([intent, score]) => ({ intent, score }))
    .sort((a, b) => b.score - a.score);
}

// ─── Entity Extraction ────────────────────────────────────────────────────────

/** Extract all named entities from a piece of text */
function extractEntitiesFromText(text: string): Partial<ExtractedEntities> {
  const entities: Partial<ExtractedEntities> = {};

  // Brand
  for (const b of BRAND_PATTERNS) {
    if (b.pattern.test(text)) {
      entities.brand = b.brand;
      entities.brandSlug = b.slug;
      break;
    }
  }

  // Bottle size
  for (const s of SIZE_PATTERNS) {
    if (s.pattern.test(text)) {
      entities.size = s.size;
      break;
    }
  }

  // Product match
  entities.matchedProduct = findBestProductMatch(text, entities.brand, entities.size);

  return entities;
}

/** Main entity extraction with conversation context fallback */
export function extractEntities(
  text: string,
  messageHistory?: Array<{ role: string; content: string }>
): ExtractedEntities {
  const entities: ExtractedEntities = {};

  // ── Brand ──────────────────────────────────────────────────────────────────
  for (const b of BRAND_PATTERNS) {
    if (b.pattern.test(text)) {
      entities.brand = b.brand;
      entities.brandSlug = b.slug;
      break;
    }
  }

  // ── Bottle size ────────────────────────────────────────────────────────────
  for (const s of SIZE_PATTERNS) {
    if (s.pattern.test(text)) {
      entities.size = s.size;
      break;
    }
  }

  // ── Quantity ───────────────────────────────────────────────────────────────
  const qtyPatterns = [
    // "3 packs" / "5 bottles"
    /\b(\d+)\s*(?:packs?|bottles?|pieces?|units?|x)\b/i,
    // "packs of 3"
    /\b(?:packs?|bottles?|pieces?|units?)\s+(?:of\s+)?(\d+)\b/i,
    // "buy 2 voltic", "want 3 bel-aqua", "add 2 packs"
    /\b(?:add|buy|order|want|need|get|give\s+me|send\s+me)\s+(\d+)\b/i,
    // "2 voltic", "3 Bel-Aqua" – number immediately before brand
    /\b(\d+)\s+(?:voltic|bel.?aqua|verna|awake|slem|perla)/i,
  ];
  for (const p of qtyPatterns) {
    const m = text.match(p);
    if (m) {
      const num = parseInt(m[1]);
      if (!isNaN(num) && num >= 1 && num <= 999) {
        entities.quantity = num;
        break;
      }
    }
  }

  // ── Order number ───────────────────────────────────────────────────────────
  const orderMatch =
    text.match(/\b(KP|ORD)[-\s]?\d{4}[-\s]?\d{3,}/i) ||
    text.match(/\b(KP|ORD)\d{6,}/i);
  if (orderMatch) {
    entities.orderNumber = orderMatch[0].toUpperCase().replace(/\s+/g, "-");
  }

  // ── Ghana region ───────────────────────────────────────────────────────────
  for (const r of REGION_PATTERNS) {
    if (r.pattern.test(text)) {
      entities.region = r.region;
      break;
    }
  }

  // ── newQuantity: "change to 5", "set to 3", "make it 2" ───────────────────
  const newQtyMatch = text.match(
    /\b(?:to|become|change\s+to|set\s+to|update\s+to|make\s+it)\s+(\d+)\b/i
  );
  if (newQtyMatch) {
    entities.newQuantity = parseInt(newQtyMatch[1]);
  }

  // ── Product match ──────────────────────────────────────────────────────────
  const matchedProduct = findBestProductMatch(text, entities.brand, entities.size);
  if (matchedProduct) {
    entities.matchedProduct = matchedProduct;
    entities.productId = matchedProduct.id;
    entities.productIdentifier = buildProductIdentifier(entities.brand, entities.size, matchedProduct.name);
  } else if (entities.brand) {
    entities.productIdentifier = entities.size
      ? `${entities.brand} ${entities.size}`
      : entities.brand;
  }

  // ── Context fallback: check recent messages for product mention ────────────
  if (!entities.matchedProduct && messageHistory && messageHistory.length > 0) {
    const recentMessages = messageHistory.slice(-8).reverse();
    for (const msg of recentMessages) {
      if (!msg.content) continue;
      const historyEntities = extractEntitiesFromText(msg.content);
      if (historyEntities.matchedProduct) {
        entities.matchedProduct = historyEntities.matchedProduct;
        entities.productId = historyEntities.matchedProduct.id;
        if (!entities.brand) {
          entities.brand = historyEntities.brand;
          entities.brandSlug = historyEntities.brandSlug;
        }
        if (!entities.productIdentifier) {
          entities.productIdentifier = historyEntities.matchedProduct.name;
        }
        break;
      }
    }
  }

  return entities;
}

function buildProductIdentifier(brand?: string, size?: string, fallback?: string): string {
  if (brand && size) return `${brand} ${size}`;
  if (fallback) return fallback;
  if (brand) return brand;
  return "";
}

/** Score each product against the query text and return the best match (or undefined) */
export function findBestProductMatch(
  text: string,
  brand?: string,
  size?: string
): StoreProduct | undefined {
  const t = text.toLowerCase();

  const scored = STORE_PRODUCTS.map((p) => {
    let score = 0;
    const pBrand = p.brand.toLowerCase();
    const pSize = p.bottleSize.toLowerCase().replace(/\s/g, "");
    const pPack = p.packSize.toLowerCase();
    const pName = p.name.toLowerCase();

    // Full name match
    if (t.includes(pName)) score += 20;

    // Brand match
    if (brand && pBrand === brand.toLowerCase()) {
      score += 10;
    } else {
      // Fuzzy brand match (any word in brand matches in text)
      const brandWords = pBrand.split(/\s+/).filter((w) => w.length > 3);
      if (brandWords.some((w) => t.includes(w))) score += 6;
    }

    // Size match
    if (size) {
      const normalizedSize = size.toLowerCase().replace(/\s/g, "");
      if (pSize === normalizedSize) score += 8;
      else if (pPack.includes(normalizedSize)) score += 6;
    } else {
      // Check if any size pattern matches the text AND matches this product
      for (const sp of SIZE_PATTERNS) {
        if (sp.pattern.test(t)) {
          const norm = sp.size.toLowerCase().replace(/\s/g, "");
          if (pSize === norm || pPack.includes(norm)) {
            score += 6;
          }
        }
      }
    }

    // Bottle count in text e.g. "x15", "15 bottles"
    const countMatch = t.match(/\bx?\s*(\d{1,2})\s*(?:bottles?|pcs?)?\b/);
    if (countMatch && p.bottlesPerPack === parseInt(countMatch[1])) score += 4;

    // dispenser/jar/pocket keyword shortcuts
    if (/dispenser|jar/i.test(t) && p.category === "Dispensers") score += 6;
    if (/pocket/i.test(t) && p.bottleSize.includes("350")) score += 6;

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Require at least a brand OR size match (score ≥ 6) to return a result
  return best && best.score >= 6 ? best.product : undefined;
}

// ─── Main Detector ────────────────────────────────────────────────────────────

/**
 * Detect the customer's intent from their message.
 * Pass messageHistory so pronoun references like "add it" resolve correctly.
 */
export function detectIntent(
  text: string,
  messageHistory?: Array<{ role: string; content: string }>
): IntentResult {
  const scored = scoreIntents(text);
  const top = scored[0];

  // Compute a simple 0-1 confidence
  const totalScore = scored.reduce((acc, s) => acc + s.score, 0);
  const confidence =
    totalScore > 0 ? Math.min(1, top.score / (totalScore || 1)) : 0;

  const intent: ChatIntent = top.score > 0 ? top.intent : "UNKNOWN";
  const entities = extractEntities(text, messageHistory);

  return {
    intent,
    confidence,
    entities,
    rawText: text,
  };
}
