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
          description: "Category filter (e.g. 'Bottled Water', 'Sachet Water', 'Dispensers', 'Flavored & Alkaline')",
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
    name: "getProductsByCategory",
    description: "List all active water products under a specific category with their pricing and stock status.",
    parameters: {
      type: "OBJECT",
      properties: {
        category: {
          type: "STRING",
          description: "The category name (e.g. 'Bottled Water', 'Sachet Water', 'Dispensers', 'Flavored & Alkaline')",
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
          description: "Product ID, slug, or exact product name",
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
    description: "Add a specified product pack and quantity to the customer's shopping cart. Validates product stock and returns updated cart details.",
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
    description: "Get real delivery rates, timelines, same-day delivery cutoff times, regional coverage, and free delivery thresholds for Kay's Packs.",
    parameters: {
      type: "OBJECT",
      properties: {
        region: {
          type: "STRING",
          description: "Ghanaian region e.g. 'Greater Accra', 'Ashanti', 'Central', 'Western', 'Eastern', etc.",
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
];
