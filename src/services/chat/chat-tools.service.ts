import { connectDB } from "@/lib/db/mongoose";
import Product from "@/models/Product";
import ProductVariant from "@/models/ProductVariant";
import Brand from "@/models/Brand";
import Category from "@/models/Category";
import Order from "@/models/Order";
import Settings from "@/models/Settings";
import { STORE_PRODUCTS, StoreProduct, STORE_PHONE_DISPLAY, STORE_WHATSAPP_LINK } from "@/lib/constants";
import { ensureStoreProductsSynced } from "@/services/admin/product.service";
import mongoose from "mongoose";

export interface ChatSessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string;
}

export interface ClientAction {
  type:
    | "ADD_TO_CART"
    | "REMOVE_FROM_CART"
    | "UPDATE_QUANTITY"
    | "CLEAR_CART"
    | "NAVIGATE_TO_CHECKOUT"
    | "NAVIGATE_TO_REGISTER"
    | "NAVIGATE_TO_SHOP"
    | "NAVIGATE"
    | "TOGGLE_DARK_MODE"
    | "SET_THEME"
    | "OPEN_WHATSAPP"
    | "VIEW_PRODUCT";
  payload?: any;
}

export interface ToolExecutionResult {
  toolName: string;
  result: any;
  clientAction?: ClientAction;
  suggestedProducts?: StoreProduct[];
}

/**
 * Execute a backend tool called by Gemini or Local NLP Engine
 */
export async function executeChatbotTool(
  name: string,
  args: Record<string, any>,
  context: {
    sessionUser?: ChatSessionUser;
    clientCartItems?: Array<{ productId: string; quantity: number }>;
  }
): Promise<ToolExecutionResult> {
  // Ensure DB connection is safe with catalog synced
  try {
    await connectDB();
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      await ensureStoreProductsSynced(false);
    }
  } catch (err) {
    console.warn("[ChatTools] DB connection/sync warning:", err);
  }

  switch (name) {
    case "searchProducts":
      return handleSearchProducts(args as any);
    case "getProduct":
      return handleGetProduct(args as any);
    case "getProductsByCategory":
      return handleGetProductsByCategory(args as any);
    case "checkStock":
      return handleCheckStock(args as any);
    case "calculatePrice":
      return handleCalculatePrice(args as any);
    case "getBudgetRecommendations":
      return handleGetBudgetRecommendations(args as any);
    case "getCart":
      return handleGetCart(context);
    case "addToCart":
      return handleAddToCart(args as any, context);
    case "removeFromCart":
      return handleRemoveFromCart(args as any);
    case "updateCartQuantity":
      return handleUpdateCartQuantity(args as any);
    case "getCustomerOrders":
      return handleGetCustomerOrders(args as any, context.sessionUser);
    case "getOrderStatus":
      return handleGetOrderStatus(args as any, context.sessionUser);
    case "getDeliveryInformation":
      return handleGetDeliveryInformation(args as any);
    case "getStoreInfo":
      return handleGetStoreInfo();
    case "guideToCheckout":
      return handleGuideToCheckout(context);
    case "toggleThemePreference":
      return handleToggleThemePreference(args as any);
    case "contactHumanSupport":
      return handleContactHumanSupport();
    case "getWaterQualityInfo":
      return handleGetWaterQualityInfo();
    case "getWhyBuyFromUsInfo":
      return handleGetWhyBuyFromUsInfo();
    case "getAccountCreationGuide":
      return handleGetAccountCreationGuide();
    case "getWaterHealthRecommendations":
      return handleGetWaterHealthRecommendations(args as any);
    default:
      return {
        toolName: name,
        result: { error: `Tool ${name} is not implemented.` },
      };
  }
}

// ─── TOOL IMPLEMENTATIONS ───────────────────────────────────────────────────

async function handleSearchProducts(args: {
  query?: string;
  category?: string;
  brand?: string;
  maxPrice?: number;
  inStockOnly?: boolean;
}): Promise<ToolExecutionResult> {
  const queryStr = (args.query || "").trim().toLowerCase();
  const catFilter = (args.category || "").trim().toLowerCase();
  const brandFilter = (args.brand || "").trim().toLowerCase();
  const maxPrice = typeof args.maxPrice === "number" ? args.maxPrice : undefined;
  const inStockOnly = !!args.inStockOnly;

  let results = STORE_PRODUCTS.filter((p) => {
    if (inStockOnly && !p.inStock) return false;
    if (maxPrice !== undefined && p.price > maxPrice) return false;

    if (catFilter && !p.category.toLowerCase().includes(catFilter)) {
      return false;
    }

    if (brandFilter && !p.brand.toLowerCase().includes(brandFilter) && !p.brandSlug.includes(brandFilter)) {
      return false;
    }

    if (queryStr) {
      const matchName = p.name.toLowerCase().includes(queryStr);
      const matchBrand = p.brand.toLowerCase().includes(queryStr);
      const matchPack = p.packSize.toLowerCase().includes(queryStr);
      const matchBottle = p.bottleSize.toLowerCase().includes(queryStr);
      const matchDesc = p.description.toLowerCase().includes(queryStr);
      const matchCat = p.category.toLowerCase().includes(queryStr);
      if (!matchName && !matchBrand && !matchPack && !matchBottle && !matchDesc && !matchCat) {
        return false;
      }
    }

    return true;
  });

  // Query live DB for up-to-date variant prices & stock
  try {
    const dbVariants = await ProductVariant.find({ isAvailable: true }).populate("productId");
    const variantMap = new Map<string, any>();
    for (const v of dbVariants) {
      if (v.productId && (v.productId as any).slug) {
        variantMap.set((v.productId as any).slug, v);
      }
    }

    results = results.map((p) => {
      const v = variantMap.get(p.slug);
      if (v) {
        const liveStock = Math.max(0, v.stockQuantity - (v.reservedQuantity || 0));
        return {
          ...p,
          price: v.price || p.price,
          stock: liveStock,
          inStock: liveStock > 0,
        };
      }
      return p;
    });
  } catch (err) {
    console.warn("[ChatTools] DB variant check failed, falling back to catalog:", err);
  }

  // Sort: in-stock first, then popular/bestseller
  results.sort((a, b) => {
    if (a.inStock && !b.inStock) return -1;
    if (!a.inStock && b.inStock) return 1;
    return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
  });

  const formatted = results.slice(0, 8).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    category: p.category,
    packSize: p.packSize,
    bottleSize: p.bottleSize,
    priceInGHS: p.price,
    stockAvailable: p.stock,
    inStock: p.inStock,
    description: p.description,
  }));

  return {
    toolName: "searchProducts",
    result: {
      totalFound: results.length,
      products: formatted,
    },
    suggestedProducts: results.slice(0, 4),
  };
}

async function handleGetProduct(args: {
  slug?: string;
  productId?: string;
  name?: string;
}): Promise<ToolExecutionResult> {
  const identifier = (args.slug || args.productId || args.name || "").trim().toLowerCase();

  let found = STORE_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === identifier ||
      p.slug.toLowerCase() === identifier ||
      p.name.toLowerCase().includes(identifier)
  );

  if (!found && args.name) {
    const words = args.name.toLowerCase().split(/\s+/).filter(Boolean);
    found = STORE_PRODUCTS.find((p) =>
      words.every((w) => p.name.toLowerCase().includes(w) || p.brand.toLowerCase().includes(w))
    );
  }

  if (!found) {
    return {
      toolName: "getProduct",
      result: { found: false, message: `No water product found matching '${identifier}'.` },
    };
  }

  // Check DB stock
  let liveStock = found.stock;
  let livePrice = found.price;
  try {
    const prodDoc = await Product.findOne({ slug: found.slug });
    if (prodDoc) {
      const variant = await ProductVariant.findOne({ productId: prodDoc._id, isAvailable: true });
      if (variant) {
        liveStock = Math.max(0, variant.stockQuantity - (variant.reservedQuantity || 0));
        livePrice = variant.price;
      }
    }
  } catch {}

  const fullProduct: StoreProduct = {
    ...found,
    price: livePrice,
    stock: liveStock,
    inStock: liveStock > 0,
  };

  return {
    toolName: "getProduct",
    result: {
      found: true,
      product: {
        id: fullProduct.id,
        name: fullProduct.name,
        slug: fullProduct.slug,
        brand: fullProduct.brand,
        category: fullProduct.category,
        packSize: fullProduct.packSize,
        priceInGHS: fullProduct.price,
        stockAvailable: fullProduct.stock,
        inStock: fullProduct.inStock,
        rating: fullProduct.rating,
        reviewCount: fullProduct.reviewCount,
        description: fullProduct.description,
      },
    },
    suggestedProducts: [fullProduct],
  };
}

async function handleGetProductsByCategory(args: { category: string }): Promise<ToolExecutionResult> {
  const cat = (args.category || "").trim().toLowerCase();
  const matched = STORE_PRODUCTS.filter((p) => p.category.toLowerCase().includes(cat));

  return {
    toolName: "getProductsByCategory",
    result: {
      category: args.category,
      count: matched.length,
      products: matched.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        packSize: p.packSize,
        priceInGHS: p.price,
        inStock: p.inStock,
      })),
    },
    suggestedProducts: matched.slice(0, 4),
  };
}

async function handleCheckStock(args: {
  productIdentifier: string;
  requestedQuantity?: number;
}): Promise<ToolExecutionResult> {
  const ident = (args.productIdentifier || "").trim().toLowerCase();
  const qty = Math.max(1, args.requestedQuantity || 1);

  const product = STORE_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === ident ||
      p.slug.toLowerCase() === ident ||
      p.name.toLowerCase().includes(ident) ||
      p.brand.toLowerCase().includes(ident) ||
      p.brandSlug.toLowerCase() === ident
  );

  if (!product) {
    return {
      toolName: "checkStock",
      result: {
        found: false,
        message: `Product '${args.productIdentifier}' was not found in our catalog.`,
      },
    };
  }

  let liveStock = product.stock;
  try {
    const prodDoc = await Product.findOne({ slug: product.slug });
    if (prodDoc) {
      const variant = await ProductVariant.findOne({ productId: prodDoc._id });
      if (variant) {
        liveStock = Math.max(0, variant.stockQuantity - (variant.reservedQuantity || 0));
      }
    }
  } catch {}

  const canFulfill = liveStock >= qty;

  return {
    toolName: "checkStock",
    result: {
      found: true,
      productName: product.name,
      requestedQuantity: qty,
      availableStock: liveStock,
      inStock: liveStock > 0,
      canFulfill,
      message: canFulfill
        ? `Yes! We have ${liveStock} packs of ${product.name} in stock (you requested ${qty}).`
        : liveStock > 0
        ? `We only have ${liveStock} packs remaining in stock for ${product.name}, which is less than the requested ${qty}.`
        : `Sorry, ${product.name} is currently out of stock.`,
    },
    suggestedProducts: [product],
  };
}

// ─── Free Delivery Config Helper ─────────────────────────────────────────────

async function getStoreFreeDeliveryConfig(): Promise<{ enabled: boolean; threshold: number | null }> {
  try {
    await connectDB();
    const settings = await Settings.findOne();
    const storeLoc = settings?.storeLocation;
    const enabled =
      storeLoc?.freeDeliveryEnabled !== false &&
      storeLoc?.freeDeliveryThreshold != null &&
      Number(storeLoc.freeDeliveryThreshold) > 0;
    return {
      enabled,
      threshold: enabled ? Number(storeLoc.freeDeliveryThreshold) : null,
    };
  } catch {
    return { enabled: true, threshold: 350 };
  }
}

// ─── Price Calculator Tool ────────────────────────────────────────────────────

async function handleCalculatePrice(args: {
  productIdentifier: string;
  quantity?: number;
}): Promise<ToolExecutionResult> {
  const ident = (args.productIdentifier || "").trim().toLowerCase();
  const qty = Math.max(1, args.quantity || 1);

  let product = STORE_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === ident ||
      p.slug.toLowerCase() === ident ||
      p.name.toLowerCase().includes(ident)
  );

  if (!product) {
    const words = ident.split(/\s+/).filter(Boolean);
    product = STORE_PRODUCTS.find((p) =>
      words.every((w) => p.name.toLowerCase().includes(w) || p.brand.toLowerCase().includes(w))
    );
  }

  if (!product) {
    return {
      toolName: "calculatePrice",
      result: {
        found: false,
        message: `Could not identify product '${args.productIdentifier}' for price calculation.`,
      },
    };
  }

  const unitPrice = product.price;
  const totalPrice = unitPrice * qty;
  const freeConfig = await getStoreFreeDeliveryConfig();
  const isFreeDelivery =
    freeConfig.enabled && freeConfig.threshold != null && totalPrice >= freeConfig.threshold;

  return {
    toolName: "calculatePrice",
    result: {
      found: true,
      productName: product.name,
      packSize: product.packSize,
      quantity: qty,
      unitPriceInGHS: unitPrice,
      totalPriceInGHS: totalPrice,
      isFreeDelivery,
      freeDeliveryThresholdInGHS: freeConfig.enabled ? freeConfig.threshold : null,
      product,
    },
    suggestedProducts: [product],
  };
}

// ─── Budget Recommendation Tool ───────────────────────────────────────────────

async function handleGetBudgetRecommendations(args: {
  budget: number;
}): Promise<ToolExecutionResult> {
  const budget = Math.max(0, Number(args.budget) || 50);

  const affordable = STORE_PRODUCTS.filter((p) => p.price <= budget && p.inStock);
  affordable.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0) || b.price - a.price);

  return {
    toolName: "getBudgetRecommendations",
    result: {
      budgetInGHS: budget,
      optionsFound: affordable.length,
      products: affordable.map((p) => ({
        id: p.id,
        name: p.name,
        packSize: p.packSize,
        priceInGHS: p.price,
        inStock: p.inStock,
      })),
    },
    suggestedProducts: affordable.slice(0, 4),
  };
}

async function handleGetCart(context: {
  clientCartItems?: Array<{ productId: string; quantity: number }>;
}): Promise<ToolExecutionResult> {
  const items = context.clientCartItems || [];

  const mappedItems = items
    .map((item) => {
      const p = STORE_PRODUCTS.find((prod) => prod.id === item.productId || prod.slug === item.productId);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        packSize: p.packSize,
        priceInGHS: p.price,
        quantity: item.quantity,
        totalInGHS: p.price * item.quantity,
      };
    })
    .filter(Boolean);

  const subtotal = mappedItems.reduce((acc, item: any) => acc + item.totalInGHS, 0);
  const itemCount = mappedItems.reduce((acc, item: any) => acc + item.quantity, 0);
  const freeConfig = await getStoreFreeDeliveryConfig();
  const isFreeDelivery =
    freeConfig.enabled &&
    freeConfig.threshold != null &&
    subtotal >= freeConfig.threshold &&
    itemCount > 0;
  const deliveryFee = itemCount > 0 ? (isFreeDelivery ? 0 : 15) : 0;
  const total = subtotal + deliveryFee;

  return {
    toolName: "getCart",
    result: {
      itemCount,
      subtotalInGHS: subtotal,
      estimatedDeliveryFeeInGHS: deliveryFee,
      totalInGHS: total,
      items: mappedItems,
      isFreeDelivery,
      freeDeliveryThresholdInGHS: freeConfig.enabled ? freeConfig.threshold : null,
    },
  };
}

async function handleAddToCart(
  args: { productIdentifier: string; quantity?: number; andCheckout?: boolean },
  context: { clientCartItems?: Array<{ productId: string; quantity: number }> }
): Promise<ToolExecutionResult> {
  const ident = (args.productIdentifier || "").trim().toLowerCase();
  const quantity = Math.max(1, Math.round(args.quantity || 1));
  const andCheckout = !!args.andCheckout;

  let product = STORE_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === ident ||
      p.slug.toLowerCase() === ident ||
      p.name.toLowerCase().includes(ident)
  );

  if (!product) {
    const words = ident.split(/\s+/).filter(Boolean);
    product = STORE_PRODUCTS.find((p) =>
      words.every((w) => p.name.toLowerCase().includes(w) || p.brand.toLowerCase().includes(w))
    );
  }

  if (!product) {
    return {
      toolName: "addToCart",
      result: {
        success: false,
        message: `Could not find a water product matching '${args.productIdentifier}'. Please specify brand and size (e.g. 'Voltic 500ml').`,
      },
    };
  }

  let availableStock = product.stock;
  try {
    const prodDoc = await Product.findOne({ slug: product.slug });
    if (prodDoc) {
      const variant = await ProductVariant.findOne({ productId: prodDoc._id });
      if (variant) {
        availableStock = Math.max(0, variant.stockQuantity - (variant.reservedQuantity || 0));
      }
    }
  } catch {}

  if (availableStock <= 0) {
    return {
      toolName: "addToCart",
      result: {
        success: false,
        message: `Sorry, ${product.name} is currently out of stock.`,
      },
      suggestedProducts: [product],
    };
  }

  const finalQty = Math.min(quantity, availableStock);

  return {
    toolName: "addToCart",
    result: {
      success: true,
      addedProduct: {
        id: product.id,
        name: product.name,
        packSize: product.packSize,
        priceInGHS: product.price,
        quantityAdded: finalQty,
        totalItemPrice: product.price * finalQty,
      },
      andCheckout,
      message: `Successfully added ${finalQty} ${finalQty === 1 ? "pack" : "packs"} of ${product.name} (GH₵${product.price * finalQty}) to your cart!`,
    },
    clientAction: {
      type: "ADD_TO_CART",
      payload: {
        product,
        quantity: finalQty,
        andCheckout,
      },
    },
    suggestedProducts: [product],
  };
}

async function handleRemoveFromCart(args: { productIdentifier: string }): Promise<ToolExecutionResult> {
  const ident = (args.productIdentifier || "").trim().toLowerCase();
  const product = STORE_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === ident ||
      p.slug.toLowerCase() === ident ||
      p.name.toLowerCase().includes(ident)
  );

  const targetId = product ? product.id : args.productIdentifier;

  return {
    toolName: "removeFromCart",
    result: {
      success: true,
      message: `Removed ${product ? product.name : args.productIdentifier} from your cart.`,
    },
    clientAction: {
      type: "REMOVE_FROM_CART",
      payload: {
        productId: targetId,
      },
    },
  };
}

async function handleUpdateCartQuantity(args: {
  productIdentifier: string;
  quantity: number;
}): Promise<ToolExecutionResult> {
  const ident = (args.productIdentifier || "").trim().toLowerCase();
  const qty = Math.max(0, Math.round(args.quantity));

  const product = STORE_PRODUCTS.find(
    (p) =>
      p.id.toLowerCase() === ident ||
      p.slug.toLowerCase() === ident ||
      p.name.toLowerCase().includes(ident)
  );

  const targetId = product ? product.id : args.productIdentifier;

  return {
    toolName: "updateCartQuantity",
    result: {
      success: true,
      message:
        qty === 0
          ? `Removed ${product ? product.name : "item"} from your cart.`
          : `Updated quantity of ${product ? product.name : "item"} to ${qty}.`,
    },
    clientAction: {
      type: "UPDATE_QUANTITY",
      payload: {
        productId: targetId,
        quantity: qty,
      },
    },
  };
}

async function handleGetCustomerOrders(
  args: { limit?: number },
  sessionUser?: ChatSessionUser
): Promise<ToolExecutionResult> {
  if (!sessionUser || !sessionUser.id) {
    return {
      toolName: "getCustomerOrders",
      result: {
        authenticated: false,
        message: "Customer is currently a guest. To view personal orders and tracking, please log into your Kay's Packs account.",
      },
    };
  }

  const limit = Math.min(10, Math.max(1, args.limit || 5));

  const userConditions: any[] = [];
  if (mongoose.Types.ObjectId.isValid(sessionUser.id)) {
    userConditions.push({ customerId: new mongoose.Types.ObjectId(sessionUser.id) });
  }
  userConditions.push({ customerId: sessionUser.id });

  const unlinkedConditions: any[] = [];
  const userEmail = sessionUser.email?.trim();
  if (userEmail && !userEmail.toLowerCase().endsWith("@khadyswater.com")) {
    const escapedEmail = userEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    unlinkedConditions.push({
      "guestInformation.email": { $regex: new RegExp(`^${escapedEmail}$`, "i") },
    });
  }

  const rawPhone = sessionUser.phone?.trim();
  const cleanPhone = rawPhone ? rawPhone.replace(/[\s-]/g, "") : "";
  if (cleanPhone && cleanPhone.length >= 9) {
    unlinkedConditions.push({ "guestInformation.phone": rawPhone });
    unlinkedConditions.push({ "guestInformation.phone": cleanPhone });
    const last9 = cleanPhone.slice(-9);
    unlinkedConditions.push({ "guestInformation.phone": `0${last9}` });
    unlinkedConditions.push({ "guestInformation.phone": `+233${last9}` });
    unlinkedConditions.push({ "guestInformation.phone": `233${last9}` });
  }

  if (unlinkedConditions.length > 0) {
    userConditions.push({
      customerId: { $in: [null, undefined] },
      $or: unlinkedConditions,
    });
  }

  const orders = await Order.find({ $or: userConditions })
    .sort({ createdAt: -1 })
    .limit(limit);

  if (orders.length === 0) {
    return {
      toolName: "getCustomerOrders",
      result: {
        authenticated: true,
        orderCount: 0,
        message: "You have not placed any orders yet. Start by browsing our fresh water packs!",
      },
    };
  }

  const formatted = orders.map((o) => ({
    orderNumber: o.orderNumber,
    date: new Date(o.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    status: o.status,
    paymentStatus: o.deliveryPaymentStatus || "PENDING",
    deliveryStatus: o.status || "PENDING",
    totalInGHS: o.total || 0,
    itemSummary: (o.items || []).map((i: any) => `${i.quantity}x ${i.productName} (${i.variantName})`).join(", "),
    deliveryAddress: o.deliveryAddress ? `${o.deliveryAddress.city}, ${o.deliveryAddress.region}` : "N/A",
  }));

  return {
    toolName: "getCustomerOrders",
    result: {
      authenticated: true,
      orderCount: orders.length,
      orders: formatted,
    },
  };
}

async function handleGetOrderStatus(
  args: { orderNumber: string },
  sessionUser?: ChatSessionUser
): Promise<ToolExecutionResult> {
  const query = (args.orderNumber || "").trim().toUpperCase();

  let order = await Order.findOne({ orderNumber: query });
  if (!order && mongoose.Types.ObjectId.isValid(args.orderNumber)) {
    order = await Order.findById(args.orderNumber);
  }

  if (!order) {
    return {
      toolName: "getOrderStatus",
      result: {
        found: false,
        message: `Order '${args.orderNumber}' was not found. Please check the order number format (e.g. KP-2026-XXXX).`,
      },
    };
  }

  const isAdmin = sessionUser?.role === "ADMIN" || sessionUser?.role === "SUPER_ADMIN";
  if (!isAdmin) {
    let isOwner = false;
    if (order.customerId) {
      isOwner = !!(sessionUser?.id && order.customerId.toString() === sessionUser.id);
    } else {
      const userEmail = sessionUser?.email?.trim();
      const hasValidEmail = userEmail && !userEmail.toLowerCase().endsWith("@khadyswater.com");
      const userPhone = sessionUser?.phone?.trim()?.replace(/[\s-]/g, "");
      const orderPhone = order.guestInformation?.phone?.trim()?.replace(/[\s-]/g, "");

      const emailMatches = Boolean(hasValidEmail && order.guestInformation?.email?.toLowerCase() === userEmail.toLowerCase());
      const phoneMatches = Boolean(userPhone && userPhone.length >= 9 && orderPhone && (userPhone === orderPhone || userPhone.slice(-9) === orderPhone.slice(-9)));

      isOwner = emailMatches || phoneMatches;
    }

    if (!isOwner) {
      return {
        toolName: "getOrderStatus",
        result: {
          found: false,
          message: "You are not authorized to view this order.",
        },
      };
    }
  }

  return {
    toolName: "getOrderStatus",
    result: {
      found: true,
      orderNumber: order.orderNumber,
      date: new Date(order.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      orderStatus: order.status,
      paymentStatus: (order as any).paymentStatus || order.deliveryPaymentStatus || "PENDING",
      deliveryStatus: (order as any).deliveryStatus || order.status || "PENDING",
      items: order.items.map((i: any) => ({
        product: i.productName,
        pack: i.variantName,
        quantity: i.quantity,
        priceInGHS: i.totalPrice,
      })),
      totalInGHS: order.total || 0,
      deliveryFeeInGHS: order.deliveryFee || order.estimatedDeliveryFee || 0,
      deliveryLocation: order.deliveryAddress
        ? `${order.deliveryAddress.area ? order.deliveryAddress.area + ", " : ""}${order.deliveryAddress.city}, ${order.deliveryAddress.region}`
        : "Standard Delivery",
      driverInfo: order.courierName
        ? { name: order.courierName, phone: order.courierPhone || "" }
        : null,
    },
  };
}

async function handleGetDeliveryInformation(args: { region?: string; city?: string }): Promise<ToolExecutionResult> {
  const targetCity = (args.city || "").trim().toLowerCase();
  const targetRegion = (args.region || "").trim().toLowerCase();

  const rates: Record<string, number> = {
    "greater accra": 15,
    ashanti: 20,
    western: 20,
    central: 18,
    eastern: 18,
    volta: 22,
    northern: 25,
    "upper east": 30,
    "upper west": 30,
    "bono east": 22,
    bono: 22,
    ahafo: 22,
    "western north": 25,
    oti: 22,
    "north east": 30,
    savannah: 28,
  };

  let selectedRate = 15;
  let resolvedRegion = "Greater Accra";
  let resolvedCity = args.city || undefined;

  if (targetCity === "tamale" || targetRegion.includes("northern")) {
    selectedRate = 25;
    resolvedRegion = "Northern";
    resolvedCity = "Tamale";
  } else if (targetCity === "kumasi" || targetRegion.includes("ashanti")) {
    selectedRate = 20;
    resolvedRegion = "Ashanti";
    resolvedCity = "Kumasi";
  } else if (targetCity === "takoradi" || targetRegion.includes("western")) {
    selectedRate = 20;
    resolvedRegion = "Western";
    resolvedCity = "Takoradi";
  } else if (targetRegion) {
    selectedRate = rates[targetRegion] || 25;
    resolvedRegion = args.region || "Greater Accra";
  }

  const freeConfig = await getStoreFreeDeliveryConfig();

  return {
    toolName: "getDeliveryInformation",
    result: {
      standardGreaterAccraFeeInGHS: 15,
      regionalRatesInGHS: rates,
      queriedRegion: resolvedRegion,
      queriedCity: resolvedCity,
      deliveryFeeForQueriedRegionInGHS: selectedRate,
      freeDeliveryThresholdInGHS: freeConfig.enabled ? freeConfig.threshold : null,
      freeDeliveryEnabled: freeConfig.enabled,
      sameDayDeliveryCutoff: "2:00 PM (for Greater Accra)",
      deliveryTimeframe: {
        greaterAccra: "Same-day if ordered before 2:00 PM; next-morning if ordered after.",
        regionalParcel: "1 - 3 business days via verified station couriers (VIP, OA, Imperial, STC).",
      },
      warehousePickup: "Available at our central Accra hub (free).",
    },
  };
}

function handleGetStoreInfo(): ToolExecutionResult {
  return {
    toolName: "getStoreInfo",
    result: {
      storeName: "Kay's Packs Ghana",
      tagline: "Pure Water Delivered to Your Door",
      phone: STORE_PHONE_DISPLAY,
      whatsappLink: STORE_WHATSAPP_LINK,
      acceptedPaymentMethods: [
        "MTN Mobile Money (MoMo)",
        "Telecel Cash (Vodafone Cash)",
        "AT Money",
        "Visa & Mastercard (via Paystack)",
      ],
      workingHours: "Monday to Saturday: 8:00 AM – 6:00 PM (Sunday: Closed / Emergency delivery only)",
      coverage: "Greater Accra & Nationwide across all 16 regions of Ghana",
    },
  };
}

function handleGuideToCheckout(context: {
  clientCartItems?: Array<{ productId: string; quantity: number }>;
}): ToolExecutionResult {
  const itemCount = (context.clientCartItems || []).reduce((acc, i) => acc + i.quantity, 0);

  return {
    toolName: "guideToCheckout",
    result: {
      cartItemCount: itemCount,
      checkoutUrl: "/checkout",
      cartUrl: "/cart",
      message:
        itemCount > 0
          ? `You have ${itemCount} ${itemCount === 1 ? "pack" : "packs"} in your cart. Proceed to checkout to complete your order.`
          : "Your cart is currently empty. Add your favourite water brands first before checkout!",
    },
    clientAction: {
      type: "NAVIGATE_TO_CHECKOUT",
      payload: {
        url: itemCount > 0 ? "/checkout" : "/shop",
      },
    },
  };
}

function handleToggleThemePreference(args: { mode?: "dark" | "light" | "toggle" }): ToolExecutionResult {
  const targetTheme = args.mode || "toggle";
  return {
    toolName: "toggleThemePreference",
    result: {
      success: true,
      targetTheme,
      message: `Theme switched to ${targetTheme} mode.`,
    },
    clientAction: {
      type: "SET_THEME",
      payload: { theme: targetTheme },
    },
  };
}

function handleContactHumanSupport(): ToolExecutionResult {
  return {
    toolName: "contactHumanSupport",
    result: {
      phone: STORE_PHONE_DISPLAY,
      whatsappLink: STORE_WHATSAPP_LINK,
      hours: "Monday - Saturday: 8:00 AM - 6:00 PM",
      message: `Our manager and support agents are ready to assist you on WhatsApp or via direct phone call.`,
    },
    clientAction: {
      type: "OPEN_WHATSAPP",
      payload: { url: STORE_WHATSAPP_LINK },
    },
  };
}

function handleGetWaterQualityInfo(): ToolExecutionResult {
  return {
    toolName: "getWaterQualityInfo",
    result: {
      fdaCertified: true,
      gsaCertified: true,
      storageConditions: "Clean, temperature-controlled warehouse away from sunlight.",
      seals: "100% factory sealed directly from spring sources.",
      fifoRotation: "Fresh production batches with daily inventory rotation.",
    },
  };
}

function handleGetWhyBuyFromUsInfo(): ToolExecutionResult {
  return {
    toolName: "getWhyBuyFromUsInfo",
    result: {
      points: [
        "100% Genuine & Factory Sealed directly from top bottlers",
        "Cool & pristine storage protecting water from sunlight",
        "Same-day doorstep delivery across Greater Accra before 2 PM",
        "Nationwide delivery to all 16 regions via station parcel couriers",
        "Free delivery on orders of GH₵100 or more",
        "Secure payments via MTN MoMo, Telecel Cash, AT Money, and Cards",
      ],
    },
  };
}

function handleGetAccountCreationGuide(): ToolExecutionResult {
  return {
    toolName: "getAccountCreationGuide",
    result: {
      registerUrl: "/register",
      loginUrl: "/login",
      benefits: [
        "Save multiple delivery addresses for instant checkout",
        "Track orders in real-time from packing to doorstep",
        "Earn hydration loyalty reward points",
        "View complete order receipts and history",
      ],
    },
    clientAction: {
      type: "NAVIGATE_TO_REGISTER",
      payload: { url: "/register" },
    },
  };
}

function handleGetWaterHealthRecommendations(args: { need?: string }): ToolExecutionResult {
  const need = (args.need || "").toLowerCase();
  let recommended = STORE_PRODUCTS;

  if (need.includes("baby") || need.includes("infant")) {
    recommended = STORE_PRODUCTS.filter((p) => p.brand.toLowerCase() === "verna");
  } else if (need.includes("gym") || need.includes("workout") || need.includes("alkaline") || need.includes("fitness")) {
    recommended = STORE_PRODUCTS.filter((p) => p.brand.toLowerCase() === "slem fit");
  }

  return {
    toolName: "getWaterHealthRecommendations",
    result: {
      need: args.need || "general",
      recommendations: [
        { brand: "Verna", idealFor: "Babies, infant formula, and low-sodium diets" },
        { brand: "Slem Fit", idealFor: "Gym, sports, fitness, workout recovery (alkaline pH with electrolytes)" },
        { brand: "Voltic & Bel-Aqua", idealFor: "Daily premium natural mineral hydration" },
        { brand: "Awake", idealFor: "Purified water supporting national heart healthcare charity" },
      ],
    },
    suggestedProducts: recommended.slice(0, 3),
  };
}
