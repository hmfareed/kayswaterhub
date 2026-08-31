"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  PhoneCall,
  Moon,
  Sun,
  ShieldCheck,
  Award,
  CreditCard,
  Truck,
  ArrowRight,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useChat } from "@/context/chat-context";
import { useTheme } from "@/context/theme-context";
import { STORE_PRODUCTS, StoreProduct, STORE_PHONE_DISPLAY, STORE_WHATSAPP_LINK } from "@/lib/constants";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestedProducts?: StoreProduct[];
}

const QUICK_SUGGESTION_CHIPS = [
  { label: "💧 Voltic 500ml price", query: "What is the price of two packs of 500ml Voltic?" },
  { label: "🚚 Delivery to Tamale / Accra", query: "What is the delivery fee and do you deliver to Tamale?" },
  { label: "⭐ Best sellers", query: "Can you give me the best selling products?" },
  { label: "💳 Pay with MoMo", query: "Can I pay with MoMo and what payment methods do you accept?" },
  { label: "💰 Budget GH₵50", query: "I have a budget of 50 cedis what can I purchase?" },
  { label: "🌙 Turn on Dark Mode", query: "Can you help me turn on dark mode?" },
  { label: "📞 Speak to Manager", query: "I need to speak to the manager/agent/owner" },
  { label: "🛡️ Clean & fresh water?", query: "Is your water clean, pure, and fresh?" },
  { label: "✨ Why Kay's Packs?", query: "Why should I buy from you?" },
  { label: "👶 Best water for babies", query: "Which water is best for babies and infant formula?" },
  { label: "🏢 15L Dispenser refill", query: "How does dispenser water refill and bottle exchange work?" },
  { label: "📦 Bulk & Event orders", query: "Do you offer wholesale and bulk discounts for events?" },
  { label: "📝 Create account", query: "How do I create an account?" },
  { label: "📦 Track order", query: "Where is my order?" },
];

export function CustomerChatWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { items, addItem, updateQuantity, removeItem, clearCart, itemCount, total } = useCart();
  const { isOpen, openChat, closeChat, toggleChat, initialQuery, setInitialQuery } = useChat();
  const { theme, isDarkMode, toggleDarkMode, setTheme } = useTheme();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! 👋 Welcome to **Kay's Packs**. I'm your AI Hydration Assistant. Ask me about water packs, prices, live stock, delivery fees (including Tamale & Accra), or order tracking!",
      timestamp: "Just now",
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Handle prefilled query from context
  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
      setInitialQuery("");
    }
  }, [initialQuery, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput("");
    setIsLoading(true);

    try {
      // Build client cart payload for server context
      const clientCartItems = items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      }));

      // Build history for API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          clientCartItems,
        }),
      });

      const data = await res.json();

      // Process client actions returned from tools
      if (data.clientActions && Array.isArray(data.clientActions)) {
        for (const action of data.clientActions) {
          if (action.type === "ADD_TO_CART" && action.payload?.product) {
            addItem(action.payload.product, action.payload.quantity || 1);
            setAddedItemMap((prev) => ({ ...prev, [action.payload.product.id]: true }));
            setTimeout(() => {
              setAddedItemMap((prev) => ({ ...prev, [action.payload.product.id]: false }));
            }, 3000);

            if (action.payload.andCheckout) {
              setTimeout(() => {
                router.push("/checkout");
              }, 1200);
            }
          } else if (action.type === "REMOVE_FROM_CART" && action.payload?.productId) {
            removeItem(action.payload.productId);
          } else if (action.type === "UPDATE_QUANTITY" && action.payload?.productId) {
            updateQuantity(action.payload.productId, action.payload.quantity);
          } else if (action.type === "CLEAR_CART") {
            clearCart();
          } else if (action.type === "NAVIGATE_TO_CHECKOUT") {
            setTimeout(() => router.push("/checkout"), 800);
          } else if (action.type === "NAVIGATE_TO_REGISTER") {
            router.push("/register");
          } else if (action.type === "NAVIGATE_TO_SHOP") {
            router.push("/shop");
          } else if (action.type === "NAVIGATE" && action.payload?.url) {
            router.push(action.payload.url);
          } else if (action.type === "SET_THEME") {
            if (action.payload?.theme === "dark") {
              setTheme("dark");
            } else if (action.payload?.theme === "light") {
              setTheme("light");
            } else {
              toggleDarkMode();
            }
          } else if (action.type === "TOGGLE_DARK_MODE") {
            toggleDarkMode();
          } else if (action.type === "OPEN_WHATSAPP") {
            if (typeof window !== "undefined") {
              window.open(action.payload?.url || STORE_WHATSAPP_LINK, "_blank");
            }
          }
        }
      }

      const botMessage: Message = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content: data.reply || "I am ready to help you with your order!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedProducts: data.suggestedProducts || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("[ChatWidget Error]", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content:
            "Sorry, I had a temporary issue connecting. Please feel free to reach out via WhatsApp at " +
            STORE_PHONE_DISPLAY +
            " or try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductAdd = (product: StoreProduct, qty: number = 1) => {
    addItem(product, qty);
    setAddedItemMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemMap((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "assistant",
        content:
          "Hello! 👋 Welcome back to **Kay's Packs**. How can I help you hydrate today?",
        timestamp: "Just now",
      },
    ]);
  };

  // If user is inside the admin panel, do NOT display the customer shopping chatbot
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* ─── Floating Launcher Bubble (When Chat is closed) ────────────────── */}
      {!isOpen && (
        <button
          onClick={() => openChat()}
          className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 group flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-blue-400/30 backdrop-blur-md"
          aria-label="Open AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-blue-600 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-blue-600" />
          </div>
          <span className="hidden sm:inline font-bold text-xs tracking-tight">Ask Kay&apos;s AI</span>
        </button>
      )}

      {/* ─── Expandable Chat Modal Window ─────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[410px] max-w-[430px] h-[580px] max-h-[calc(100vh-100px)] flex flex-col bg-white dark:bg-neutral-950 rounded-3xl shadow-2xl shadow-slate-950/25 dark:shadow-black border border-slate-200/80 dark:border-neutral-800 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-neutral-950 dark:via-blue-950 dark:to-neutral-900 text-white p-4 flex items-center justify-between shadow-md border-b border-white/10 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-blue-600/40 border border-blue-400/30 flex items-center justify-center shadow-inner">
                <Bot className="w-5 h-5 text-blue-200" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white tracking-tight">Kay&apos;s Packs AI</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/20">
                    Smart Assistant
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/80 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online • Live Store Connected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleDarkMode}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-200" />}
              </button>
              <button
                onClick={handleResetChat}
                title="Restart conversation"
                className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Restart chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={closeChat}
                className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Quick Summary Bar (if user has items) */}
          {itemCount > 0 && (
            <div className="shrink-0 bg-blue-50/90 dark:bg-neutral-900 border-b border-blue-100 dark:border-neutral-800 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-medium">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>
                  Cart: <strong>{itemCount} {itemCount === 1 ? "pack" : "packs"}</strong> (GH₵{total.toFixed(2)})
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={closeChat}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 hover:underline"
              >
                Checkout <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/70 to-white dark:from-black dark:to-neutral-950 text-slate-800 dark:text-neutral-100 text-xs">
            {messages.map((m) => {
              const isBot = m.role === "assistant";
              return (
                <div key={m.id} className={`flex flex-col ${isBot ? "items-start" : "items-end"} animate-fade-in`}>
                  <div className={`flex items-start gap-2 max-w-[88%] ${isBot ? "" : "flex-row-reverse"}`}>
                    {isBot ? (
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold shadow-xs">
                        K
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-700 dark:bg-neutral-800 text-white flex items-center justify-center shrink-0 mt-0.5 text-[11px]">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                        isBot
                          ? "bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 text-slate-800 dark:text-neutral-100 rounded-bl-xs shadow-xs"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs shadow-sm shadow-blue-600/20"
                      }`}
                    >
                      {/* Markdown simple parser */}
                      <FormattedMarkdown text={m.content} isBot={isBot} />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 px-9">{m.timestamp}</span>

                  {/* Suggested Product Cards embedded if returned */}
                  {isBot && m.suggestedProducts && m.suggestedProducts.length > 0 && (
                    <div className="mt-2 pl-9 w-full space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                        Matched Products:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {m.suggestedProducts.map((prod) => {
                          const isAdded = !!addedItemMap[prod.id];
                          return (
                            <div
                              key={prod.id}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-neutral-900/90 border border-slate-200/80 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all shadow-xs"
                            >
                              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                                {prod.images && prod.images[0] ? (
                                  <Image
                                    src={prod.images[0]}
                                    alt={prod.name}
                                    width={48}
                                    height={48}
                                    className="object-contain p-1"
                                  />
                                ) : (
                                  <ShoppingBag className="w-5 h-5 text-slate-400" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-slate-900 dark:text-neutral-100 truncate">{prod.name}</h4>
                                <p className="text-[11px] text-slate-500 dark:text-neutral-400">{prod.packSize}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                                    GH₵{prod.price.toFixed(2)}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      prod.inStock
                                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50"
                                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50"
                                    }`}
                                  >
                                    {prod.inStock ? "In Stock" : "Out of stock"}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0">
                                <button
                                  onClick={() => handleProductAdd(prod)}
                                  disabled={!prod.inStock}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                    isAdded
                                      ? "bg-emerald-600 text-white"
                                      : prod.inStock
                                      ? "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
                                      : "bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-600 cursor-not-allowed"
                                  }`}
                                >
                                  {isAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" /> Added
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" /> Add
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing state */}
            {isLoading && (
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mb-1 text-[11px] font-bold">
                  K
                </div>
                <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200/90 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 rounded-bl-xs shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 dark:text-neutral-400 font-medium ml-1.5">Checking store data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (Rich & Scrollable) */}
          <div className="shrink-0 p-2 border-t border-slate-100 dark:border-neutral-850 bg-white dark:bg-neutral-950 flex gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            {QUICK_SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.query)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 dark:bg-neutral-900 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-300 text-slate-700 dark:text-neutral-300 font-medium transition-colors cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <div className="shrink-0 p-3 bg-white dark:bg-neutral-950 border-t border-slate-200/80 dark:border-neutral-850 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about water, prices, orders, delivery..."
              className="flex-1 p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-neutral-900 outline-none transition-colors"
              disabled={isLoading}
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white disabled:bg-slate-200 dark:disabled:bg-neutral-800 disabled:text-slate-400 dark:disabled:text-neutral-600 transition-all cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Footer Human Escalation Link */}
          <div className="shrink-0 bg-slate-50 dark:bg-neutral-950 px-3 py-1.5 border-t border-slate-100 dark:border-neutral-850 flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400">
            <span>Kay&apos;s Packs AI • Ghana</span>
            <a
              href={STORE_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3" /> Speak with manager
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Rich markdown helper to format bullet lists, numbered lists, bolding, italics, links, and currency
 */
function parseInlineFormatting(text: string, isBot: boolean): React.ReactNode[] {
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|\*[^*]+?\*|_.*?_|GH₵\s*\d+(?:\.\d{2})?)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Link: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target={linkMatch[2].startsWith("http") ? "_blank" : undefined}
          rel={linkMatch[2].startsWith("http") ? "noopener noreferrer" : undefined}
          className="text-blue-600 dark:text-blue-400 font-semibold underline hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-0.5"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={idx} className={isBot ? "font-bold text-slate-900 dark:text-white" : "font-bold text-white"}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic: *text* or _text_
    if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2 && !part.startsWith("**")) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      return (
        <em key={idx} className="italic opacity-90">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Currency highlight: GH₵ xx
    if (part.startsWith("GH₵")) {
      return (
        <span key={idx} className={`font-semibold ${isBot ? "text-blue-700 dark:text-blue-300" : "text-white"}`}>
          {part}
        </span>
      );
    }

    return <span key={idx}>{part}</span>;
  });
}

function FormattedMarkdown({ text, isBot }: { text: string; isBot: boolean }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let isNumbered = false;

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      if (isNumbered) {
        elements.push(
          <ol key={`ol-${key}`} className="list-decimal list-outside pl-4 my-1 space-y-0.5">
            {currentList}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc list-outside pl-4 my-1 space-y-0.5">
            {currentList}
          </ul>
        );
      }
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList(idx);
      elements.push(<div key={`gap-${idx}`} className="h-1" />);
      return;
    }

    // Bullet list item (* or -)
    const bulletMatch = line.match(/^(\s*)[*-]\s+(.*)$/);
    if (bulletMatch) {
      if (isNumbered && currentList.length > 0) flushList(idx);
      isNumbered = false;
      currentList.push(
        <li key={`li-${idx}`} className="leading-relaxed">
          {parseInlineFormatting(bulletMatch[2], isBot)}
        </li>
      );
      return;
    }

    // Numbered list item (1. or 2.)
    const numMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numMatch) {
      if (!isNumbered && currentList.length > 0) flushList(idx);
      isNumbered = true;
      currentList.push(
        <li key={`nli-${idx}`} className="leading-relaxed">
          {parseInlineFormatting(numMatch[2], isBot)}
        </li>
      );
      return;
    }

    // Header (### or ##)
    const headerMatch = line.match(/^#{1,4}\s+(.*)$/);
    if (headerMatch) {
      flushList(idx);
      elements.push(
        <div key={`h-${idx}`} className="font-bold text-xs mt-1.5 mb-0.5 text-slate-900 dark:text-white uppercase tracking-wider">
          {parseInlineFormatting(headerMatch[1], isBot)}
        </div>
      );
      return;
    }

    // Regular line
    flushList(idx);
    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed my-0.5">
        {parseInlineFormatting(line, isBot)}
      </p>
    );
  });

  flushList(lines.length);

  return <div className="space-y-0.5 text-xs">{elements}</div>;
}
