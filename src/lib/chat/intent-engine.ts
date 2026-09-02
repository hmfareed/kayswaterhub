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
  | "HOW_ARE_YOU"
  | "GREETING"
  | "THANKS"
  | "NEED_ASSISTANCE"
  | "THIRSTY"
  | "PRICE_CALCULATION"
  | "BUDGET_RECOMMENDATION"
  | "TOGGLE_DARK_MODE"
  | "CONTACT_HUMAN"
  | "CREATE_ACCOUNT"
  | "WHY_BUY_FROM_US"
  | "WATER_PURITY_QUALITY"
  | "STORE_CATALOG_OVERVIEW"
  | "ADD_AND_CHECKOUT"
  | "BULK_WHOLESALE_ORDERS"
  | "DISPENSER_REFILL_POLICY"
  | "DELIVERY_SPEED_TIMEFRAME"
  | "CANCEL_REFUND_POLICY"
  | "WATER_RECOMMENDATION_BABY_GYM"
  | "DISCOUNT_PROMO_POINTS"
  | "WORKING_HOURS"
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
  // ── New intents ────────────────────────────────────────────────────────────
  | "CANCEL_ORDER"
  | "REPEAT_ORDER"
  | "ORDER_MODIFICATION"
  | "INVOICE_RECEIPT"
  | "CHANGE_DELIVERY_ADDRESS"
  | "COMPARE_PRODUCTS"
  | "DIETARY_WATER_INQUIRY"
  | "PACKAGING_INQUIRY"
  | "STOCK_ALERT_REQUEST"
  | "UPSELL_COMBO"
  | "PAYMENT_FAILURE"
  | "PROMO_CODE_APPLY"
  | "LOYALTY_POINTS_CHECK"
  | "ACCOUNT_LOGIN_HELP"
  | "CHANGE_PAYMENT_METHOD"
  | "EMERGENCY_DELIVERY"
  | "DRIVER_CONTACT"
  | "ORDER_ETA"
  | "MINIMUM_ORDER_INQUIRY"
  | "MULTIPLE_DELIVERY_ADDRESSES"
  | "CORPORATE_ACCOUNT"
  | "GIFT_ORDER"
  | "REFUND_REQUEST"
  | "PRODUCT_COMPLAINT"
  | "SOCIAL_MEDIA_INQUIRY"
  | "SAVED_ADDRESSES"
  | "NEARBY_PICKUP"
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
  city?: string;
  budget?: number;
  targetTheme?: "dark" | "light" | "toggle";
  newQuantity?: number; // for UPDATE_CART_QTY ("change it to 3")
  andCheckout?: boolean;
  secondBrand?: string; // for COMPARE_PRODUCTS
  secondProduct?: StoreProduct; // for COMPARE_PRODUCTS
}

export interface IntentResult {
  intent: ChatIntent;
  confidence: number; // 0-1
  entities: ExtractedEntities;
  rawText: string;
}

// ─── Dictionaries ─────────────────────────────────────────────────────────────

const BRAND_PATTERNS: Array<{ pattern: RegExp; brand: string; slug: string }> = [
  { pattern: /\bvoltic\b|\bvoltec\b|\bvoltik\b/i, brand: "Voltic", slug: "voltic" },
  { pattern: /\b(bel[- ]?aqua|belaqua|bell[- ]?aqua|bellaqua|bel\s*agua)\b/i, brand: "Bel-Aqua", slug: "bel-aqua" },
  { pattern: /\bverna\b|\bverna\b/i, brand: "Verna", slug: "verna" },
  { pattern: /\bawake\b/i, brand: "Awake", slug: "awake" },
  { pattern: /\b(slem[- ]?fit|slemfit|slim[- ]?fit)\b/i, brand: "Slem Fit", slug: "slem-fit" },
  { pattern: /\bperla\b/i, brand: "Perla", slug: "perla" },
  { pattern: /\bspecial[- ]?ice\b/i, brand: "Special Ice", slug: "special-ice" },
];

const SIZE_PATTERNS: Array<{ pattern: RegExp; size: string }> = [
  { pattern: /\b330\s*ml\b/i, size: "330ml" },
  { pattern: /\b350\s*ml\b/i, size: "350ml" },
  { pattern: /\b500\s*ml\b/i, size: "500ml" },
  { pattern: /\b750\s*ml\b/i, size: "750ml" },
  { pattern: /\b19\s*l(?:itre|iter|s)?\b/i, size: "19L" },
  { pattern: /\b15\s*l(?:itre|iter|s)?\b/i, size: "15L" },
  { pattern: /\b1\.5\s*l(?:itre|iter|s)?\b/i, size: "1.5L" },
  { pattern: /\bpocket\b/i, size: "350ml" },
  { pattern: /\bdispenser\b/i, size: "15L" },
  { pattern: /\bjar\b/i, size: "15L" },
  { pattern: /\b(sachet|pure\s+water|rubber\s+water)\b/i, size: "500ml" },
];

const REGION_CITY_PATTERNS: Array<{ pattern: RegExp; region: string; city?: string }> = [
  { pattern: /\b(tamale|sagnarigu)\b/i, region: "Northern", city: "Tamale" },
  { pattern: /\b(kumasi|asokwa|bantama|nhyiaeso|suame|kwadaso)\b/i, region: "Ashanti", city: "Kumasi" },
  { pattern: /\b(takoradi|sekondi|tarkwa)\b/i, region: "Western", city: "Takoradi" },
  { pattern: /\b(cape\s+coast|elmina|winneba|kasoa)\b/i, region: "Central", city: "Cape Coast" },
  { pattern: /\b(koforidua|nkawkaw|akosombo)\b/i, region: "Eastern", city: "Koforidua" },
  { pattern: /\b(ho|hohoe|kpando)\b/i, region: "Volta", city: "Ho" },
  { pattern: /\b(sunyani|berkekum|techiman)\b/i, region: "Bono", city: "Sunyani" },
  { pattern: /\b(bolgatanga|bolga|navrongo|bawku)\b/i, region: "Upper East", city: "Bolgatanga" },
  { pattern: /\b(wa|nandom|lawra)\b/i, region: "Upper West", city: "Wa" },
  { pattern: /\b(tema|ashaiman|prampram|kpone)\b/i, region: "Greater Accra", city: "Tema" },
  { pattern: /greater\s+accra|accra\b|gra\b|madina|spintex|legon|east\s+legon|osu|airport|adabraka|dansoman|lapaz|achimota|dzorwulu|cantonments/i, region: "Greater Accra", city: "Accra" },
  { pattern: /\bashanti\b/i, region: "Ashanti" },
  { pattern: /\bwestern\b/i, region: "Western" },
  { pattern: /\bcentral\b/i, region: "Central" },
  { pattern: /\beastern\b/i, region: "Eastern" },
  { pattern: /\bvolta\b/i, region: "Volta" },
  { pattern: /\bnorthern\b/i, region: "Northern" },
  { pattern: /upper\s+east\b/i, region: "Upper East" },
  { pattern: /upper\s+west\b/i, region: "Upper West" },
  { pattern: /bono\s+east\b/i, region: "Bono East" },
  { pattern: /\bahafo\b/i, region: "Ahafo" },
  { pattern: /western\s+north\b/i, region: "Western North" },
  { pattern: /\boti\b/i, region: "Oti" },
  { pattern: /north\s+east\b/i, region: "North East" },
  { pattern: /\bsavannah\b/i, region: "Savannah" },
];

// ─── Intent Scoring ───────────────────────────────────────────────────────────

type ScoreMap = Record<ChatIntent, number>;

function buildZeroScores(): ScoreMap {
  return {
    HOW_ARE_YOU: 0,
    GREETING: 0,
    THANKS: 0,
    NEED_ASSISTANCE: 0,
    THIRSTY: 0,
    PRICE_CALCULATION: 0,
    BUDGET_RECOMMENDATION: 0,
    TOGGLE_DARK_MODE: 0,
    CONTACT_HUMAN: 0,
    CREATE_ACCOUNT: 0,
    WHY_BUY_FROM_US: 0,
    WATER_PURITY_QUALITY: 0,
    STORE_CATALOG_OVERVIEW: 0,
    ADD_AND_CHECKOUT: 0,
    BULK_WHOLESALE_ORDERS: 0,
    DISPENSER_REFILL_POLICY: 0,
    DELIVERY_SPEED_TIMEFRAME: 0,
    CANCEL_REFUND_POLICY: 0,
    WATER_RECOMMENDATION_BABY_GYM: 0,
    DISCOUNT_PROMO_POINTS: 0,
    WORKING_HOURS: 0,
    ADD_TO_CART: 0,
    REMOVE_FROM_CART: 0,
    UPDATE_CART_QTY: 0,
    VIEW_CART: 0,
    CLEAR_CART: 0,
    CHECKOUT: 0,
    CHECK_STOCK: 0,
    SEARCH_PRODUCTS: 0,
    GET_PRODUCT_DETAIL: 0,
    TRACK_ORDER: 0,
    MY_ORDERS: 0,
    DELIVERY_INFO: 0,
    PAYMENT_INFO: 0,
    STORE_INFO: 0,
    BEST_SELLERS: 0,
    // New intents
    CANCEL_ORDER: 0,
    REPEAT_ORDER: 0,
    ORDER_MODIFICATION: 0,
    INVOICE_RECEIPT: 0,
    CHANGE_DELIVERY_ADDRESS: 0,
    COMPARE_PRODUCTS: 0,
    DIETARY_WATER_INQUIRY: 0,
    PACKAGING_INQUIRY: 0,
    STOCK_ALERT_REQUEST: 0,
    UPSELL_COMBO: 0,
    PAYMENT_FAILURE: 0,
    PROMO_CODE_APPLY: 0,
    LOYALTY_POINTS_CHECK: 0,
    ACCOUNT_LOGIN_HELP: 0,
    CHANGE_PAYMENT_METHOD: 0,
    EMERGENCY_DELIVERY: 0,
    DRIVER_CONTACT: 0,
    ORDER_ETA: 0,
    MINIMUM_ORDER_INQUIRY: 0,
    MULTIPLE_DELIVERY_ADDRESSES: 0,
    CORPORATE_ACCOUNT: 0,
    GIFT_ORDER: 0,
    REFUND_REQUEST: 0,
    PRODUCT_COMPLAINT: 0,
    SOCIAL_MEDIA_INQUIRY: 0,
    SAVED_ADDRESSES: 0,
    NEARBY_PICKUP: 0,
    UNKNOWN: 0,
  };
}

function scoreIntents(text: string): Array<{ intent: ChatIntent; score: number }> {
  const t = text.toLowerCase().trim();
  const s = buildZeroScores();
  const hasBrand = BRAND_PATTERNS.some((b) => b.pattern.test(t));
  const hasNumber = /\b\d+\b/.test(t);

  // ── HOW_ARE_YOU ─────────────────────────────────────────────────────────────
  if (/\b(how\s+are\s+you|how\s+r\s+u|how\s+are\s+u|how\s+are\s+you\s+doing|how.?s\s+it\s+going|how\s+do\s+you\s+do|hope\s+you.?re\s+well|how\s+are\s+things)\b/i.test(t)) {
    s.HOW_ARE_YOU += 20;
  }

  // ── GREETING ─────────────────────────────────────────────────────────────────
  if (/^(good\s+(morning|afternoon|evening|day)|morning|afternoon|evening)[.!,? ]*$/i.test(t)) s.GREETING += 18;
  if (/^(hi|hey|hello|greetings|howdy|yo|sup|what.?s\s+up|kays|kay.?s)[.!,? ]*$/i.test(t)) s.GREETING += 16;
  if (/^(hi\s+there|hey\s+there|hello\s+there|good\s+one)[.!,? ]*$/i.test(t)) s.GREETING += 16;
  if (/\b(good\s+(morning|afternoon|evening))\b/i.test(t) && t.split(" ").length <= 5) s.GREETING += 14;

  // ── THANKS ───────────────────────────────────────────────────────────────────
  if (/\b(thank\s+you|thanks|thank\s+u|thx|cheers|much\s+appreciated|medaase|meda\s+ase|god\s+bless\s+you|daabi|ete\s+sen)\b/i.test(t)) s.THANKS += 16;
  if (/\b(that.?s\s+(great|perfect|awesome|helpful|good|exactly\s+what\s+i\s+needed)|you.?re\s+(amazing|the\s+best|helpful))\b/i.test(t)) s.THANKS += 12;

  // ── NEED_ASSISTANCE ─────────────────────────────────────────────────────────
  if (/\b(can\s+you\s+help\s+me|i\s+need\s+assistance|i\s+need\s+help|assist\s+me|help\s+me|need\s+support|i\s+have\s+a\s+question)\b/i.test(t)) {
    s.NEED_ASSISTANCE += 16;
  }

  // ── THIRSTY / URGENT WATER ──────────────────────────────────────────────────
  if (/\b(i.?m\s+thirsty|i\s+am\s+thirsty|very\s+thirsty|quench\s+(my\s+)?thirst|need\s+water|water\s+please|i\s+want\s+water)\b/i.test(t)) {
    s.THIRSTY += 16;
  }

  // ── TOGGLE_DARK_MODE ────────────────────────────────────────────────────────
  if (/\b(turn\s+on\s+dark\s+mode|enable\s+dark\s+mode|switch\s+to\s+dark|dark\s+theme|dark\s+mode|night\s+mode|turn\s+on\s+light\s+mode|enable\s+light\s+mode|switch\s+to\s+light|change\s+theme|toggle\s+theme)\b/i.test(t)) {
    s.TOGGLE_DARK_MODE += 20;
  }

  // ── CONTACT_HUMAN (Manager, Agent, Owner) ───────────────────────────────────
  if (/\b(speak\s+to|talk\s+to|chat\s+with|call|reach|contact)\b.{0,30}\b(manager|agent|owner|human|representative|customer\s+care|support\s+team|boss|admin)\b/i.test(t)) {
    s.CONTACT_HUMAN += 22;
  }
  if (/\b(human\s+agent|real\s+person|human\s+being|support\s+agent|talk\s+to\s+a\s+person|whatsapp\s+number|phone\s+number)\b/i.test(t)) {
    s.CONTACT_HUMAN += 16;
  }

  // ── BUDGET_RECOMMENDATION ───────────────────────────────────────────────────
  if (/\b(budget\s+of|have\s+\d+\s*(cedis|ghc|ghs|cedi)|with\s+\d+\s*(cedis|ghc|ghs|cedi)|what\s+can\s+i\s+(purchase|buy|get)\s+with|affordable\s+options|within\s+\d+\s*(cedis|ghc|ghs))\b/i.test(t)) {
    s.BUDGET_RECOMMENDATION += 20;
  }
  if (/\b\d+\s*(cedis|ghc|ghs)\b.{0,30}\b(what\s+can|budget|afford|buy|purchase)\b/i.test(t)) {
    s.BUDGET_RECOMMENDATION += 18;
  }

  // ── PRICE_CALCULATION (Multi-pack math) ──────────────────────────────────────
  if (/\b(what\s+is\s+the\s+price\s+of|how\s+much\s+(is|for|are)|cost\s+of|total\s+for|calculate\s+price)\b.{0,30}\b(two|three|four|five|six|seven|eight|nine|ten|\d+)\s*(packs?|bottles?|units?|cases?|cartons?)\b/i.test(t)) {
    s.PRICE_CALCULATION += 22;
  }
  if (/\b(price\s+of|cost\s+of|how\s+much\s+is)\s+\d+\s*(packs?|bottles?)/i.test(t)) {
    s.PRICE_CALCULATION += 20;
  }
  if (/\bhow\s+much\s+(for\s+)?(two|three|four|five|\d+)\s+(voltic|bel.?aqua|belaqua|verna|awake|slem)/i.test(t)) {
    s.PRICE_CALCULATION += 18;
  }

  // ── CREATE_ACCOUNT ──────────────────────────────────────────────────────────
  if (/\b(create\s+(an?\s+)?account|how\s+(do|can)\s+i\s+(sign\s*up|register|create\s+an\s+account|open\s+an\s+account)|sign\s*up\s+process|registration)\b/i.test(t)) {
    s.CREATE_ACCOUNT += 20;
  }

  // ── WHY_BUY_FROM_US (Value Proposition) ─────────────────────────────────────
  if (/\b(why\s+(should\s+i\s+)?buy\s+from\s+you|why\s+kay.?s(\s+packs)?|what\s+makes\s+you\s+(different|special|better)|why\s+choose\s+you|benefits\s+of\s+buying)\b/i.test(t)) {
    s.WHY_BUY_FROM_US += 20;
  }

  // ── WATER_PURITY_QUALITY ────────────────────────────────────────────────────
  if (/\b(is\s+(the\s+|your\s+|there\s+)?water\s+(clean|fresh|pure|safe|genuine|authentic|healthy)|water\s+quality|purity|fda\s+approved|standard\s+authority|is\s+it\s+safe\s+to\s+drink)\b/i.test(t)) {
    s.WATER_PURITY_QUALITY += 20;
  }

  // ── STORE_CATALOG_OVERVIEW ──────────────────────────────────────────────────
  if (/\b(check\s+the\s+store|explore\s+the\s+store|what.?s\s+in\s+the\s+store|browse\s+store|show\s+store|view\s+store|open\s+store|store\s+catalog)\b/i.test(t)) {
    s.STORE_CATALOG_OVERVIEW += 18;
  }

  // ── ADD_AND_CHECKOUT ────────────────────────────────────────────────────────
  if (/\b(add\b.{0,25}\b(to\s+cart|to\s+my\s+cart)\b.{0,20}\b(and|then)?\s*(checkout|pay|proceed\s+to\s+checkout))\b/i.test(t)) {
    s.ADD_AND_CHECKOUT += 22;
  }

  // ── BULK / WHOLESALE / EVENT ORDERS ─────────────────────────────────────────
  if (/\b(bulk|wholesale|wedding|funeral|church|event|party|parties|50\s*packs|100\s*packs|large\s+quantity|discount\s+for\s+many)\b/i.test(t)) {
    s.BULK_WHOLESALE_ORDERS += 18;
  }

  // ── DISPENSER REFILLS & BOTTLE RETURNS ──────────────────────────────────────
  if (/\b(dispenser\b.{0,30}\b(refills?|exchange|swap|bottle)|refills?\b.{0,30}\b(dispenser|15l|19l|jar|bottle)|15l\s+dispenser|exchange\s+bottle|return\s+empty\s+bottle|empty\s+jar|bottle\s+swap)\b/i.test(t)) {
    s.DISPENSER_REFILL_POLICY += 20;
  }

  // ── DELIVERY SPEED & TIMEFRAME ──────────────────────────────────────────────
  if (/\b(how\s+fast|how\s+long\s+does\s+delivery\s+take|when\s+will\s+i\s+get|same\s*day\s+delivery\s+time|cutoff\s+time|express\s+delivery)\b/i.test(t)) {
    s.DELIVERY_SPEED_TIMEFRAME += 16;
  }

  // ── CANCELLATION & REFUNDS (Policy, not action) ──────────────────────────────────────────────
  if (/\b(what\s+is\s+your\s+cancel|cancel(lation)?\s+policy|return\s+policy|refund\s+policy|how\s+do\s+i\s+cancel|can\s+i\s+cancel)\b/i.test(t)) {
    s.CANCEL_REFUND_POLICY += 18;
  }

  // ── WATER RECOMMENDATION (BABY / GYM / HEALTH) ──────────────────────────────
  if (/\b(best\s+water\s+for\s+babies|infant\s+formula|baby|gym|fitness|workout|electrolytes|alkaline|low\s+sodium)\b/i.test(t)) {
    s.WATER_RECOMMENDATION_BABY_GYM += 18;
  }

  // ── DISCOUNTS / PROMOS / LOYALTY POINTS ─────────────────────────────────────
  if (/\b(free\s+delivery\s+promo|deal|discount\s+for\s+order|bulk\s+discount|loyalty\s+deal|referral)\b/i.test(t)) {
    s.DISCOUNT_PROMO_POINTS += 16;
  }

  // ── WORKING HOURS ───────────────────────────────────────────────────────────
  if (/\b(opening\s+hours|working\s+hours|are\s+you\s+open|what\s+time\s+do\s+you\s+close|open\s+on\s+sundays?)\b/i.test(t)) {
    s.WORKING_HOURS += 18;
  }

  // ── ADD_TO_CART ──────────────────────────────────────────────────────────────
  if (/\b(add|put|place|drop|throw)\b.{0,30}\b(cart|bag|order)\b/i.test(t) && !s.ADD_AND_CHECKOUT) s.ADD_TO_CART += 12;
  if (/\b(i want|give me|get me|send me)\s+\d+/i.test(t)) s.ADD_TO_CART += 10;
  if (/\b(buy|order|purchase)\s+\d+/i.test(t)) s.ADD_TO_CART += 10;
  if (/\b\d+\s*(packs?|pieces?|bottles?|units?)?\b.{0,30}(of\s+)?\b(voltic|voltec|bel.?aqua|verna|awake|slem|belaqua)/i.test(t) && !s.PRICE_CALCULATION) s.ADD_TO_CART += 12;
  if (/\b(add|buy|order|get)\s+\d+\b/i.test(t)) s.ADD_TO_CART += 8;
  if (hasBrand && hasNumber && /\b(cart|want|buy|order|get|add)\b/i.test(t) && !s.PRICE_CALCULATION) s.ADD_TO_CART += 6;
  if (/\bplease\s+(add|send|bring|get)\b/i.test(t) && hasBrand) s.ADD_TO_CART += 5;
  if (/\bi want\s+(a\s+pack|pack\s+of\s+water|some\s+water|water\s+pack)\b/i.test(t)) s.ADD_TO_CART += 6;
  // Ghanaian pidgin: "make I get", "I go buy", "I wan buy"
  if (/\b(make\s+i\s+(get|take|buy|add)|i\s+(go|wan|wanna)\s+(buy|add|order))\b/i.test(t)) s.ADD_TO_CART += 10;

  // ── REMOVE_FROM_CART ─────────────────────────────────────────────────────────
  if (/\b(remove|delete|take out|drop|ditch)\b.{0,30}\b(cart|bag)\b/i.test(t)) s.REMOVE_FROM_CART += 14;
  if (/\b(remove|delete|take out|cancel)\b.{0,25}(voltic|voltec|bel.?aqua|belaqua|verna|awake|slem|perla)/i.test(t)) s.REMOVE_FROM_CART += 14;
  if (/\bi\s+don.?t\s+want.{0,30}(anymore|no\s+longer)/i.test(t)) s.REMOVE_FROM_CART += 10;
  if (/\btake\s+(off|it\s+off|that\s+off)\b/i.test(t) && hasBrand) s.REMOVE_FROM_CART += 8;

  // ── UPDATE_CART_QTY ──────────────────────────────────────────────────────────
  if (/\b(change|update|modify|set|make\s+it)\b.{0,30}\bto\b.{0,10}\d+/i.test(t)) s.UPDATE_CART_QTY += 14;
  if (/\b(increase|decrease|reduce)\b.{0,20}\b(quantity|qty|amount|number)\b/i.test(t)) s.UPDATE_CART_QTY += 12;
  if (/\b(quantity|qty)\b.{0,15}\d+/i.test(t)) s.UPDATE_CART_QTY += 8;
  if (/\badd\s+(more|another|\d+\s+more)\b/i.test(t)) s.UPDATE_CART_QTY += 10;

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
  if (/\bi.?m\s+ready\s+to\s+(pay|order)\b/i.test(t)) s.CHECKOUT += 10;
  // Ghanaian: "make I pay"
  if (/\b(make\s+i\s+pay|i\s+(go|wan)\s+pay)\b/i.test(t)) s.CHECKOUT += 12;

  // ── CHECK_STOCK / BRAND INQUIRY ───────────────────────────────────────────────
  if (/\b(do\s+you\s+have|in\s+stock|available|have\s+in\s+stock|is\s+there|any\s+left|still\s+have)\b.{0,25}(voltic|voltec|bel.?aqua|belaqua|verna|awake|slem|perla|special|water|dispenser)/i.test(t)) s.CHECK_STOCK += 16;
  if (/\bdo\s+you\s+have\s+(voltic|voltec|bel.?aqua|belaqua|verna|awake|slem|perla|water)\b/i.test(t)) s.CHECK_STOCK += 16;
  if (/\b(stock|availability|units\s+left|remaining|how\s+many)\b/i.test(t)) s.CHECK_STOCK += 8;
  if (hasBrand && !hasNumber && /\b(i\s+want|need|looking\s+for)\b/i.test(t) && !s.PRICE_CALCULATION) s.CHECK_STOCK += 6;
  // Ghanaian: "e don finish?" = is it out of stock?
  if (/\be\s+don\s+finish|dem\s+finish\s+am|e\s+finish/i.test(t)) s.CHECK_STOCK += 18;

  // ── SEARCH_PRODUCTS ───────────────────────────────────────────────────────────
  if (/\b(what\s+water|which\s+water|what\s+brands?|what\s+products?|what\s+do\s+you\s+(have|sell|offer|carry))\b/i.test(t) && !s.STORE_CATALOG_OVERVIEW) s.SEARCH_PRODUCTS += 12;
  if (/\b(show\s+me|list|browse|see\s+all|view\s+all|catalogue|catalog)\b.{0,20}\b(products?|water|brands?|items?)\b/i.test(t)) s.SEARCH_PRODUCTS += 10;
  if (/\b(cheapest|affordable|price\s+list|all\s+products?|everything\s+you\s+have)\b/i.test(t) && !s.BUDGET_RECOMMENDATION) s.SEARCH_PRODUCTS += 8;
  if (/\bwhat\s+do\s+you\s+sell\b/i.test(t)) s.SEARCH_PRODUCTS += 14;

  // ── GET_PRODUCT_DETAIL ────────────────────────────────────────────────────────
  if (/\b(tell\s+me\s+about|info\s+(about|on)|information\s+about|details?\s+(about|on)|describe)\b.{0,30}(voltic|voltec|bel.?aqua|belaqua|verna|awake|slem|perla)/i.test(t)) s.GET_PRODUCT_DETAIL += 14;
  if (/\bwhat\s+is\b.{0,20}(voltic|bel.?aqua|belaqua|verna|awake|slem|perla)/i.test(t)) s.GET_PRODUCT_DETAIL += 12;

  // ── TRACK_ORDER ───────────────────────────────────────────────────────────────
  if (/\b(track|tracking|where\s+is|where.?s\s+my|status\s+of|what\s+happened\s+to)\b.{0,30}\border\b/i.test(t)) s.TRACK_ORDER += 16;
  // Match both KP- and ORD- prefixed order numbers
  if (/\b(KP|ORD)-?\d{4}/i.test(t)) s.TRACK_ORDER += 20;
  if (/\border\s+(number|#|no\.?|ref(erence)?)\b/i.test(t)) s.TRACK_ORDER += 10;

  // ── MY_ORDERS ─────────────────────────────────────────────────────────────────
  if (/\b(my\s+orders?|order\s+history|past\s+orders?|previous\s+orders?|recent\s+orders?|all\s+my\s+orders?)\b/i.test(t)) s.MY_ORDERS += 16;
  if (/\borders?\s+(i.?ve\s+(made|placed)|list)\b/i.test(t)) s.MY_ORDERS += 12;

  // ── DELIVERY_INFO ─────────────────────────────────────────────────────────────
  if (/\b(delivery\s+fee|delivery\s+cost|shipping\s+(fee|cost|charge)|how\s+is\s+the\s+delivery\s+fee\s+configured)\b/i.test(t)) s.DELIVERY_INFO += 16;
  if (/\b(do\s+you\s+deliver\s+to|deliver\s+to\s+tamale|deliver\s+to\s+kumasi|delivery\s+in\s+accra|can\s+you\s+deliver\s+to)\b/i.test(t)) s.DELIVERY_INFO += 16;
  if (/\bhow\s+much.{0,15}(deliver|ship|bring)\b/i.test(t)) s.DELIVERY_INFO += 12;
  if (/\bfree\s+(delivery|shipping)\b/i.test(t) && !s.DISCOUNT_PROMO_POINTS) s.DELIVERY_INFO += 10;
  if (/\b(deliver|shipping|ship)\b/i.test(t) && !s.DELIVERY_SPEED_TIMEFRAME) s.DELIVERY_INFO += 6;

  // ── PAYMENT_INFO (MoMo, Cards, Paystack) ──────────────────────────────────────
  if (/\b(can\s+i\s+pay\s+with\s+momo|pay\s+with\s+momo|mobile\s+money|mtn\s+momo|telecel|vodafone\s+cash|at\s+money|payment\s+(methods?|options?)|how\s+(can|do)\s+i\s+pay)\b/i.test(t)) s.PAYMENT_INFO += 18;
  if (/\b(accept|take|support)\b.{0,20}\b(momo|mobile\s+money|visa|card|cash|telecel|at\s+money)\b/i.test(t)) s.PAYMENT_INFO += 14;

  // ── STORE_INFO ────────────────────────────────────────────────────────────────
  if (/\b(location|address|where\s+are\s+you|where\s+is\s+your\s+shop|about\s+kay.?s|who\s+are\s+you)\b/i.test(t) && !s.CONTACT_HUMAN) s.STORE_INFO += 12;

  // ── BEST_SELLERS ─────────────────────────────────────────────────────────────
  if (/\b(best\s*sellers?|bestsellers?|most\s+popular|top\s+sellers?|give\s+me\s+the\s+best\s+selling)\b/i.test(t)) s.BEST_SELLERS += 18;
  if (/\b(what\s+are\s+the\s+best\s+selling|recommend\s+top\s+water|most\s+bought)\b/i.test(t)) s.BEST_SELLERS += 16;
  if (/\b(popular|people.?s\s+choice|favourite|favorite|top\s+(pick|product))\b/i.test(t)) s.BEST_SELLERS += 10;

  // ════════════════════════════════════════════════════════════════════════════
  // ── NEW INTENTS ──────────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════

  // ── CANCEL_ORDER (Action, not policy) ────────────────────────────────────────
  if (/\b(cancel\s+my\s+order|i\s+want\s+to\s+cancel|please\s+cancel|cancel\s+order|i\s+changed\s+my\s+mind|i\s+no\s+longer\s+want)\b/i.test(t)) s.CANCEL_ORDER += 22;
  if (/\b(cancel)\b.{0,20}\b(it|that|this|the\s+order)\b/i.test(t)) s.CANCEL_ORDER += 16;

  // ── REPEAT_ORDER ─────────────────────────────────────────────────────────────
  if (/\b(reorder|re-order|order\s+again|same\s+as\s+(before|last\s+time)|repeat\s+(my\s+)?(last\s+)?order|order\s+the\s+same|buy\s+again)\b/i.test(t)) s.REPEAT_ORDER += 22;
  if (/\b(last\s+order|previous\s+order)\b.{0,20}\b(again|repeat|same)\b/i.test(t)) s.REPEAT_ORDER += 18;

  // ── ORDER_MODIFICATION ────────────────────────────────────────────────────────
  if (/\b(change\s+my\s+order|modify\s+my\s+order|update\s+my\s+order|add\s+to\s+my\s+(existing\s+)?order|edit\s+order)\b/i.test(t)) s.ORDER_MODIFICATION += 20;

  // ── INVOICE_RECEIPT ───────────────────────────────────────────────────────────
  if (/\b(invoice|receipt|proof\s+of\s+purchase|confirmation\s+email|order\s+confirmation|send\s+receipt|get\s+receipt|print\s+receipt)\b/i.test(t)) s.INVOICE_RECEIPT += 20;

  // ── CHANGE_DELIVERY_ADDRESS ───────────────────────────────────────────────────
  if (/\b(change\s+(my\s+)?delivery\s+address|update\s+(my\s+)?address|different\s+(delivery\s+)?address|deliver\s+to\s+(a\s+)?different|wrong\s+address)\b/i.test(t)) s.CHANGE_DELIVERY_ADDRESS += 20;

  // ── COMPARE_PRODUCTS ─────────────────────────────────────────────────────────
  if (/\b(compare|difference\s+between|which\s+is\s+better|vs\.?|versus|what.?s\s+(the\s+)?difference)\b.{0,40}(voltic|voltec|bel.?aqua|belaqua|verna|awake|slem|perla)/i.test(t)) s.COMPARE_PRODUCTS += 22;
  if (/\b(voltic|voltec|bel.?aqua|belaqua|verna|awake|slem|perla)\b.{0,20}\b(vs\.?|versus|or|compared\s+to|better\s+than)\b/i.test(t)) s.COMPARE_PRODUCTS += 20;
  if (/\bwhich\s+(water|brand)\s+(should|would)\s+i\b/i.test(t) && hasBrand) s.COMPARE_PRODUCTS += 14;

  // ── DIETARY_WATER_INQUIRY ────────────────────────────────────────────────────
  if (/\b(fluoride.?free|low\s+sodium|mineral\s+content|ph\s+level|alkaline\s+water|purified\s+water|spring\s+water|tds\s+level|total\s+dissolved)\b/i.test(t)) s.DIETARY_WATER_INQUIRY += 20;
  if (/\b(which\s+water\s+(has|contains)|water\s+with\s+(minerals|electrolytes|calcium)|healthiest\s+water)\b/i.test(t)) s.DIETARY_WATER_INQUIRY += 16;

  // ── PACKAGING_INQUIRY ────────────────────────────────────────────────────────
  if (/\b(single\s+bottle|individual\s+bottle|one\s+bottle|just\s+one|buy\s+(a\s+single|just\s+one|one))\b/i.test(t)) s.PACKAGING_INQUIRY += 20;
  if (/\b(minimum\s+pack|smallest\s+pack|can\s+i\s+buy\s+one|do\s+you\s+sell\s+single)\b/i.test(t)) s.PACKAGING_INQUIRY += 18;

  // ── STOCK_ALERT_REQUEST ───────────────────────────────────────────────────────
  if (/\b(notify\s+me|alert\s+me|let\s+me\s+know)\b.{0,30}\b(back\s+in\s+stock|available|in\s+stock)\b/i.test(t)) s.STOCK_ALERT_REQUEST += 22;
  if (/\b(stock\s+alert|availability\s+alert|notify\s+when\s+available)\b/i.test(t)) s.STOCK_ALERT_REQUEST += 20;

  // ── UPSELL_COMBO ─────────────────────────────────────────────────────────────
  if (/\b(combo|bundle|package\s+deal|what\s+(goes\s+well|can\s+i\s+combine)|mix\s+and\s+match|best\s+(combination|mix|deal))\b/i.test(t)) s.UPSELL_COMBO += 18;
  if (/\b(recommend\s+(a\s+)?combo|suggest\s+(a\s+)?bundle|best\s+value\s+combo)\b/i.test(t)) s.UPSELL_COMBO += 20;

  // ── PAYMENT_FAILURE ───────────────────────────────────────────────────────────
  if (/\b(payment\s+failed|payment\s+not\s+working|couldn.?t\s+pay|unable\s+to\s+pay|payment\s+error|payment\s+issue)\b/i.test(t)) s.PAYMENT_FAILURE += 22;
  if (/\b(momo\s+(deducted|charged|taken)\s+but|money\s+left\s+but\s+no\s+order|charged\s+twice|double\s+charge|deducted\s+but\s+no\s+confirmation)\b/i.test(t)) s.PAYMENT_FAILURE += 24;
  if (/\b(transaction\s+failed|payment\s+declined|card\s+declined|momo\s+failed)\b/i.test(t)) s.PAYMENT_FAILURE += 20;

  // ── PROMO_CODE_APPLY ─────────────────────────────────────────────────────────
  if (/\b(promo\s+code|coupon\s+code|discount\s+code|voucher|apply\s+(a\s+)?code|use\s+(a\s+)?code|redeem\s+code)\b/i.test(t)) s.PROMO_CODE_APPLY += 22;
  if (/\bi\s+have\s+(a\s+)?(promo|coupon|discount|voucher)\b/i.test(t)) s.PROMO_CODE_APPLY += 18;

  // ── LOYALTY_POINTS_CHECK ─────────────────────────────────────────────────────
  if (/\b(loyalty\s+points|reward\s+points|hydration\s+points|how\s+many\s+points|my\s+points\s+balance|check\s+my\s+points|points\s+balance)\b/i.test(t)) s.LOYALTY_POINTS_CHECK += 22;
  if (/\b(earn\s+points|redeem\s+points|points\s+(rewards?|system))\b/i.test(t)) s.LOYALTY_POINTS_CHECK += 16;

  // ── ACCOUNT_LOGIN_HELP ────────────────────────────────────────────────────────
  if (/\b(forgot\s+(my\s+)?password|can.?t\s+(log|sign)\s+in|reset\s+password|account\s+locked|login\s+(problem|issue|error)|unable\s+to\s+login|not\s+able\s+to\s+sign\s+in)\b/i.test(t)) s.ACCOUNT_LOGIN_HELP += 22;
  if (/\b(i\s+don.?t\s+remember\s+my\s+password|forgot\s+email|lost\s+access\s+to\s+account)\b/i.test(t)) s.ACCOUNT_LOGIN_HELP += 18;

  // ── CHANGE_PAYMENT_METHOD ────────────────────────────────────────────────────
  if (/\b(change\s+(my\s+)?payment\s+method|switch\s+(to\s+)?payment|pay\s+with\s+(card|visa|mastercard|telecel|at\s+money)\s+instead|use\s+(different|another)\s+payment)\b/i.test(t)) s.CHANGE_PAYMENT_METHOD += 20;

  // ── EMERGENCY_DELIVERY ────────────────────────────────────────────────────────
  if (/\b(urgent(ly)?|emergency|asap|as\s+soon\s+as\s+possible|right\s+now|immediately|very\s+urgent|need\s+it\s+now|deliver\s+now)\b/i.test(t)) s.EMERGENCY_DELIVERY += 18;
  if (/\b(urgent\s+delivery|emergency\s+delivery|express\s+order|deliver\s+immediately|send\s+now)\b/i.test(t)) s.EMERGENCY_DELIVERY += 22;

  // ── DRIVER_CONTACT ────────────────────────────────────────────────────────────
  if (/\b(where\s+is\s+(my\s+)?driver|contact\s+(my\s+)?driver|driver.?s\s+number|driver\s+phone|call\s+the\s+driver|the\s+driver\s+(isn.?t|is\s+not)|driver\s+location)\b/i.test(t)) s.DRIVER_CONTACT += 22;
  if (/\b(delivery\s+(guy|man|person|agent)\b.{0,20}(phone|number|contact|where))\b/i.test(t)) s.DRIVER_CONTACT += 18;

  // ── ORDER_ETA ─────────────────────────────────────────────────────────────────
  if (/\b(when\s+will\s+(my\s+order|it)\s+arrive|estimated\s+(delivery\s+)?time|eta|arrival\s+time|how\s+long\s+until\s+(my\s+order|delivery)|time\s+of\s+delivery)\b/i.test(t)) s.ORDER_ETA += 20;
  if (/\b(delivery\s+eta|expected\s+delivery|when\s+will\s+you\s+deliver)\b/i.test(t)) s.ORDER_ETA += 18;

  // ── MINIMUM_ORDER_INQUIRY ─────────────────────────────────────────────────────
  if (/\b(minimum\s+order|min\s+order|can\s+i\s+order\s+(just|only)\s+(one|1)|least\s+i\s+can\s+order|smallest\s+order)\b/i.test(t)) s.MINIMUM_ORDER_INQUIRY += 20;
  if (/\b(do\s+you\s+have\s+a\s+minimum|minimum\s+purchase|order\s+minimum)\b/i.test(t)) s.MINIMUM_ORDER_INQUIRY += 18;

  // ── MULTIPLE_DELIVERY_ADDRESSES ───────────────────────────────────────────────
  if (/\b(two\s+(different\s+)?address|multiple\s+(delivery\s+)?address|split\s+(my\s+)?order|deliver\s+to\s+(two|2|both|different)\s+(locations?|address|places?))\b/i.test(t)) s.MULTIPLE_DELIVERY_ADDRESSES += 22;
  if (/\b(send\s+to\s+(two|different)\s+people|deliver\s+half\s+to)\b/i.test(t)) s.MULTIPLE_DELIVERY_ADDRESSES += 18;

  // ── CORPORATE_ACCOUNT ─────────────────────────────────────────────────────────
  if (/\b(corporate\s+account|business\s+account|company\s+(order|account)|office\s+water\s+(supply|delivery)|institutional\s+order|school\s+water\s+supply|hotel\s+order)\b/i.test(t)) s.CORPORATE_ACCOUNT += 22;
  if (/\b(we\s+are\s+(a\s+)?(company|business|office)|buying\s+for\s+(my\s+)?(office|company|school|hotel))\b/i.test(t)) s.CORPORATE_ACCOUNT += 16;

  // ── GIFT_ORDER ────────────────────────────────────────────────────────────────
  if (/\b(gift|send\s+(water|it)\s+(as\s+a\s+gift|to\s+someone)|order\s+for\s+someone\s+else|gift\s+delivery|send\s+to\s+(my\s+)?(friend|family|wife|husband|mother|father))\b/i.test(t)) s.GIFT_ORDER += 20;
  if (/\b(birthday\s+gift|gift\s+wrap|surprise\s+delivery|deliver\s+to\s+someone)\b/i.test(t)) s.GIFT_ORDER += 18;

  // ── REFUND_REQUEST ────────────────────────────────────────────────────────────
  if (/\b(i\s+want\s+(a\s+)?refund|refund\s+my\s+(money|payment|order)|give\s+me\s+(my\s+)?money\s+back|i\s+need\s+(a\s+)?refund|request\s+(a\s+)?refund)\b/i.test(t)) s.REFUND_REQUEST += 24;
  if (/\b(money\s+back|chargeback|reverse\s+(payment|charge))\b/i.test(t)) s.REFUND_REQUEST += 18;

  // ── PRODUCT_COMPLAINT ─────────────────────────────────────────────────────────
  if (/\b(my\s+(water\s+is|order\s+is|bottles?\s+(are|is))\s+(damaged|broken|leaking|wrong|bad|expired)|damaged\s+(water|bottle|order)|leaking\s+bottle|wrong\s+(product|brand|order)|poor\s+quality)\b/i.test(t)) s.PRODUCT_COMPLAINT += 22;
  if (/\b(i\s+received\s+the\s+wrong|not\s+what\s+i\s+ordered|bad\s+experience|terrible\s+service|complaint|make\s+a\s+complaint)\b/i.test(t)) s.PRODUCT_COMPLAINT += 18;

  // ── SOCIAL_MEDIA_INQUIRY ─────────────────────────────────────────────────────
  if (/\b(instagram|facebook|twitter|tiktok|social\s+media|follow\s+you|your\s+(page|handle|account)|find\s+you\s+on)\b/i.test(t)) s.SOCIAL_MEDIA_INQUIRY += 20;
  if (/\b(@kays|kays\s+packs\s+(ig|fb|page)|your\s+(ig|instagram)\s+handle)\b/i.test(t)) s.SOCIAL_MEDIA_INQUIRY += 18;

  // ── SAVED_ADDRESSES ───────────────────────────────────────────────────────────
  if (/\b(my\s+saved\s+address|saved\s+(delivery\s+)?address(es)?|my\s+address(es)?|manage\s+(my\s+)?address|delivery\s+address\s+saved|show\s+my\s+addresses?)\b/i.test(t)) s.SAVED_ADDRESSES += 20;

  // ── NEARBY_PICKUP ─────────────────────────────────────────────────────────────
  if (/\b(pick\s*up|self.?collection|come\s+(to\s+)?pick|collect\s+myself|i.?ll\s+come\s+pick|warehouse\s+pickup|can\s+i\s+come\s+collect)\b/i.test(t)) s.NEARBY_PICKUP += 20;
  if (/\b(pick\s+up\s+point|collection\s+point|where\s+(can\s+i\s+)?(collect|pick)\s+(my\s+)?order)\b/i.test(t)) s.NEARBY_PICKUP += 18;

  return (Object.entries(s) as Array<[ChatIntent, number]>)
    .map(([intent, score]) => ({ intent, score }))
    .sort((a, b) => b.score - a.score);
}

// ─── Entity Extraction ────────────────────────────────────────────────────────

const WORD_TO_NUMBER: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  dozen: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  twentyfour: 24,
  "twenty-four": 24,
  thirty: 30,
  forty: 40,
  fifty: 50,
  hundred: 100,
};

/** Main entity extraction with conversation context fallback */
export function extractEntities(
  text: string,
  messageHistory?: Array<{ role: string; content: string }>
): ExtractedEntities {
  const entities: ExtractedEntities = {};
  const t = text.toLowerCase();

  // ── Brand ──────────────────────────────────────────────────────────────────
  const foundBrands: Array<{ brand: string; slug: string }> = [];
  for (const b of BRAND_PATTERNS) {
    if (b.pattern.test(text)) {
      foundBrands.push({ brand: b.brand, slug: b.slug });
    }
  }
  if (foundBrands.length >= 1) {
    entities.brand = foundBrands[0].brand;
    entities.brandSlug = foundBrands[0].slug;
  }
  if (foundBrands.length >= 2) {
    // For compare intents — capture the second brand
    entities.secondBrand = foundBrands[1].brand;
  }

  // ── Bottle size ────────────────────────────────────────────────────────────
  for (const s of SIZE_PATTERNS) {
    if (s.pattern.test(text)) {
      entities.size = s.size;
      break;
    }
  }

  // ── Quantity (Numbers & Words) ─────────────────────────────────────────────
  const qtyPatterns = [
    /\b(\d+)\s*(?:packs?|bottles?|pieces?|units?|cases?|cartons?|x)\b/i,
    /\b(?:packs?|bottles?|pieces?|units?)\s+(?:of\s+)?(\d+)\b/i,
    /\b(?:add|buy|order|want|need|get|give\s+me|send\s+me)\s+(\d+)\b/i,
    /\b(\d+)\s+(?:voltic|voltec|bel.?aqua|belaqua|verna|awake|slem|perla)/i,
    /\bprice\s+of\s+(\d+)\b/i,
    /\b(\d+)\s+more\b/i,
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

  // 2. Check word numbers (e.g. "two packs", "a dozen Voltic", "five cases")
  if (!entities.quantity) {
    const wordMatch = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozen|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|twenty-four|thirty|forty|fifty|hundred)\s*(?:packs?|bottles?|units?|cases?|cartons?)?/i);
    if (wordMatch && WORD_TO_NUMBER[wordMatch[1].toLowerCase()]) {
      if (/\b(price|cost|how\s+much|buy|add|want|need|packs?|bottles?)\b/i.test(text)) {
        entities.quantity = WORD_TO_NUMBER[wordMatch[1].toLowerCase()];
      }
    }
  }

  // Default quantity to 1 if user says "a pack" / "a bottle"
  if (!entities.quantity && /\b(a\s+pack|a\s+bottle|one\s+pack)\b/i.test(text)) {
    entities.quantity = 1;
  }

  // ── Budget (in Cedis / GHS) ────────────────────────────────────────────────
  const budgetMatch =
    text.match(/\b(?:budget\s+of|have|with|within|under|around)\s+(?:ghc|ghs|gh₵)?\s*(\d+(?:\.\d+)?)\s*(?:cedis|cedi|ghc|ghs|gh₵)?\b/i) ||
    text.match(/\b(\d+(?:\.\d+)?)\s*(?:cedis|cedi|ghc|ghs|gh₵)\s*(?:budget|to\s+spend)?\b/i);

  if (budgetMatch) {
    const bNum = parseFloat(budgetMatch[1]);
    if (!isNaN(bNum) && bNum > 0) {
      entities.budget = bNum;
    }
  }

  // ── Target Theme ───────────────────────────────────────────────────────────
  if (/\b(light\s+mode|light\s+theme|day\s+mode)\b/i.test(t)) {
    entities.targetTheme = "light";
  } else if (/\b(dark\s+mode|dark\s+theme|night\s+mode)\b/i.test(t)) {
    entities.targetTheme = "dark";
  } else if (/\b(toggle\s+theme|switch\s+theme|change\s+theme)\b/i.test(t)) {
    entities.targetTheme = "toggle";
  }

  // ── And Checkout Flag ──────────────────────────────────────────────────────
  if (/\b(and|then)?\s*(checkout|proceed\s+to\s+checkout|pay|proceed\s+to\s+pay)\b/i.test(t)) {
    entities.andCheckout = true;
  }

  // ── Order number (supports both KP- and ORD- prefixes) ────────────────────
  const orderMatch =
    text.match(/\b(KP|ORD)[-\s]?\d{4}[-\s]?\d{3,}/i) ||
    text.match(/\b(KP|ORD)\d{6,}/i);
  if (orderMatch) {
    entities.orderNumber = orderMatch[0].toUpperCase().replace(/\s+/g, "-");
  }

  // ── Ghana region & City ────────────────────────────────────────────────────
  for (const r of REGION_CITY_PATTERNS) {
    if (r.pattern.test(text)) {
      entities.region = r.region;
      if (r.city) entities.city = r.city;
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

  // ── Second product match for compare intents ────────────────────────────────
  if (entities.secondBrand && entities.secondBrand !== entities.brand) {
    const secondProduct = findBestProductMatch(text, entities.secondBrand, entities.size);
    if (secondProduct) {
      entities.secondProduct = secondProduct;
    }
  }

  // ── Context fallback: check recent messages for product mention ────────────
  if (!entities.matchedProduct && messageHistory && messageHistory.length > 0) {
    const recentMessages = messageHistory.slice(-8).reverse();
    for (const msg of recentMessages) {
      if (!msg.content) continue;
      const historyBrand = BRAND_PATTERNS.find((b) => b.pattern.test(msg.content));
      const historySize = SIZE_PATTERNS.find((s) => s.pattern.test(msg.content));
      const fallbackMatch = findBestProductMatch(
        msg.content,
        historyBrand?.brand,
        historySize?.size
      );
      if (fallbackMatch) {
        entities.matchedProduct = fallbackMatch;
        entities.productId = fallbackMatch.id;
        if (!entities.brand) {
          entities.brand = fallbackMatch.brand;
          entities.brandSlug = fallbackMatch.brandSlug;
        }
        if (!entities.productIdentifier) {
          entities.productIdentifier = fallbackMatch.name;
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
    if (t.includes(pName)) score += 25;

    // Brand match (including synonyms)
    if (brand && (pBrand === brand.toLowerCase() || p.brandSlug === brand.toLowerCase())) {
      score += 12;
    } else {
      for (const b of BRAND_PATTERNS) {
        if (b.pattern.test(t) && b.brand.toLowerCase() === pBrand) {
          score += 10;
        }
      }
    }

    // Size match
    if (size) {
      const normalizedSize = size.toLowerCase().replace(/\s/g, "");
      if (pSize === normalizedSize) score += 10;
      else if (pPack.includes(normalizedSize)) score += 8;
    } else {
      for (const sp of SIZE_PATTERNS) {
        if (sp.pattern.test(t)) {
          const norm = sp.size.toLowerCase().replace(/\s/g, "");
          if (pSize === norm || pPack.includes(norm)) {
            score += 8;
          }
        }
      }
    }

    // Bottle count in text e.g. "x15", "15 bottles"
    const countMatch = t.match(/\bx?\s*(\d{1,2})\s*(?:bottles?|pcs?)?\b/);
    if (countMatch && p.bottlesPerPack === parseInt(countMatch[1])) score += 4;

    // dispenser/jar/pocket keyword shortcuts
    if (/dispenser|jar/i.test(t) && p.category === "Dispensers") score += 8;
    if (/pocket/i.test(t) && p.bottleSize.includes("350")) score += 8;

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

  const totalScore = scored.reduce((acc, s) => acc + s.score, 0);
  const confidence = totalScore > 0 ? Math.min(1, top.score / (totalScore || 1)) : 0;

  const intent: ChatIntent = top.score > 0 ? top.intent : "UNKNOWN";
  const entities = extractEntities(text, messageHistory);

  return {
    intent,
    confidence,
    entities,
    rawText: text,
  };
}
