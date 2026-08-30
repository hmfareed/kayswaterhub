export interface ToolParameterProperty {
  type: "STRING" | "NUMBER" | "BOOLEAN" | "OBJECT" | "ARRAY" | "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  enum?: string[];
  items?: ToolParameterProperty;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "OBJECT" | "object";
    properties?: Record<string, ToolParameterProperty>;
    required?: string[];
  };
}

export const CHATBOT_FUNCTION_DECLARATIONS: ToolDefinition[] = [
  {
    name: "searchProducts",
    description:
      "Search the Kay's Packs store catalog for bottled water, dispenser bottles, sachets, or brand names. Returns accurate prices, sizes, pack quantities, and stock availability.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "Search keyword, e.g. 'Voltic', 'Bel Aqua', 'Verna 750ml', 'cheap water', 'dispenser'",
        },
        category: {
          type: "STRING",
          description: "Category filter (e.g. 'Bottled Water', 'Sachet Water', 'Dispensers')",
        },
        brand: {
          type: "STRING",
          description: "Brand name filter (e.g. 'Voltic', 'Bel-Aqua', 'Verna', 'Awake', 'Perla', 'Slem Fit')",
        },
        maxPrice: {
          type: "NUMBER",
          description: "Maximum price filter in Ghanaian Cedis (GHS)",
        },
        inStockOnly: {
          type: "BOOLEAN",
          description: "Only return items that are currently in stock",
        },
      },
    },
  },
  {
    name: "getProduct",
    description: "Get detailed information about a specific product including description, variants, pack sizes, stock, price, and images.",
    parameters: {
      type: "OBJECT",
      properties: {
        slug: {
          type: "STRING",
          description: "Product slug identifier, e.g. 'voltic-natural-mineral-water-500ml-x-15'",
        },
        productId: {
          type: "STRING",
          description: "Product ID or SKU",
        },
        name: {
          type: "STRING",
          description: "Product name to search if slug or ID is unknown",
        },
      },
    },
  },
  {
    name: "calculatePrice",
    description: "Calculate the exact total price, unit price, and free delivery qualification for a requested quantity of any water product pack.",
    parameters: {
      type: "OBJECT",
      properties: {
        productIdentifier: {
          type: "STRING",
          description: "Product name or brand/size, e.g. 'Voltic 500ml', 'Bel-Aqua 750ml', 'Verna 15L'",
        },
        quantity: {
          type: "NUMBER",
          description: "Number of packs to calculate (e.g. 2, 3, 5)",
        },
      },
      required: ["productIdentifier", "quantity"],
    },
  },
  {
    name: "getBudgetRecommendations",
    description: "Find affordable water pack options and combinations that fit within the customer's specified budget in Ghanaian Cedis.",
    parameters: {
      type: "OBJECT",
      properties: {
        budget: {
          type: "NUMBER",
          description: "Customer's budget in GHS (e.g. 50, 100, 30)",
        },
      },
      required: ["budget"],
    },
  },
  {
    name: "getProductsByCategory",
    description: "List all active water products under a specific category with their pricing and stock status.",
    parameters: {
      type: "OBJECT",
      properties: {
        category: {
          type: "STRING",
          description: "The category name (e.g. 'Bottled Water', 'Sachet Water', 'Dispensers')",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "checkStock",
    description: "Check exact real-time warehouse inventory and availability for a specific product and requested quantity.",
    parameters: {
      type: "OBJECT",
      properties: {
        productIdentifier: {
          type: "STRING",
          description: "Product ID, slug, or exact product name (e.g. 'Voltic 500ml', 'Bel-Aqua')",
        },
        requestedQuantity: {
          type: "NUMBER",
          description: "Quantity of packs customer wishes to buy (default: 1)",
        },
      },
      required: ["productIdentifier"],
    },
  },
  {
    name: "getCart",
    description: "Retrieve summary of items in the customer's current shopping cart, subtotal, delivery estimate, and total.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "addToCart",
    description: "Add a specified product pack and quantity to the customer's shopping cart. Can also automatically trigger checkout redirect.",
    parameters: {
      type: "OBJECT",
      properties: {
        productIdentifier: {
          type: "STRING",
          description: "Product ID, slug, or unambiguous product name (e.g. 'Voltic 500ml', 'Bel Aqua 750ml')",
        },
        quantity: {
          type: "NUMBER",
          description: "Number of packs to add (minimum 1)",
        },
        andCheckout: {
          type: "BOOLEAN",
          description: "Set to true if user wants to add and proceed directly to checkout",
        },
      },
      required: ["productIdentifier"],
    },
  },
  {
    name: "removeFromCart",
    description: "Remove an item from the customer's shopping cart by product identifier.",
    parameters: {
      type: "OBJECT",
      properties: {
        productIdentifier: {
          type: "STRING",
          description: "Product ID, slug, or name to remove",
        },
      },
      required: ["productIdentifier"],
    },
  },
  {
    name: "updateCartQuantity",
    description: "Update the quantity of an item already in the cart.",
    parameters: {
      type: "OBJECT",
      properties: {
        productIdentifier: {
          type: "STRING",
          description: "Product ID, slug, or name",
        },
        quantity: {
          type: "NUMBER",
          description: "New quantity (set to 0 to remove)",
        },
      },
      required: ["productIdentifier", "quantity"],
    },
  },
  {
    name: "getCustomerOrders",
    description: "Retrieve recent orders placed by the currently authenticated customer. Requires authenticated session.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: {
          type: "NUMBER",
          description: "Maximum number of recent orders to return (default 5)",
        },
      },
    },
  },
  {
    name: "getOrderStatus",
    description: "Retrieve tracking status, fulfillment state, delivery details, and items for a specific order number.",
    parameters: {
      type: "OBJECT",
      properties: {
        orderNumber: {
          type: "STRING",
          description: "The order reference/number, e.g. 'KP-2026-0001' or order ID",
        },
      },
      required: ["orderNumber"],
    },
  },
  {
    name: "getDeliveryInformation",
    description: "Get real delivery rates, timelines, same-day delivery cutoff times, regional coverage (including Tamale, Kumasi, Takoradi, etc.), and free delivery thresholds.",
    parameters: {
      type: "OBJECT",
      properties: {
        region: {
          type: "STRING",
          description: "Ghanaian region e.g. 'Greater Accra', 'Northern', 'Ashanti', 'Central', 'Western', 'Eastern', etc.",
        },
        city: {
          type: "STRING",
          description: "Ghanaian city e.g. 'Tamale', 'Kumasi', 'Takoradi', 'Accra', 'Tema', 'Cape Coast'",
        },
      },
    },
  },
  {
    name: "getStoreInfo",
    description: "Get general store details including official contact numbers, WhatsApp support link, accepted payment methods (MTN MoMo, Telecel Cash, AT Money, Bank Cards), and opening hours.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "guideToCheckout",
    description: "Help customer proceed to checkout with their current cart items and provide direct checkout link.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "toggleThemePreference",
    description: "Toggle or change the user's interface theme between Dark Mode and Light Mode.",
    parameters: {
      type: "OBJECT",
      properties: {
        mode: {
          type: "STRING",
          enum: ["dark", "light", "toggle"],
          description: "The target theme mode ('dark', 'light', or 'toggle')",
        },
      },
    },
  },
  {
    name: "contactHumanSupport",
    description: "Escalate the conversation to human support, store manager, or agent with direct WhatsApp and phone call links.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "getWaterQualityInfo",
    description: "Get verified information about water quality, cleanliness, FDA Ghana & GSA certifications, factory seals, and fresh production batches.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "getWhyBuyFromUsInfo",
    description: "Get Kay's Packs core value propositions, guarantees, fast delivery times, and wholesale benefits.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "getAccountCreationGuide",
    description: "Provide step-by-step guidance and direct link for creating or registering a customer account.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "getWaterHealthRecommendations",
    description: "Recommend specific water brands tailored for infant formula/babies (Verna), gym/sports recovery (Slem Fit), or daily hydration (Voltic/Bel-Aqua).",
    parameters: {
      type: "OBJECT",
      properties: {
        need: {
          type: "STRING",
          description: "Customer's health/use requirement e.g. 'baby', 'gym', 'low sodium', 'alkaline'",
        },
      },
    },
  },
];
