"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useChat } from "@/context/chat-context";
import { STORE_PRODUCTS, StoreProduct, STORE_PHONE_DISPLAY, STORE_WHATSAPP_LINK } from "@/lib/constants";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestedProducts?: StoreProduct[];
}

export function CustomerChatWidget() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, addItem, updateQuantity, removeItem, clearCart, itemCount, total } = useCart();
  const { isOpen, openChat, closeChat, toggleChat, initialQuery, setInitialQuery } = useChat();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! 👋 Welcome to **Kay's Packs**. I'm your AI Hydration Assistant. Ask me about water packs, prices, live stock, delivery fees, or tracking your order!",
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
          } else if (action.type === "REMOVE_FROM_CART" && action.payload?.productId) {
            removeItem(action.payload.productId);
          } else if (action.type === "UPDATE_QUANTITY" && action.payload?.productId) {
            updateQuantity(action.payload.productId, action.payload.quantity);
          } else if (action.type === "CLEAR_CART") {
            clearCart();
          } else if (action.type === "NAVIGATE_TO_CHECKOUT" && action.payload?.url) {
            router.push(action.payload.url);
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

  const handleProductAdd = (product: StoreProduct) => {
    addItem(product, 1);
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

  return (
    <>
      {/* ─── Floating Launcher Trigger Button ──────────────────────────────── */}
      {!isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex items-center">
          <button
            id="open-ai-chat-btn"
            onClick={toggleChat}
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white pl-4 pr-5 py-3.5 rounded-full shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 border border-white/20"
            aria-label="Open AI Hydration Assistant"
          >
            {/* Pulsing glow ring */}
            <span className="absolute -inset-1 rounded-full bg-blue-500/30 blur-sm group-hover:opacity-100 opacity-60 transition duration-500 animate-pulse" />

            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
            </div>

            <div className="relative flex flex-col text-left">
              <span className="text-[13px] font-bold tracking-tight leading-tight flex items-center gap-1.5">
                AI Assistant
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </span>
              <span className="text-[10px] text-blue-100 font-medium">Ask prices &amp; delivery</span>
            </div>
          </button>
        </div>
      )}

      {/* ─── Expandable Chat Modal Window ─────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[410px] max-w-[430px] h-[580px] max-h-[calc(100vh-100px)] flex flex-col bg-white rounded-3xl shadow-2xl shadow-slate-950/25 border border-slate-200/80 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-blue-600/40 border border-blue-400/30 flex items-center justify-center shadow-inner">
                <Bot className="w-5 h-5 text-blue-200" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white tracking-tight">Kay&apos;s Packs AI</h3>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/20">
                    Hydration Bot
                  </span>
                </div>
                <p className="text-[11px] text-blue-200/80 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Online • Real database connected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Restart conversation"
                className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Restart chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={closeChat}
                className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart Quick Summary Bar (if user has items) */}
          {itemCount > 0 && (
            <div className="shrink-0 bg-blue-50/90 border-b border-blue-100 px-4 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-900 font-medium">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Cart: <strong>{itemCount} {itemCount === 1 ? "pack" : "packs"}</strong> (GH₵{total.toFixed(2)})
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={closeChat}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
              >
                Checkout <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/70 to-white text-slate-800 text-xs">
            {messages.map((m) => {
              const isBot = m.role === "assistant";
              return (
                <div key={m.id} className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}>
                  <div className="flex items-end gap-2 max-w-[88%]">
                    {isBot && (
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mb-1 text-[11px] font-bold shadow-xs">
                        K
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                        isBot
                          ? "bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-xs"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs shadow-sm shadow-blue-600/20"
                      }`}
                    >
                      {/* Markdown simple parser */}
                      <FormattedMarkdown text={m.content} isBot={isBot} />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-9">{m.timestamp}</span>

                  {/* Suggested Product Cards embedded if returned */}
                  {isBot && m.suggestedProducts && m.suggestedProducts.length > 0 && (
                    <div className="mt-2 pl-9 w-full space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Matched Products:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {m.suggestedProducts.map((prod) => {
                          const isAdded = !!addedItemMap[prod.id];
                          return (
                            <div
                              key={prod.id}
                              className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-300 transition-all shadow-xs"
                            >
                              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden relative">
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
                                <h4 className="font-bold text-xs text-slate-900 truncate">{prod.name}</h4>
                                <p className="text-[11px] text-slate-500">{prod.packSize}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-bold text-blue-600 text-xs">
                                    GH₵{prod.price.toFixed(2)}
                                  </span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                      prod.inStock
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-rose-50 text-rose-700"
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
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                    isAdded
                                      ? "bg-emerald-600 text-white"
                                      : prod.inStock
                                      ? "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
                                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 text-slate-500 rounded-bl-xs shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-slate-400 font-medium ml-1.5">Checking store data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="shrink-0 p-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
            <button
              onClick={() => handleSend("Do you have Voltic 500ml in stock and how much is it?")}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors"
            >
              💧 Voltic 500ml price
            </button>
            <button
              onClick={() => handleSend("How much is delivery to Greater Accra and when does it arrive?")}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              🚚 Delivery fee
            </button>
            <button
              onClick={() => handleSend("What are the best selling water packs?")}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              ⭐ Best sellers
            </button>
            <button
              onClick={() => handleSend("What payment methods do you accept?")}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              💳 MoMo payment
            </button>
            <button
              onClick={() => handleSend("Where is my order?")}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
            >
              📦 Track order
            </button>
          </div>

          {/* Chat Input Bar */}
          <div className="shrink-0 p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
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
              placeholder="Ask about water, prices, orders..."
              className="flex-1 p-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-colors"
              disabled={isLoading}
            />

            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white disabled:bg-slate-200 disabled:text-slate-400 transition-all"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Footer Human Escalation Link */}
          <div className="shrink-0 bg-slate-50 px-3 py-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span>Powered by Google Gemini</span>
            <a
              href={STORE_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 font-semibold hover:underline flex items-center gap-1"
            >
              <PhoneCall className="w-3 h-3" /> Speak with human agent
            </a>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Lightweight helper to format bolding and linebreaks nicely
 */
function FormattedMarkdown({ text, isBot }: { text: string; isBot: boolean }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <span>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={idx} className={isBot ? "font-bold text-slate-900" : "font-bold text-white"}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </span>
  );
}
