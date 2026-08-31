"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bot,
  User,
  Send,
  X,
  RefreshCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronRight,
  ShoppingBag,
  Settings,
  Radio,
  Truck,
  TrendingUp,
  Map,
  CreditCard,
  Layers,
  Tag,
  RotateCcw,
  HeartPulse,
  Activity,
  FileSpreadsheet,
  Clock,
  MapPin,
  Globe,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

interface ActionLink {
  label: string;
  href: string;
  icon?: string;
  primary?: boolean;
}

interface StatsCard {
  title: string;
  metrics: Array<{
    label: string;
    value: string | number;
    change?: string;
    alert?: boolean;
  }>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actionLinks?: ActionLink[];
  statsCard?: StatsCard;
}

const ADMIN_PROMPT_SUGGESTIONS = [
  { label: "📦 Today's Orders", query: "Show me today's orders" },
  { label: "📉 Check Low Stock", query: "Check low stock and warehouse inventory" },
  { label: "⚙️ Delivery Fee Settings", query: "Where is the delivery fee setting and how to change it?" },
  { label: "💰 Minimum Order Amount", query: "Where is the minimum order amount setting?" },
  { label: "🕒 Business Hours", query: "Show current store operating hours and how to edit them" },
  { label: "📊 Sales & Revenue", query: "What is today's revenue and sales performance?" },
  { label: "💳 Paystack & MoMo", query: "How to configure Paystack and MoMo payment gateway?" },
  { label: "➕ How to Add Product", query: "Guide me through adding a new water product" },
  { label: "🚚 Active Deliveries", query: "How do I manage active deliveries and assign drivers?" },
  { label: "🏷️ Create Promo Code", query: "How to create a discount coupon promotion?" },
  { label: "🔄 Process Refund", query: "How to review and process customer refunds?" },
  { label: "🩺 System Health", query: "Check system health and database status" },
];

export function AdminCopilotWidget() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-admin-1",
      role: "assistant",
      content:
        "👋 Hello Admin! I am your **Operations AI Copilot**.\n\n" +
        "I'm here to assist you with every aspect of the admin panel:\n" +
        "• 📦 **Check Orders** for today, yesterday, or any specific date\n" +
        "• ⚙️ **Find & Configure Settings** (delivery rates, minimum order, business hours, Paystack)\n" +
        "• 📉 **Track Warehouse Stock** & low-stock variant alerts\n" +
        "• 📋 **Step-by-step How-To Guides** for any administrative workflow\n" +
        "• 📈 **Real-Time Sales & Revenue Analytics**\n\n" +
        "Select a quick topic below or type your question!",
      timestamp: "Just now",
      actionLinks: [
        { label: "Today's Orders", href: "/admin/orders", icon: "ShoppingBag", primary: true },
        { label: "Store Settings", href: "/admin/settings", icon: "Settings" },
        { label: "Inventory Matrix", href: "/admin/inventory", icon: "Radio" },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to visualViewport for mobile virtual keyboards
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
        window.scrollTo(0, 0);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    };

    if (isOpen) {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
      window.visualViewport?.addEventListener("resize", updateViewport);
      window.visualViewport?.addEventListener("scroll", updateViewport);
    }

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("scroll", updateViewport);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Global event listener for custom "open-admin-copilot" event & Keyboard shortcut Ctrl+J / Cmd+J
  useEffect(() => {
    if (!mounted) return;

    const handleOpenEvent = () => setIsOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("open-admin-copilot", handleOpenEvent);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-admin-copilot", handleOpenEvent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted]);

  const handleSend = async (customQuery?: string) => {
    const queryText = (customQuery || input).trim();
    if (!queryText || isLoading) return;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const botMsg: Message = {
          id: "bot-" + Date.now(),
          role: "assistant",
          content: json.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actionLinks: json.data.actionLinks || [],
          statsCard: json.data.statsCard,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg: Message = {
          id: "bot-err-" + Date.now(),
          role: "assistant",
          content:
            json.data?.reply ||
            "I encountered a temporary issue while fetching that information. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actionLinks: json.data?.actionLinks || [
            { label: "Go to Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard", primary: true },
          ],
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      console.error("[AdminCopilot Error]", err);
      const fallbackMsg: Message = {
        id: "bot-err-" + Date.now(),
        role: "assistant",
        content:
          "⚠️ Network error connecting to Admin Copilot. You can still access all operations via the left sidebar menu.",
        timestamp: "Just now",
        actionLinks: [
          { label: "Admin Settings", href: "/admin/settings", icon: "Settings", primary: true },
          { label: "Orders", href: "/admin/orders", icon: "ShoppingBag" },
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-admin-1",
        role: "assistant",
        content:
          "👋 Operations Copilot reset. How can I assist you with the admin panel right now?",
        timestamp: "Just now",
        actionLinks: [
          { label: "Today's Orders", href: "/admin/orders", icon: "ShoppingBag", primary: true },
          { label: "Store Settings", href: "/admin/settings", icon: "Settings" },
          { label: "Inventory Matrix", href: "/admin/inventory", icon: "Radio" },
        ],
      },
    ]);
  };

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const getActionIcon = (iconName?: string) => {
    switch (iconName) {
      case "Settings":
        return <Settings className="w-3.5 h-3.5" />;
      case "ShoppingBag":
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case "Radio":
        return <Radio className="w-3.5 h-3.5" />;
      case "Truck":
        return <Truck className="w-3.5 h-3.5" />;
      case "TrendingUp":
        return <TrendingUp className="w-3.5 h-3.5" />;
      case "Map":
        return <Map className="w-3.5 h-3.5" />;
      case "CreditCard":
        return <CreditCard className="w-3.5 h-3.5" />;
      case "Layers":
        return <Layers className="w-3.5 h-3.5" />;
      case "Tag":
        return <Tag className="w-3.5 h-3.5" />;
      case "RotateCcw":
        return <RotateCcw className="w-3.5 h-3.5" />;
      case "HeartPulse":
        return <HeartPulse className="w-3.5 h-3.5" />;
      case "Activity":
        return <Activity className="w-3.5 h-3.5" />;
      case "FileSpreadsheet":
        return <FileSpreadsheet className="w-3.5 h-3.5" />;
      case "Clock":
        return <Clock className="w-3.5 h-3.5" />;
      case "MapPin":
        return <MapPin className="w-3.5 h-3.5" />;
      case "Globe":
        return <Globe className="w-3.5 h-3.5" />;
      default:
        return <ExternalLink className="w-3.5 h-3.5" />;
    }
  };

  // Helper for simple Markdown rendering
  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, idx) => {
      // Table row (simple header/body line)
      if (line.startsWith("|") && line.endsWith("|")) {
        const cells = line.split("|").filter((c) => c.trim().length > 0);
        if (cells.some((c) => c.includes("---"))) {
          return null; // separator row
        }
        return (
          <div key={idx} className="flex gap-2 text-xs py-1 border-b border-slate-700/50">
            {cells.map((cell, cIdx) => (
              <span
                key={cIdx}
                className={`flex-1 ${cIdx === 0 ? "font-bold text-blue-300" : "text-slate-300"}`}
                dangerouslySetInnerHTML={{
                  __html: formatInlineMarkdown(cell.trim()),
                }}
              />
            ))}
          </div>
        );
      }

      // Headings
      if (line.startsWith("### ")) {
        return (
          <h3
            key={idx}
            className="text-sm font-black text-white mt-2.5 mb-1.5 flex items-center gap-1.5"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.replace("### ", "")) }}
          />
        );
      }
      if (line.startsWith("#### ")) {
        return (
          <h4
            key={idx}
            className="text-xs font-bold text-blue-400 mt-2 mb-1"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.replace("#### ", "")) }}
          />
        );
      }

      // Bullet points
      if (line.startsWith("• ") || line.startsWith("- ")) {
        const clean = line.replace(/^[•-]\s+/, "");
        return (
          <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300 my-0.5 pl-1">
            <span className="text-blue-400 font-bold shrink-0">•</span>
            <span
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(clean) }}
            />
          </div>
        );
      }

      // Numbered items (e.g. "1. ")
      if (/^\d+\.\s+/.test(line)) {
        const num = line.match(/^(\d+)\.\s+/)?.[1];
        const clean = line.replace(/^\d+\.\s+/, "");
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 my-1 pl-1 bg-slate-800/40 p-1.5 rounded-lg border border-slate-700/40">
            <span className="w-4 h-4 rounded-full bg-blue-600/40 text-blue-300 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              {num}
            </span>
            <span
              className="leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(clean) }}
            />
          </div>
        );
      }

      // Normal line
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p
          key={idx}
          className="text-xs text-slate-200 leading-relaxed my-0.5"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-bold'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em class='text-slate-300 italic'>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='bg-slate-800 text-blue-300 px-1 py-0.5 rounded text-[11px] font-mono border border-slate-700'>$1</code>");
  };

  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <>
      {/* ─── Full-Screen Admin Copilot View with Dynamic Viewport Height ─────── */}
      <div
        style={viewportHeight ? { height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` } : undefined}
        className="fixed inset-0 h-dvh max-h-dvh z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden animate-in fade-in duration-200"
      >
        {/* Top Header */}
        <div className="shrink-0 bg-slate-950/95 border-b border-slate-800/90 shadow-md backdrop-blur-md">
          <div className="max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/40 shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="font-extrabold text-xs sm:text-base text-white leading-tight truncate">
                    Admin AI Copilot
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-900/60 border border-blue-700/50 text-[9px] sm:text-[10px] font-bold text-blue-300 uppercase tracking-wide shrink-0">
                    Ops Mode
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-400 leading-tight mt-0.5 truncate">
                  Kay&apos;s Packs Operations & Management Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleResetChat}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Restart conversation"
                aria-label="Restart conversation"
              >
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Close Copilot (ESC)"
                aria-label="Close Copilot"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips (Bar Under Header) */}
        <div className="shrink-0 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto w-full px-3 sm:px-6 py-1.5 sm:py-2 overflow-x-auto flex items-center gap-1.5 custom-scrollbar">
            {ADMIN_PROMPT_SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.query)}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-800/90 hover:bg-blue-600 hover:text-white text-slate-300 text-[10px] sm:text-[11px] font-semibold transition-colors shrink-0 border border-slate-700/60 shadow-xs cursor-pointer whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overscroll-contain">
          <div className="max-w-5xl mx-auto w-full space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                )}

                <div className={`max-w-[92%] sm:max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-tr-xs shadow-md shadow-blue-600/30"
                        : "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-xs shadow-md shadow-black/20"
                    }`}
                  >
                    {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}

                    {/* Optional Stats Card */}
                    {msg.statsCard && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-700/60">
                        <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-400 uppercase tracking-wider block mb-2">
                          📊 {msg.statsCard.title}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {msg.statsCard.metrics.map((m, mIdx) => (
                            <div key={mIdx} className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                              <span className="text-[9px] sm:text-[10px] text-slate-400 block">{m.label}</span>
                              <span
                                className={`text-[11px] sm:text-xs font-black block mt-0.5 ${
                                  m.alert ? "text-rose-400" : "text-white"
                                }`}
                              >
                                {m.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Navigation Links */}
                    {msg.actionLinks && msg.actionLinks.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                        {msg.actionLinks.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            onClick={() => handleNavigate(act.href)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer shadow-xs ${
                              act.primary
                                ? "bg-blue-600 hover:bg-blue-500 text-white"
                                : "bg-slate-700/80 hover:bg-slate-600 text-slate-200 border border-slate-600/60"
                            }`}
                          >
                            {getActionIcon(act.icon)}
                            <span>{act.label}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] sm:text-[10px] text-slate-500 mt-1 block px-1">
                    {msg.timestamp}
                  </span>
                </div>

                {msg.role === "user" && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-slate-400 py-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-2 rounded-2xl rounded-tl-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-300" />
                  <span className="text-[11px] text-slate-300 ml-1 font-medium">
                    Consulting live database & operations...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Input Bar with Safe Area Inset Support */}
        <div className="shrink-0 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-md pb-[max(0.6rem,env(safe-area-inset-bottom))]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-5xl mx-auto w-full p-2.5 sm:p-4 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => {
                setTimeout(scrollToBottom, 250);
              }}
              placeholder="Ask anything about orders, settings, inventory, guides..."
              className="flex-1 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2.5 sm:p-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer shrink-0 flex items-center justify-center"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
