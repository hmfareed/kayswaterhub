"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Package,
  MapPin,
  CreditCard,
  ShoppingBag,
  Heart,
  Clock,
  Settings as SettingsIcon,
  MessageSquare,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User as UserIcon,
  Send,
  Check,
  Truck,
  RefreshCw,
  Navigation,
  Phone,
  Mail,
  Lock,
  Shield,
  Tag,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Star,
  Building2,
  Home,
  Briefcase,
  MoreHorizontal,
  Edit3,
  Ban,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import {
  STORE_PRODUCTS,
  STORE_WHATSAPP_LINK,
  GHANA_REGIONS,
  StoreProduct,
} from "@/lib/constants";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";

// ─── WhatsApp Brand Icon ──────────────────────────────────────────────────────
function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type NotifCategory = "all" | "orders" | "payments" | "delivery" | "promotions" | "security" | "products" | "system";
type OrderStatus = "pending" | "confirmed" | "out_for_delivery" | "delivered" | "cancelled";
type NotifFilter = NotifCategory;
type OrderFilter = "all" | OrderStatus;
type PayType = "MOMO" | "BANK";
type AddrLabel = "HOME" | "OFFICE" | "OTHER";

interface NotificationItem {
  id: string;
  _id?: string;
  category: string;
  title: string;
  message: string;
  time?: string;
  createdAt?: string;
  isRead?: boolean;
  read?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  entityType?: string;
  entityId?: string;
}

function formatRelativeTime(dateInput?: string | Date): string {
  if (!dateInput) return "Recently";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return typeof dateInput === "string" ? dateInput : "Recently";
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface Address {
  id: string;
  _id?: string;
  label: AddrLabel;
  fullName: string;
  phone: string;
  region: string;
  city: string;
  area: string;
  street: string;
  houseNumber: string;
  digitalAddress: string;
  landmark: string;
  deliveryInstructions: string;
  lat?: number;
  lng?: number;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  type: PayType;
  provider: string;
  number: string;
  bankName?: string;
  isDefault: boolean;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  _id?: string;
  rawStatus?: string;
  date: string;
  status: OrderStatus;
  statusLabel: string;
  statusColor: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  estimatedDeliveryFee?: number;
  deliveryMethod?: string;
  deliveryPaymentStatus?: string;
  parcelStation?: string;
  items: OrderItem[];
  rider?: { name: string; phone: string; eta: string; vehicle: string };
}

function getStatusDetails(rawStatus?: string): {
  normalized: OrderStatus;
  label: string;
  color: string;
} {
  const norm = (rawStatus || "").toUpperCase();
  switch (norm) {
    case "PENDING_PAYMENT":
    case "PENDING":
      return {
        normalized: "pending",
        label: "Pending Payment",
        color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
      };
    case "PAID":
      return {
        normalized: "confirmed",
        label: "Paid (Confirmed)",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      };
    case "CONFIRMED":
      return {
        normalized: "confirmed",
        label: "Order Confirmed",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      };
    case "PROCESSING":
      return {
        normalized: "confirmed",
        label: "Processing & Packing",
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
      };
    case "READY_FOR_DELIVERY":
      return {
        normalized: "confirmed",
        label: "Ready for Dispatch",
        color: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60",
      };
    case "OUT_FOR_DELIVERY":
    case "IN_TRANSIT":
      return {
        normalized: "out_for_delivery",
        label: "Out for Delivery",
        color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
      };
    case "DELIVERED":
    case "COMPLETED":
      return {
        normalized: "delivered",
        label: "Delivered",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      };
    case "CANCELLED":
    case "FAILED_DELIVERY":
      return {
        normalized: "cancelled",
        label: "Cancelled",
        color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
      };
    case "REFUND_PENDING":
      return {
        normalized: "cancelled",
        label: "Refund Pending",
        color: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
    case "REFUNDED":
      return {
        normalized: "cancelled",
        label: "Refunded",
        color: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
    default:
      return {
        normalized: "pending",
        label: rawStatus || "Order Placed",
        color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
      };
  }
}

const INITIAL_ADDRESSES: Address[] = [];
const INITIAL_ORDERS: Order[] = [];
const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [];

// ─── Utility: Order Timeline ──────────────────────────────────────────────────
const ORDER_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "pending", label: "Order Placed", icon: "📝" },
  { key: "confirmed", label: "Confirmed", icon: "✅" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🚐" },
  { key: "delivered", label: "Delivered", icon: "🏠" },
];

const STATUS_RANK: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 py-2 text-rose-500 text-xs font-bold">
        <Ban className="w-4 h-4" />
        <span>This order was cancelled</span>
      </div>
    );
  }
  const currentRank = STATUS_RANK[status];
  return (
    <div className="flex items-start gap-0 mt-3">
      {ORDER_STEPS.map((step, idx) => {
        const stepRank = STATUS_RANK[step.key];
        const done = stepRank < currentRank;
        const active = stepRank === currentRank;
        const pending = stepRank > currentRank;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : active
                    ? "bg-blue-600 border-blue-600 text-white animate-pulse"
                    : "bg-white border-slate-200 text-slate-300"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : active ? "●" : "○"}
              </div>
              <span
                className={`text-[9px] font-bold mt-1 text-center leading-tight max-w-[52px] ${
                  done
                    ? "text-emerald-600"
                    : active
                    ? "text-blue-600"
                    : "text-slate-300"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < ORDER_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mt-3.5 transition-all ${
                  stepRank < currentRank ? "bg-emerald-400" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Toggle Switch Component ──────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
        checked ? "bg-blue-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── Main Account Content ─────────────────────────────────────────────────────
function AccountContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { itemCount, wishlist, toggleWishlist, recentlyViewed, addItem } = useCart();

  // Redirect unauthenticated visitors to signup
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/register?callbackUrl=/account");
    }
  }, [status, router]);

  // ── Modal/Drawer state ────────────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // ── Dark mode ─────────────────────────────────────────────────────────────
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ── Core data ─────────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Load addresses and orders — ONLY from server API after session is confirmed.
  // Never read from localStorage for user-specific data to prevent cross-account leakage.
  const fetchUserOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch("/api/orders", {
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const mappedOrders: Order[] = data.data.map((o: any) => {
          const statusInfo = getStatusDetails(o.status);
          return {
            id: o.orderNumber || o._id,
            _id: o._id,
            rawStatus: o.status,
            date: new Date(o.createdAt || Date.now()).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            status: statusInfo.normalized,
            statusLabel: statusInfo.label,
            statusColor: statusInfo.color,
            total: o.total || 0,
            subtotal: o.subtotal || o.total || 0,
            deliveryFee: o.deliveryFee || 0,
            estimatedDeliveryFee: o.estimatedDeliveryFee || o.deliveryFee || 0,
            deliveryMethod: o.deliveryMethod || "YANGO_DOOR",
            deliveryPaymentStatus: o.deliveryPaymentStatus || "EXPECTED",
            parcelStation: o.deliveryAddress?.parcelStation,
            rider: o.courierName
              ? {
                  name: o.courierName,
                  phone: o.courierPhone || "024 000 0000",
                  eta: "On route",
                  vehicle: o.courierProvider === "YANGO" ? "Yango Dispatch" : "Courier",
                }
              : undefined,
            items: (o.items || []).map((i: any) => ({
              name: i.productName || i.name || "Water Pack",
              quantity: i.quantity || 1,
              price: i.unitPrice || i.price || 0,
            })),
          };
        });
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error("Failed to fetch customer orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.id) {
      setLoadingOrders(false);
      return;
    }

    // Fetch user addresses (server-scoped to the logged-in user)
    fetch("/api/account/addresses")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.addresses)) {
          const mapped: Address[] = data.addresses.map((a: any) => ({
            id: a._id || a.id || `addr-${Math.random().toString(36).substring(2, 9)}`,
            _id: a._id || a.id,
            label: a.label || "HOME",
            fullName: a.fullName || "",
            phone: a.phone || "",
            region: a.region || "Greater Accra",
            city: a.city || "Accra",
            area: a.area || "",
            street: a.houseOrBuilding || a.street || "",
            houseNumber: a.houseNumber || "",
            digitalAddress: a.digitalAddress || "",
            landmark: a.landmark || "",
            deliveryInstructions: a.deliveryInstructions || "",
            lat: a.coordinates?.lat,
            lng: a.coordinates?.lng,
            isDefault: Boolean(a.isDefault),
          }));
          setAddresses(mapped);
        }
      })
      .catch(() => {});

    // Fetch user orders from API
    fetchUserOrders();
  }, [session, status]);

  // ── Notification filter ───────────────────────────────────────────────────
  const [notifFilter, setNotifFilter] = useState<NotifFilter>("all");

  // ── Order filter & expand ─────────────────────────────────────────────────
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Notification API fetching ─────────────────────────────────────────────
  const fetchCustomerNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await fetch("/api/customer/notifications?limit=50");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mapped: NotificationItem[] = json.data.map((n: any) => ({
          id: n._id || n.id,
          _id: n._id,
          category: (n.category || "ORDERS").toLowerCase(),
          title: n.title,
          message: n.message || n.body,
          time: formatRelativeTime(n.createdAt),
          createdAt: n.createdAt,
          isRead: Boolean(n.isRead),
          read: Boolean(n.isRead),
          actionUrl: n.actionUrl,
          actionLabel: n.actionLabel,
          entityType: n.entityType,
          entityId: n.entityId,
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.warn("[Account] Error fetching notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchCustomerNotifications();
  }, [session]);

  // ── Notification actions ──────────────────────────────────────────────────
  const markNotifRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
    );
    try {
      await fetch(`/api/customer/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.warn("Failed to mark read on server:", err);
    }
  };

  const deleteNotif = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/customer/notifications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Failed to delete notification on server:", err);
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, isRead: true }))
    );
    try {
      await fetch("/api/customer/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.warn("Failed to mark all read on server:", err);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.read) {
      await markNotifRead(n.id);
    }

    if (
      n.actionUrl?.includes("tab=orders") ||
      n.entityType === "ORDER" ||
      n.category === "orders" ||
      n.category === "delivery"
    ) {
      setActiveModal("orders");
    } else if (n.actionUrl?.includes("tab=payment") || n.category === "payments") {
      setActiveModal("payment");
    } else if (n.actionUrl?.includes("tab=settings") || n.category === "security") {
      setActiveModal("settings");
    } else if (n.actionUrl) {
      router.push(n.actionUrl);
    }
  };

  const filteredNotifs =
    notifFilter === "all"
      ? notifications
      : notifications.filter(
          (n) => n.category.toLowerCase() === notifFilter.toLowerCase()
        );

  // ── Address form ──────────────────────────────────────────────────────────
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addrMenuId, setAddrMenuId] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const blankAddr = (): Omit<Address, "id" | "isDefault"> => ({
    label: "HOME",
    fullName: "",
    phone: "",
    region: "Greater Accra",
    city: "",
    area: "",
    street: "",
    houseNumber: "",
    digitalAddress: "",
    landmark: "",
    deliveryInstructions: "",
  });
  const [addrForm, setAddrForm] = useState(blankAddr());

  // ── Payment form ──────────────────────────────────────────────────────────
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [payType, setPayType] = useState<PayType>("MOMO");
  const [momoProvider, setMomoProvider] = useState("MTN Mobile Money");
  const [momoNumber, setMomoNumber] = useState("");
  const [bankName, setBankName] = useState("GCB Bank");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");

  // ── Settings: password ────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // ── Settings: profile ─────────────────────────────────────────────────────
  const [userName, setUserName] = useState(session?.user?.name || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // ── Settings: change email ────────────────────────────────────────────────
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailVerifCode, setEmailVerifCode] = useState("");
  const [emailStep, setEmailStep] = useState<"input" | "verify" | "done">("input");
  const [emailLoading, setEmailLoading] = useState(false);

  // ── Settings: change phone (OTP) ──────────────────────────────────────────
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"input" | "otp" | "done">("input");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [userPhone, setUserPhone] = useState(session?.user?.phone || "");

  // ── Settings: notification preferences ───────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    orderUpdates: true,
    deliveryUpdates: true,
    promotions: false,
    wishlistPrice: false,
    securityAlerts: true,
  });
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);

  // ── Live Chat ─────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<
    { sender: "user" | "bot"; text: string; time: string }[]
  >([
    {
      sender: "bot",
      text: "Hello! Welcome to Kay's Packs Support. How can we help you with your water orders today?",
      time: "Just now",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);

  // ── Misc ──────────────────────────────────────────────────────────────────
  const [signingOut, setSigningOut] = useState(false);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kays_theme");
      if (saved === "dark") setIsDarkMode(true);
    } catch {}
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["notifications","orders","address","payment","wishlist","recent","settings"].includes(tab)) {
      setActiveModal(tab);
    }
  }, [searchParams]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const closeModal = () => {
    setActiveModal(null);
    setShowAddAddress(false);
    setEditingAddress(null);
    setShowAddPayment(false);
    setAddrMenuId(null);
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try { localStorage.setItem("kays_theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    // Clear all user-scoped data from localStorage on sign-out
    // to prevent any residual data from showing to the next user on this device.
    try {
      const keysToRemove = [
        "kays_user_addresses",
        "kays_user_orders",
        "kays_user_payments",
        "kays_packs_cart",
        "kays_waterhub_cart",
        "kays_packs_wishlist",
        "kays_waterhub_wishlist",
        "kays_packs_recent",
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {}
    await signOut({ callbackUrl: "/" });
  };

  // Refresh orders
  const handleRefreshOrders = async () => {
    setIsRefreshing(true);
    await fetchUserOrders();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Cancel order state
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);
  const [justCancelledIds, setJustCancelledIds] = useState<string[]>([]);

  const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "confirmed"];

  // ── Order actions ─────────────────────────────────────────────────────────
  const filteredOrders =
    orderFilter === "all"
      ? orders
      : orders.filter(
          (o) =>
            o.status === orderFilter ||
            justCancelledIds.includes(o.id) ||
            (o._id && justCancelledIds.includes(o._id))
        );

  const handleCancelOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId || o._id === orderId);
    if (!order) return;
    // Use MongoDB _id for the API call if available
    const apiId = (order as any)._id || orderId;
    setCancellingOrderId(orderId);
    setCancelError(null);
    try {
      const res = await fetch(`/api/orders/${apiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel order.");
      }
      // Update local state immediately
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || (o as any)._id === apiId
            ? { ...o, status: "cancelled", statusLabel: "Cancelled", statusColor: "bg-rose-50 text-rose-700 border-rose-200" }
            : o
        )
      );
      setJustCancelledIds((prev) => [...prev, orderId, apiId]);
      setCancelSuccessMsg(`Order #${order.id} was cancelled successfully.`);
      setTimeout(() => setCancelSuccessMsg(null), 5000);
      setCancelConfirmId(null);
    } catch (err) {
      setCancelError((err as Error).message || "Could not cancel order.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess(false);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password: newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordError(data.error || "Failed to update password."); return; }
      setPasswordSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch {
      setPasswordError("Network error. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Update profile ────────────────────────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: userName, phone: userPhone }),
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch {} finally {
      setProfileSaving(false);
    }
  };

  // ── Change email ──────────────────────────────────────────────────────────
  const handleRequestEmailChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.includes("@")) return;
    setEmailLoading(true);
    setTimeout(() => { setEmailLoading(false); setEmailStep("verify"); }, 1000);
  };
  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setTimeout(() => { setEmailLoading(false); setEmailStep("done"); }, 800);
  };

  // ── Change phone ──────────────────────────────────────────────────────────
  const handleRequestPhoneChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) return;
    setPhoneLoading(true);
    setTimeout(() => { setPhoneLoading(false); setPhoneStep("otp"); }, 1000);
  };
  const handleVerifyPhoneOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    setTimeout(() => {
      setUserPhone(newPhone);
      setPhoneLoading(false);
      setPhoneStep("done");
    }, 800);
  };

  // ── Address actions ───────────────────────────────────────────────────────
  const handleGetGps = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address ?? {};

          // ── Map Nominatim state → closest GHANA_REGIONS entry ──────────
          const rawState: string = addr.state ?? addr.region ?? "";
          const matchedRegion = GHANA_REGIONS.find((r) =>
            rawState.toLowerCase().includes(r.toLowerCase().split(" ")[0].toLowerCase())
          ) ?? (rawState || "Greater Accra");

          // ── City / Town ──────────────────────────────────────────────────
          const city: string =
            addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.municipality ?? "";

          // ── Area / Suburb ────────────────────────────────────────────────
          const area: string =
            addr.suburb ??
            addr.neighbourhood ??
            addr.residential ??
            addr.quarter ??
            addr.hamlet ??
            city;

          setAddrForm((f) => ({
            ...f,
            region: matchedRegion,
            city,
            area,
            deliveryInstructions:
              f.deliveryInstructions ||
              `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          }));
        } catch {
          // Reverse-geocode failed — still store the raw coordinates
          setAddrForm((f) => ({
            ...f,
            deliveryInstructions:
              f.deliveryInstructions ||
              `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          }));
        } finally {
          setGpsLoading(false);
        }
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      const addrId = editingAddress._id || editingAddress.id;
      // Optimistic update
      setAddresses((prev) =>
        prev.map((a) =>
          (a._id || a.id) === addrId ? { ...a, ...addrForm } : a
        )
      );

      try {
        const res = await fetch("/api/account/addresses", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: addrId,
            ...addrForm,
          }),
        });
        const json = await res.json();
        if (json.success && json.address) {
          const updated = json.address;
          setAddresses((prev) =>
            prev.map((a) =>
              (a._id || a.id) === addrId
                ? {
                    ...a,
                    ...addrForm,
                    id: updated._id || updated.id || addrId,
                    _id: updated._id || updated.id || addrId,
                  }
                : a
            )
          );
        }
      } catch (err) {
        console.error("Failed to update address:", err);
      }
    } else {
      const tempId = `addr-${Date.now()}`;
      const newAddr: Address = {
        id: tempId,
        _id: tempId,
        ...addrForm,
        isDefault: addresses.length === 0,
      };
      setAddresses((prev) => [...prev, newAddr]);

      try {
        const res = await fetch("/api/account/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...addrForm,
            isDefault: addresses.length === 0,
          }),
        });
        const json = await res.json();
        if (json.success && json.address) {
          const created = json.address;
          setAddresses((prev) =>
            prev.map((a) =>
              a.id === tempId
                ? {
                    ...a,
                    id: created._id || created.id,
                    _id: created._id || created.id,
                    isDefault: Boolean(created.isDefault),
                  }
                : a
            )
          );
        }
      } catch (err) {
        console.error("Failed to save new address:", err);
      }
    }
    setShowAddAddress(false);
    setEditingAddress(null);
    setAddrForm(blankAddr());
  };

  const handleSetDefaultAddress = async (id: string) => {
    if (!id) return;
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: (a._id || a.id) === id }))
    );
    try {
      await fetch("/api/account/addresses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      });
    } catch (err) {
      console.error("Failed to set default address:", err);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!id) return;
    setAddresses((prev) => prev.filter((a) => (a._id || a.id) !== id));
    setAddrMenuId(null);
    try {
      await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete address on server:", err);
    }
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddress(addr);
    setAddrForm({
      label: addr.label,
      fullName: addr.fullName,
      phone: addr.phone,
      region: addr.region,
      city: addr.city,
      area: addr.area,
      street: addr.street,
      houseNumber: addr.houseNumber,
      digitalAddress: addr.digitalAddress,
      landmark: addr.landmark,
      deliveryInstructions: addr.deliveryInstructions,
    });
    setShowAddAddress(true);
    setAddrMenuId(null);
  };

  // ── Payment actions ───────────────────────────────────────────────────────
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payType === "MOMO" && !momoNumber.trim()) return;
    if (payType === "BANK" && (!bankAccountNumber.trim() || !bankAccountName.trim())) return;
    const newMethod: PaymentMethod =
      payType === "MOMO"
        ? { id: `pay-${Date.now()}`, type: "MOMO", provider: momoProvider, number: momoNumber, isDefault: paymentMethods.length === 0 }
        : { id: `pay-${Date.now()}`, type: "BANK", provider: bankName, number: `•••• ${bankAccountNumber.slice(-4)}`, bankName, isDefault: paymentMethods.length === 0 };
    setPaymentMethods((prev) => [...prev, newMethod]);
    setShowAddPayment(false);
    setMomoNumber(""); setBankAccountName(""); setBankAccountNumber("");
  };

  const handleSetDefaultPayment = (id: string) =>
    setPaymentMethods((prev) => prev.map((p) => ({ ...p, isDefault: p.id === id })));

  const handleDeletePayment = (id: string) =>
    setPaymentMethods((prev) => prev.filter((p) => p.id !== id));

  // ── Chat ──────────────────────────────────────────────────────────────────
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setChatMessages((prev) => [...prev, { sender: "user", text, time }]);
    if (!textToSend) setInputMessage("");
    setIsBotTyping(true);
    setTimeout(() => {
      let reply = "Thanks for your message! A Kay's Packs support agent will assist you shortly. You can also reach us via WhatsApp.";
      const lower = text.toLowerCase();
      if (lower.includes("delivery") || lower.includes("track")) {
        reply = "Orders placed before 2:00 PM are delivered the same day in Greater Accra. You can track active orders under 'My Orders'.";
      } else if (lower.includes("momo") || lower.includes("pay")) {
        reply = "We accept MTN MoMo, Telecel Cash, AT Money and Bank Transfer. Payments are secured and verified instantly.";
      } else if (lower.includes("bulk") || lower.includes("wholesale")) {
        reply = "For wholesale (50+ packs) we offer fleet delivery and discounted rates. Message us on WhatsApp for a quote!";
      }
      setChatMessages((prev) => [...prev, { sender: "bot", text: reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      setIsBotTyping(false);
    }, 1000);
  };

  // ── Quick add ─────────────────────────────────────────────────────────────
  const handleQuickAdd = (product: StoreProduct) => {
    addItem(product, 1);
    setQuickAddedId(product.id);
    setTimeout(() => setQuickAddedId(null), 1500);
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const wishlistedProducts = STORE_PRODUCTS.filter((p) => wishlist.includes(p.id));
  const recentProducts = STORE_PRODUCTS.filter((p) => recentlyViewed?.includes(p.id));
  const displayName = session?.user?.name || (session?.user?.email ? session.user.email.split("@")[0] : "Customer");
  const displayEmail = session?.user?.email || "No email on file";
  const unreadCount = notifications.filter((n) => !n.read).length;
  const orderCount = orders.length;

  // ── Shared class helpers ──────────────────────────────────────────────────
  const cardBase = `rounded-2xl border transition-colors ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`;
  const inputCls = `w-full p-2.5 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/40 ${isDarkMode ? "bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500" : "bg-slate-50 border border-slate-200 text-slate-900"}`;
  const labelCls = "block text-[11px] font-bold text-slate-500 mb-1";

  // Notif category icons
  const getNotifIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("order")) return <Package className="w-4 h-4 text-blue-600" />;
    if (c.includes("pay") || c.includes("refund")) return <CreditCard className="w-4 h-4 text-emerald-600" />;
    if (c.includes("deliver") || c.includes("truck")) return <Truck className="w-4 h-4 text-amber-600" />;
    if (c.includes("promo") || c.includes("discount")) return <Tag className="w-4 h-4 text-purple-600" />;
    if (c.includes("secur") || c.includes("auth")) return <Shield className="w-4 h-4 text-rose-600" />;
    if (c.includes("product") || c.includes("stock")) return <Package className="w-4 h-4 text-indigo-600" />;
    return <Bell className="w-4 h-4 text-blue-600" />;
  };

  const getNotifIconBg = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("order")) return "bg-blue-50";
    if (c.includes("pay") || c.includes("refund")) return "bg-emerald-50";
    if (c.includes("deliver") || c.includes("truck")) return "bg-amber-50";
    if (c.includes("promo") || c.includes("discount")) return "bg-purple-50";
    if (c.includes("secur") || c.includes("auth")) return "bg-rose-50";
    if (c.includes("product") || c.includes("stock")) return "bg-indigo-50";
    return "bg-blue-50";
  };

  const addrLabelIcon: Record<AddrLabel, React.ReactNode> = {
    HOME: <Home className="w-4 h-4" />,
    OFFICE: <Briefcase className="w-4 h-4" />,
    OTHER: <MapPin className="w-4 h-4" />,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen pb-24 transition-colors duration-200 ${
        isDarkMode ? "bg-slate-950 text-white" : "bg-[#F8FAFC] text-slate-900"
      }`}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-30 transition-colors ${
          isDarkMode
            ? "bg-slate-900/95 border-b border-slate-800"
            : "bg-white/95 border-b border-slate-100 shadow-2xs"
        } backdrop-blur-md`}
      >
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className={`p-2 -ml-2 rounded-xl transition-colors ${
              isDarkMode
                ? "text-slate-300 hover:text-white hover:bg-slate-800"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            }`}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="text-xl font-serif font-black tracking-tight text-center flex-1 pr-6">
            Account
          </h1>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">

        {/* ── Profile Card ──────────────────────────────────────────────────── */}
        <div
          className={`rounded-3xl p-5 border transition-all shadow-xs flex items-center gap-4 ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          }`}
        >
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-900 border-2 border-blue-100 flex items-center justify-center text-white shadow-sm">
              <span className="font-serif font-bold text-2xl tracking-tighter">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif font-bold text-xl tracking-tight truncate leading-tight">
              {displayName}
            </h2>
            <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{displayEmail}</p>
            <div className="mt-1.5 inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[10px] tracking-widest uppercase px-3 py-0.5 rounded-full">
              CUSTOMER
            </div>
          </div>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/cart"
            className={`rounded-2xl p-4 border text-center transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center ${
              isDarkMode ? "bg-slate-900 border-slate-800 hover:border-blue-500/30" : "bg-white border-slate-100 hover:border-blue-100 shadow-2xs"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center mb-1 text-blue-600">
              <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-xl font-black tracking-tight leading-tight">{itemCount}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">IN BAG</span>
          </Link>

          <button
            onClick={() => setActiveModal("wishlist")}
            className={`rounded-2xl p-4 border text-center transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center ${
              isDarkMode ? "bg-slate-900 border-slate-800 hover:border-blue-500/30" : "bg-white border-slate-100 hover:border-blue-100 shadow-2xs"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center mb-1 text-blue-600">
              <Heart className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-xl font-black tracking-tight leading-tight">{wishlist.length}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">SAVED</span>
          </button>

          <button
            onClick={() => setActiveModal("orders")}
            className={`rounded-2xl p-4 border text-center transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center ${
              isDarkMode ? "bg-slate-900 border-slate-800 hover:border-blue-500/30" : "bg-white border-slate-100 hover:border-blue-100 shadow-2xs"
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center mb-1 text-blue-600">
              <Package className="w-5 h-5 stroke-[1.8]" />
            </div>
            {loadingOrders ? (
              <div className="h-7 flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            ) : (
              <span className="text-xl font-black tracking-tight leading-tight">{orderCount}</span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">ORDERS</span>
          </button>
        </div>

        {/* ── Menu List ─────────────────────────────────────────────────────── */}
        <div
          className={`rounded-3xl border shadow-xs overflow-hidden divide-y transition-colors ${
            isDarkMode ? "bg-slate-900 border-slate-800 divide-slate-800/80" : "bg-white border-slate-100 divide-slate-100/90"
          }`}
        >
          {/* Notifications */}
          <button
            onClick={() => setActiveModal("notifications")}
            id="menu-notifications"
            className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="font-bold text-sm leading-snug">Notifications</p>
                <p className="text-xs text-slate-400">Updates on your orders &amp; account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-300 stroke-[2]" />
            </div>
          </button>

          {/* My Orders */}
          <button
            onClick={() => setActiveModal("orders")}
            id="menu-orders"
            className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="font-bold text-sm leading-snug">My Orders</p>
                <p className="text-xs text-slate-400">Track &amp; manage your orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {loadingOrders ? (
                <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{orderCount}</span>
              )}
              <ChevronRight className="w-4 h-4 text-slate-300 stroke-[2]" />
            </div>
          </button>

          {/* Delivery Address */}
          <button
            onClick={() => setActiveModal("address")}
            id="menu-address"
            className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="font-bold text-sm leading-snug">Delivery Address</p>
                <p className="text-xs text-slate-400">Manage shipping addresses</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 stroke-[2]" />
          </button>

          {/* Payment Methods */}
          <button
            onClick={() => setActiveModal("payment")}
            id="menu-payment"
            className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="font-bold text-sm leading-snug">Payment Methods</p>
                <p className="text-xs text-slate-400">MoMo, bank transfer &amp; more</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 stroke-[2]" />
          </button>

          {/* My Cart */}
          <Link
            href="/cart"
            id="menu-cart"
            className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="font-bold text-sm leading-snug">My Cart</p>
                <p className="text-xs text-slate-400">View your shopping bag</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 stroke-[2]" />
          </Link>

          {/* Wishlist */}
          <button
            onClick={() => setActiveModal("wishlist")}
            id="menu-wishlist"
            className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="font-bold text-sm leading-snug">Wishlist</p>
                <p className="text-xs text-slate-400">Your saved pieces</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 stroke-[2]" />
          </button>

          {/* Recently Viewed */}
          <button
            onClick={() => setActiveModal("recent")}
            id="menu-recent"
            className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="font-bold text-sm leading-snug">Recently Viewed</p>
                <p className="text-xs text-slate-400">Pieces you looked at</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 stroke-[2]" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveModal("settings")}
            id="menu-settings"
            className={`w-full p-4 flex items-center justify-between text-left transition-colors ${isDarkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <SettingsIcon className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="font-bold text-sm leading-snug">Settings</p>
                <p className="text-xs text-slate-400">Dark mode, password &amp; more</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 stroke-[2]" />
          </button>
        </div>

        {/* ── Need Assistance? ───────────────────────────────────────────────── */}
        <div className="pt-2 space-y-3">
          <h3 className="font-serif font-black text-xl tracking-tight">Need Assistance?</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveModal("chat")}
              id="btn-live-chat"
              className="bg-[#FF7A00] hover:bg-[#E86E00] active:scale-98 text-white font-bold text-base py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 fill-white/20 stroke-[2.2]" />
              <span>Live Chat</span>
            </button>
            <a
              href={STORE_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              id="btn-whatsapp"
              className="bg-[#22C55E] hover:bg-[#16A34A] active:scale-98 text-white font-bold text-base py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-md shadow-green-500/20 transition-all cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5 fill-white" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* ── Dark Mode Card ─────────────────────────────────────────────────── */}
        <div
          className={`rounded-2xl p-4 border flex items-center justify-between transition-colors shadow-2xs ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              {isDarkMode ? <Moon className="w-5 h-5 stroke-[2]" /> : <Sun className="w-5 h-5 stroke-[2]" />}
            </div>
            <div>
              <p className="font-bold text-sm leading-snug">Dark Mode</p>
              <p className="text-xs text-slate-400">Toggle appearance</p>
            </div>
          </div>
          <Toggle checked={isDarkMode} onChange={handleToggleDarkMode} id="dark-mode-main-toggle" />
        </div>

        {/* ── Sign Out ───────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          id="btn-sign-out"
          className={`w-full rounded-2xl p-4 border flex items-center gap-3.5 transition-all text-left active:scale-[0.99] cursor-pointer ${
            isDarkMode
              ? "bg-rose-950/20 border-rose-900/30 hover:bg-rose-950/40 text-rose-400"
              : "bg-[#FFF4F4] border-[#FFE2E2] hover:bg-[#FFEAEB] text-[#EF4444]"
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-rose-900/40 text-rose-400" : "bg-[#FFE2E2] text-[#EF4444]"}`}>
            {signingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5 stroke-[2.2]" />}
          </div>
          <span className="font-bold text-sm">{signingOut ? "Signing Out..." : "Sign Out"}</span>
        </button>
      </main>

      {/* ── Bottom Nav ────────────────────────────────────────────────────────── */}
      <MobileBottomNav />

      {/* ════════════════════════════════════════════════════════════════════════
          FULL-SCREEN PANELS
          Each panel: fixed inset-0 z-50, slides in from right, sticky header
          with back-arrow + title, scrollable body.
      ════════════════════════════════════════════════════════════════════════ */}

      {/* Shared full-screen panel wrapper */}
      {activeModal && (
        <div
          className={`fixed inset-0 z-50 flex flex-col transition-colors duration-200 ${
            isDarkMode ? "bg-slate-950 text-white" : "bg-[#F8FAFC] text-slate-900"
          }`}
          style={{ animation: "slideInRight 220ms cubic-bezier(0.25,0.46,0.45,0.94) both" }}
        >
          {/* ── Sticky Panel Header ─────────────────────────────────────────── */}
          <header
            className={`shrink-0 sticky top-0 z-10 flex items-center gap-3 px-4 h-14 border-b ${
              isDarkMode
                ? "bg-slate-900/95 border-slate-800"
                : "bg-white/95 border-slate-100 shadow-2xs"
            } backdrop-blur-md`}
          >
            <button
              onClick={closeModal}
              className={`p-2 -ml-2 rounded-xl transition-colors ${
                isDarkMode
                  ? "text-slate-300 hover:text-white hover:bg-slate-800"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Dynamic title per panel */}
            <h2 className="font-serif font-black text-lg tracking-tight leading-none flex-1">
              {activeModal === "notifications" && "Notifications"}
              {activeModal === "orders" && "My Orders"}
              {activeModal === "address" && "Delivery Addresses"}
              {activeModal === "payment" && "Payment Methods"}
              {activeModal === "wishlist" && "Wishlist"}
              {activeModal === "recent" && "Recently Viewed"}
              {activeModal === "settings" && "Settings"}
              {activeModal === "chat" && "Live Support"}
            </h2>

            {/* Panel-specific header actions */}
            {activeModal === "notifications" && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Mark all read
              </button>
            )}
            {activeModal === "orders" && (
              <button
                onClick={handleRefreshOrders}
                id="orders-refresh-btn"
                className={`p-1.5 rounded-full transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              </button>
            )}
          </header>

          {/* ── Panel Body (scrollable) ──────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">

            {/* ── A. Notifications ─────────────────────────────────────────── */}
            {activeModal === "notifications" && (
              <div className="max-w-2xl mx-auto w-full">
                {/* Filter Tabs */}
                <div className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-none border-b border-slate-100/10">
                  {([
                    { key: "all", label: "All" },
                    { key: "orders", label: "Orders" },
                    { key: "payments", label: "Payments" },
                    { key: "delivery", label: "Delivery" },
                    { key: "promotions", label: "Promotions" },
                    { key: "security", label: "Security" },
                  ] as const).map((tab) => {
                    const hasUnread = notifications.some(
                      (n) =>
                        (tab.key === "all" || n.category.toLowerCase().includes(tab.key)) &&
                        !n.read
                    );
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setNotifFilter(tab.key as NotifFilter)}
                        className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[11px] font-bold capitalize transition-all cursor-pointer ${
                          notifFilter === tab.key
                            ? "bg-blue-600 text-white shadow-xs"
                            : isDarkMode
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tab.label}
                        {hasUnread && tab.key !== "all" && (
                          <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 inline-block align-middle animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 space-y-2.5">
                  {loadingNotifs ? (
                    <div className="space-y-3 py-4">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`p-3.5 rounded-2xl border animate-pulse flex items-start gap-3 ${
                            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                          }`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                            <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredNotifs.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-900 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                        <Bell className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <p className="text-sm font-bold">You're all caught up!</p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        No notifications in this category. You will receive real-time updates when orders are placed and updated.
                      </p>
                    </div>
                  ) : (
                    filteredNotifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-[0.99] ${
                          n.read
                            ? isDarkMode
                              ? "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                              : "bg-white border-slate-100 text-slate-600 hover:border-slate-200 shadow-2xs"
                            : isDarkMode
                            ? "bg-blue-950/30 border-blue-900/50 text-slate-100 hover:border-blue-800"
                            : "bg-blue-50/70 border-blue-100 text-slate-900 hover:border-blue-200 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${getNotifIconBg(
                              n.category
                            )}`}
                          >
                            {getNotifIcon(n.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1.5">
                              <h4
                                className={`text-xs leading-snug ${
                                  n.read ? "font-medium" : "font-bold text-blue-950 dark:text-blue-100"
                                }`}
                              >
                                {n.title}
                              </h4>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1 shadow-xs" />
                              )}
                            </div>
                            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                              <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {!n.read && (
                                  <button
                                    onClick={() => markNotifRead(n.id)}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    Mark read
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotif(n.id)}
                                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                                  title="Remove notification"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── B. My Orders ─────────────────────────────────────────────── */}
            {activeModal === "orders" && (
              <div className="max-w-2xl mx-auto w-full">
                {/* Status Filter Tabs */}
                <div className="flex gap-1.5 px-4 py-3 overflow-x-auto scrollbar-none border-b border-slate-100/10">
                  {([
                    { key: "all", label: "All" },
                    { key: "pending", label: "Pending" },
                    { key: "confirmed", label: "Confirmed" },
                    { key: "out_for_delivery", label: "On the Way" },
                    { key: "delivered", label: "Delivered" },
                    { key: "cancelled", label: "Cancelled" },
                  ] as { key: OrderFilter; label: string }[]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setOrderFilter(tab.key)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
                        orderFilter === tab.key
                          ? "bg-blue-600 text-white"
                          : isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Cancel confirmation banner */}
                {cancelSuccessMsg && (
                  <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span>{cancelSuccessMsg}</span>
                    </div>
                    <button
                      onClick={() => setCancelSuccessMsg(null)}
                      className="text-emerald-600 hover:text-emerald-900 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="p-4 space-y-3.5">
                  {loadingOrders ? (
                    <div className="space-y-3 py-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`p-4 rounded-2xl border animate-pulse space-y-3 ${
                            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1.5 w-1/3">
                              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                            </div>
                            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                          </div>
                          <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 px-4 text-slate-400 space-y-3">
                      <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-slate-900 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                        <Package className="w-8 h-8 stroke-[1.8]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No orders placed yet</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto">
                          When you place orders, you can track real-time delivery and rider details here.
                        </p>
                      </div>
                      <div className="pt-2">
                        <Link
                          href="/shop"
                          onClick={closeModal}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
                        >
                          <span>Shop Water Packs</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    filteredOrders.map((ord) => {
                      const isExpanded = expandedOrder === ord.id;
                      return (
                        <div
                          key={ord.id}
                          className={`rounded-2xl border overflow-hidden transition-all duration-300 ease-out transform ${
                            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
                          } ${cancellingOrderId === ord.id ? "opacity-60 scale-[0.99]" : "opacity-100 scale-100"}`}
                        >
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-xs text-blue-600">{ord.id}</span>
                                <p className="text-[11px] text-slate-400">{ord.date}</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${ord.statusColor}`}>{ord.statusLabel}</span>
                            </div>
                            <div className="space-y-1.5">
                              {ord.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                  <span className={`font-medium truncate pr-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{item.quantity}x {item.name}</span>
                                  <span className={`font-bold shrink-0 ${isDarkMode ? "text-white" : "text-slate-900"}`}>GH₵{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            <div className={`flex items-center justify-between pt-2 border-t text-xs ${isDarkMode ? "border-slate-800" : "border-slate-200/60"}`}>
                              <span className="text-slate-500 font-medium">Total Paid:</span>
                              <span className={`font-black text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>GH₵{ord.total.toFixed(2)}</span>
                            </div>
                            <OrderTimeline status={ord.status} />
                            {ord.status !== "cancelled" && (
                              <button
                                onClick={() => setExpandedOrder(isExpanded ? null : ord.id)}
                                className="w-full py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors mt-1"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>Track Order</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                            {/* Cancel Order — only for cancellable statuses */}
                            {CANCELLABLE_STATUSES.includes(ord.status) && (
                              cancelConfirmId === ord.id ? (
                                <div className={`mt-1 p-3 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-rose-50 border-rose-200"}`}>
                                  <p className={`text-xs font-bold mb-2 ${isDarkMode ? "text-rose-400" : "text-rose-700"}`}>
                                    Are you sure you want to cancel this order?
                                  </p>
                                  {cancelError && (
                                    <p className="text-[11px] text-rose-500 mb-2">{cancelError}</p>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => { setCancelConfirmId(null); setCancelError(null); }}
                                      className={`flex-1 py-2 rounded-lg text-xs font-bold ${isDarkMode ? "bg-slate-700 text-slate-300" : "bg-white text-slate-600 border border-slate-200"}`}
                                    >
                                      Keep Order
                                    </button>
                                    <button
                                      onClick={() => handleCancelOrder(ord.id)}
                                      disabled={cancellingOrderId === ord.id}
                                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      {cancellingOrderId === ord.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Ban className="w-3.5 h-3.5" />
                                      )}
                                      {cancellingOrderId === ord.id ? "Cancelling..." : "Yes, Cancel"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setCancelConfirmId(ord.id); setCancelError(null); }}
                                  className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors mt-1 border ${
                                    isDarkMode
                                      ? "border-rose-800 text-rose-400 hover:bg-rose-900/30"
                                      : "border-rose-200 text-rose-600 hover:bg-rose-50"
                                  }`}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Cancel Order</span>
                                </button>
                              )
                            )}
                          </div>
                          {isExpanded && (
                            <div className={`border-t px-4 pb-4 pt-3 space-y-2.5 ${isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-slate-50"}`}>
                              {/* Delivery Method & Fee breakdown */}
                              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-xs space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {ord.deliveryMethod === "YANGO_DOOR"
                                      ? "Yango Door Delivery"
                                      : ord.deliveryMethod === "NATIONWIDE_PARCEL"
                                      ? "Nationwide Parcel Delivery"
                                      : "Self Pickup"}
                                  </span>
                                  <span className="font-black text-blue-600">
                                    {ord.deliveryMethod === "SELF_PICKUP"
                                      ? "FREE"
                                      : ord.deliveryMethod === "YANGO_DOOR"
                                      ? `Est. GH₵${(ord.estimatedDeliveryFee || 25).toFixed(2)}`
                                      : "Courier Rate"}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {ord.deliveryMethod === "SELF_PICKUP"
                                    ? "Collect your packages free at East Legon Hub."
                                    : "Delivery fee is paid directly to the courier upon delivery."}
                                </p>
                              </div>

                              {ord.rider ? (
                                <>
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Courier / Rider Details</p>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{ord.rider.name.charAt(0)}</div>
                                    <div className="flex-1">
                                      <p className="font-bold text-sm">{ord.rider.name}</p>
                                      <p className="text-xs text-slate-400">{ord.rider.vehicle}</p>
                                    </div>
                                    <a href={`tel:${ord.rider.phone}`} className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                                      <Phone className="w-4 h-4" />
                                    </a>
                                  </div>
                                </>
                              ) : null}

                              <Link
                                href={`/orders/${ord.id || ord._id}`}
                                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors mt-2"
                              >
                                <Navigation className="w-3.5 h-3.5" /> View Live Order Tracking
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ── C. Delivery Address ───────────────────────────────────────── */}
            {activeModal === "address" && (
              <div className="max-w-2xl mx-auto w-full p-4 space-y-3">
                {showAddAddress ? (
                  <form onSubmit={handleSaveAddress} className="space-y-3">
                    <p className="font-bold text-xs text-blue-600 uppercase tracking-wider">{editingAddress ? "Edit Address" : "Add New Address"}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["HOME","OFFICE","OTHER"] as AddrLabel[]).map((lbl) => (
                        <button key={lbl} type="button" onClick={() => setAddrForm((f) => ({ ...f, label: lbl }))}
                          className={`py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${addrForm.label === lbl ? "bg-blue-600 text-white border-blue-600" : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                          {addrLabelIcon[lbl]}{lbl}
                        </button>
                      ))}
                    </div>
                    <div><label className={labelCls}>Full Name</label><input type="text" required placeholder="e.g. Mohammed Fareed" value={addrForm.fullName} onChange={(e) => setAddrForm((f) => ({ ...f, fullName: e.target.value }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Phone Number</label><input type="tel" placeholder="e.g. +233 20 000 0000" value={addrForm.phone} onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Region</label><select value={addrForm.region} onChange={(e) => setAddrForm((f) => ({ ...f, region: e.target.value }))} className={inputCls}>{GHANA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
                    <div><label className={labelCls}>City / Town</label><input type="text" placeholder="e.g. Accra" value={addrForm.city} onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Area / Suburb</label><input type="text" required placeholder="e.g. East Legon, Spintex" value={addrForm.area} onChange={(e) => setAddrForm((f) => ({ ...f, area: e.target.value }))} className={inputCls} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className={labelCls}>Street</label><input type="text" placeholder="Street name" value={addrForm.street} onChange={(e) => setAddrForm((f) => ({ ...f, street: e.target.value }))} className={inputCls} /></div>
                      <div><label className={labelCls}>House / Bldg #</label><input type="text" placeholder="e.g. House 14" value={addrForm.houseNumber} onChange={(e) => setAddrForm((f) => ({ ...f, houseNumber: e.target.value }))} className={inputCls} /></div>
                    </div>
                    <div><label className={labelCls}>GhanaPost Digital Address</label><input type="text" placeholder="e.g. GA-123-4567" value={addrForm.digitalAddress} onChange={(e) => setAddrForm((f) => ({ ...f, digitalAddress: e.target.value }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Popular Landmark</label><input type="text" placeholder="e.g. Near Shell Station" value={addrForm.landmark} onChange={(e) => setAddrForm((f) => ({ ...f, landmark: e.target.value }))} className={inputCls} /></div>
                    <div><label className={labelCls}>Delivery Instructions</label><textarea rows={2} placeholder="e.g. Call when at gate" value={addrForm.deliveryInstructions} onChange={(e) => setAddrForm((f) => ({ ...f, deliveryInstructions: e.target.value }))} className={`${inputCls} resize-none`} /></div>
                    <button type="button" onClick={handleGetGps} id="btn-use-location" disabled={gpsLoading}
                      className={`w-full py-2.5 rounded-xl border-2 border-dashed font-bold text-xs flex items-center justify-center gap-2 transition-colors ${gpsLoading ? "border-blue-300 text-blue-400" : "border-blue-400 text-blue-600 hover:border-blue-600 hover:bg-blue-50"}`}>
                      {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                      {gpsLoading ? "Getting location..." : "📍 Use Current Location"}
                    </button>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => { setShowAddAddress(false); setEditingAddress(null); setAddrForm(blankAddr()); }}
                        className={`flex-1 py-2.5 rounded-xl font-bold text-xs ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>Cancel</button>
                      <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors">
                        {editingAddress ? "Update Address" : "Save Address"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {addresses.length === 0 && (
                      <div className="text-center py-16 text-slate-400">
                        <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-bold">No saved addresses</p>
                      </div>
                    )}
                    {addresses.map((addr) => {
                      const addrId = addr._id || addr.id;
                      return (
                        <div key={addrId} className={`p-4 rounded-2xl border relative ${addr.isDefault ? "border-blue-500 bg-blue-50/20" : isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-blue-100 text-blue-800"}`}>
                                {addrLabelIcon[addr.label]}{addr.label}
                              </span>
                              {addr.isDefault && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Default</span>}
                            </div>
                            <div className="relative">
                              <button onClick={() => setAddrMenuId(addrMenuId === addrId ? null : addrId)}
                                className={`p-1.5 rounded-full transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-200 text-slate-500"}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {addrMenuId === addrId && (
                                <div className={`absolute right-0 top-8 z-10 min-w-[150px] rounded-xl shadow-lg border overflow-hidden ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                                  <button onClick={() => handleEditAddress(addr)} className={`w-full px-4 py-2.5 text-xs font-bold text-left flex items-center gap-2 ${isDarkMode ? "hover:bg-slate-700 text-slate-200" : "hover:bg-slate-50 text-slate-700"}`}>
                                    <Edit3 className="w-3.5 h-3.5" /> Edit Address
                                  </button>
                                  {!addr.isDefault && (
                                    <button onClick={() => { handleSetDefaultAddress(addrId); setAddrMenuId(null); }} className={`w-full px-4 py-2.5 text-xs font-bold text-left flex items-center gap-2 ${isDarkMode ? "hover:bg-slate-700 text-blue-400" : "hover:bg-blue-50 text-blue-600"}`}>
                                      <Star className="w-3.5 h-3.5" /> Set as Default
                                    </button>
                                  )}
                                  <button onClick={() => { handleDeleteAddress(addrId); setAddrMenuId(null); }} className={`w-full px-4 py-2.5 text-xs font-bold text-left flex items-center gap-2 ${isDarkMode ? "hover:bg-slate-700 text-rose-400" : "hover:bg-rose-50 text-rose-600"}`}>
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className={`font-bold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>{[addr.houseNumber, addr.street, addr.area].filter(Boolean).join(", ")}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{[addr.city, addr.region, "Ghana"].filter(Boolean).join(", ")}</p>
                          {addr.digitalAddress && <p className="text-[11px] text-blue-600 font-mono mt-1">📍 {addr.digitalAddress}</p>}
                          {addr.landmark && <p className="text-[11px] text-slate-400 mt-0.5">Landmark: {addr.landmark}</p>}
                          {addr.fullName && <p className="text-[11px] text-slate-400 mt-0.5">{addr.fullName} · {addr.phone}</p>}
                        </div>
                      );
                    })}
                    <button onClick={() => { setAddrForm(blankAddr()); setShowAddAddress(true); }} id="btn-add-address"
                      className={`w-full py-3.5 rounded-2xl border-2 border-dashed text-blue-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors ${isDarkMode ? "border-slate-700 hover:border-blue-500" : "border-slate-200 hover:border-blue-500"}`}>
                      <Plus className="w-4 h-4" /> Add New Address
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── D. Payment Methods ───────────────────────────────────────── */}
            {activeModal === "payment" && (
              <div className="max-w-2xl mx-auto w-full p-4 space-y-3">
                {showAddPayment ? (
                  <form onSubmit={handleSavePayment} className="space-y-3">
                    <p className="font-bold text-xs text-blue-600 uppercase tracking-wider">Add Payment Method</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([{ key: "MOMO", label: "Mobile Money" }, { key: "BANK", label: "Bank Transfer" }] as {key:PayType,label:string}[]).map((t) => (
                        <button key={t.key} type="button" onClick={() => setPayType(t.key)}
                          className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${payType === t.key ? "bg-blue-600 text-white border-blue-600" : isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                    {payType === "MOMO" ? (
                      <>
                        <div><label className={labelCls}>Network Provider</label>
                          <select value={momoProvider} onChange={(e) => setMomoProvider(e.target.value)} className={inputCls}>
                            <option value="MTN Mobile Money">MTN Mobile Money</option>
                            <option value="Telecel Cash">Telecel Cash</option>
                            <option value="AT Money">AT Money</option>
                          </select>
                        </div>
                        <div><label className={labelCls}>Phone Number</label><input type="tel" required placeholder="e.g. 024 123 4567" value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} className={inputCls} /></div>
                      </>
                    ) : (
                      <>
                        <div><label className={labelCls}>Bank Name</label>
                          <select value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputCls}>
                            {["GCB Bank","Ecobank","Stanbic Bank","Fidelity Bank","CalBank","Absa Bank","UBA Ghana"].map(b => <option key={b} value={b}>{b}</option>)}
                          </select>
                        </div>
                        <div><label className={labelCls}>Account Name</label><input type="text" required placeholder="Account holder name" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Account Number</label><input type="text" required placeholder="Account number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className={inputCls} /></div>
                      </>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={() => setShowAddPayment(false)} className={`flex-1 py-2.5 rounded-xl font-bold text-xs ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>Cancel</button>
                      <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors">Save Method</button>
                    </div>
                  </form>
                ) : (
                  <>
                    {paymentMethods.map((pay) => (
                      <div key={pay.id} className={`p-4 rounded-2xl border ${pay.isDefault ? "border-blue-500 bg-blue-50/20" : isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-[10px]">{pay.type === "MOMO" ? "MoMo" : "BANK"}</div>
                            <div>
                              <p className={`font-bold text-xs ${isDarkMode ? "text-white" : "text-slate-900"}`}>{pay.provider}</p>
                              <p className="text-xs text-slate-400 font-mono">{pay.number}</p>
                            </div>
                          </div>
                          {pay.isDefault && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Default</span>}
                        </div>
                        <div className="flex gap-2 mt-3">
                          {!pay.isDefault && (
                            <button onClick={() => handleSetDefaultPayment(pay.id)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${isDarkMode ? "bg-slate-800 text-blue-400 hover:bg-slate-700" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
                              <Star className="w-3 h-3" /> Set Default
                            </button>
                          )}
                          <button onClick={() => handleDeletePayment(pay.id)} className={`py-2 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${isDarkMode ? "bg-slate-800 text-rose-400 hover:bg-slate-700" : "bg-rose-50 text-rose-600 hover:bg-rose-100"}`}>
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setShowAddPayment(true)} id="btn-add-payment"
                      className={`w-full py-3.5 rounded-2xl border-2 border-dashed text-blue-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors ${isDarkMode ? "border-slate-700 hover:border-blue-500" : "border-slate-200 hover:border-blue-500"}`}>
                      <Plus className="w-4 h-4" /> Add Payment Method
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── E. Wishlist ──────────────────────────────────────────────── */}
            {activeModal === "wishlist" && (
              <div className="max-w-2xl mx-auto w-full p-4 space-y-3">
                {wishlistedProducts.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Heart className="w-10 h-10 text-slate-300 mx-auto stroke-[1.5]" />
                    <p className="text-sm font-bold text-slate-700">Your wishlist is empty</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Save your favourite water packs while browsing the store.</p>
                    <Link href="/shop" onClick={closeModal} className="inline-flex items-center justify-center py-2.5 px-5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">Browse Water Packs</Link>
                  </div>
                ) : (
                  wishlistedProducts.map((product) => (
                    <div key={product.id} className={`p-3 rounded-2xl border flex items-center gap-3 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                      <div className="w-14 h-14 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-slate-100">
                        {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain" /> : <ShoppingBag className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs truncate leading-snug">{product.name}</h4>
                        <p className={`font-black text-sm mt-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>GH₵{product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleQuickAdd(product)} className={`p-2 rounded-xl text-xs font-bold transition-all ${quickAddedId === product.id ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"}`}>
                          {quickAddedId === product.id ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                        <button onClick={() => toggleWishlist(product.id)} className="p-2 rounded-xl text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── F. Recently Viewed ────────────────────────────────────────── */}
            {activeModal === "recent" && (
              <div className="max-w-2xl mx-auto w-full p-4 space-y-3">
                {recentProducts.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-bold">Nothing viewed yet</p>
                  </div>
                ) : (
                  recentProducts.map((product) => (
                    <div key={product.id} className={`p-3 rounded-2xl border flex items-center gap-3 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                      <div className="w-14 h-14 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-slate-100">
                        {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain" /> : <ShoppingBag className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs truncate leading-snug">{product.name}</h4>
                        <p className={`font-black text-sm mt-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>GH₵{product.price.toFixed(2)}</p>
                      </div>
                      <button onClick={() => handleQuickAdd(product)} className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${quickAddedId === product.id ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"}`}>
                        {quickAddedId === product.id ? "Added!" : "Add to Bag"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── G. Settings ──────────────────────────────────────────────── */}
            {activeModal === "settings" && (
              <div className="max-w-2xl mx-auto w-full p-4 space-y-5">
                {/* Profile */}
                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <p className="font-bold text-xs text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> Personal Information</p>
                  <div><label className={labelCls}>Full Name</label><input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} className={inputCls} /></div>
                  {profileSuccess && <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Profile saved successfully!</div>}
                  <button type="submit" disabled={profileSaving} className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all">
                    {profileSaving ? "Saving..." : "Save Name"}
                  </button>
                </form>

                {/* Change Email */}
                <div className={`pt-4 border-t space-y-3 ${isDarkMode ? "border-slate-800" : "border-slate-200/60"}`}>
                  <button onClick={() => { setShowEmailForm((v) => !v); setEmailStep("input"); }} className="w-full flex items-center justify-between text-left">
                    <p className="font-bold text-xs text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Change Email</p>
                    {showEmailForm ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {showEmailForm && (
                    <>
                      <p className="text-[11px] text-slate-400">Current: <span className="font-mono">{displayEmail}</span></p>
                      {emailStep === "input" && (
                        <form onSubmit={handleRequestEmailChange} className="space-y-3">
                          <div><label className={labelCls}>New Email Address</label><input type="email" required placeholder="new@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputCls} /></div>
                          <button type="submit" disabled={emailLoading} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors">
                            {emailLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send Verification Code"}
                          </button>
                        </form>
                      )}
                      {emailStep === "verify" && (
                        <form onSubmit={handleVerifyEmail} className="space-y-3">
                          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium">A 6-digit code was sent to <strong>{newEmail}</strong>.</div>
                          <div><label className={labelCls}>Verification Code</label><input type="text" required maxLength={6} placeholder="123456" value={emailVerifCode} onChange={(e) => setEmailVerifCode(e.target.value)} className={`${inputCls} tracking-widest text-center text-lg`} /></div>
                          <button type="submit" disabled={emailLoading} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors">
                            {emailLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Email Change"}
                          </button>
                        </form>
                      )}
                      {emailStep === "done" && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Email updated to {newEmail}!</div>}
                    </>
                  )}
                </div>

                {/* Change Phone */}
                <div className={`pt-4 border-t space-y-3 ${isDarkMode ? "border-slate-800" : "border-slate-200/60"}`}>
                  <button onClick={() => { setShowPhoneForm((v) => !v); setPhoneStep("input"); }} className="w-full flex items-center justify-between text-left">
                    <p className="font-bold text-xs text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Change Phone Number</p>
                    {showPhoneForm ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {showPhoneForm && (
                    <>
                      <p className="text-[11px] text-slate-400">Current: <span className="font-mono">{userPhone}</span></p>
                      {phoneStep === "input" && (
                        <form onSubmit={handleRequestPhoneChange} className="space-y-3">
                          <div><label className={labelCls}>New Phone Number</label><input type="tel" required placeholder="+233 XX XXX XXXX" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className={inputCls} /></div>
                          <button type="submit" disabled={phoneLoading} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors">
                            {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Send OTP"}
                          </button>
                        </form>
                      )}
                      {phoneStep === "otp" && (
                        <form onSubmit={handleVerifyPhoneOtp} className="space-y-3">
                          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-medium">An OTP was sent to <strong>{newPhone}</strong>.</div>
                          <div><label className={labelCls}>Enter OTP</label><input type="text" required maxLength={6} placeholder="123456" value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} className={`${inputCls} tracking-widest text-center text-lg`} /></div>
                          <button type="submit" disabled={phoneLoading} className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors">
                            {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Verify OTP"}
                          </button>
                        </form>
                      )}
                      {phoneStep === "done" && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Phone updated to {userPhone}!</div>}
                    </>
                  )}
                </div>

                {/* Change Password */}
                <form onSubmit={handleChangePassword} className={`pt-4 border-t space-y-3 ${isDarkMode ? "border-slate-800" : "border-slate-200/60"}`}>
                  <p className="font-bold text-xs text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Security &amp; Password</p>
                  <div><label className={labelCls}>Current Password</label><input type="password" required value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setPasswordError(""); }} className={inputCls} /></div>
                  <div><label className={labelCls}>New Password</label><input type="password" required placeholder="Min 8 characters" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }} className={inputCls} /></div>
                  <div><label className={labelCls}>Confirm New Password</label><input type="password" required value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }} className={inputCls} /></div>
                  {passwordError && <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {passwordError}</div>}
                  {passwordSuccess && <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" /> Password changed successfully!</div>}
                  <button type="submit" disabled={passwordLoading} className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs text-white ${isDarkMode ? "bg-slate-800 hover:bg-slate-700" : "bg-slate-900 hover:bg-slate-800"}`}>
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </button>
                </form>

                {/* Notification Preferences */}
                <div className={`pt-4 border-t space-y-3 ${isDarkMode ? "border-slate-800" : "border-slate-200/60"}`}>
                  <button onClick={() => setShowNotifPrefs((v) => !v)} className="w-full flex items-center justify-between text-left" id="btn-notif-prefs-toggle">
                    <p className="font-bold text-xs text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" /> Notification Preferences</p>
                    {showNotifPrefs ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {showNotifPrefs && (
                    <div className={`rounded-2xl border divide-y ${isDarkMode ? "border-slate-800 divide-slate-800" : "border-slate-100 divide-slate-100"}`}>
                      {([
                        { key: "orderUpdates", label: "Order Updates", desc: "Pending, confirmed, delivered status", icon: <Package className="w-4 h-4 text-blue-600" /> },
                        { key: "deliveryUpdates", label: "Delivery Updates", desc: "Out for delivery, ETA changes", icon: <Truck className="w-4 h-4 text-amber-600" /> },
                        { key: "promotions", label: "Promotional Updates", desc: "Discounts, weekend offers, codes", icon: <Tag className="w-4 h-4 text-purple-600" /> },
                        { key: "wishlistPrice", label: "Wishlist Price Alerts", desc: "Price drops & stock updates", icon: <TrendingUp className="w-4 h-4 text-emerald-600" /> },
                        { key: "securityAlerts", label: "Security Alerts", desc: "New logins, password changes", icon: <Shield className="w-4 h-4 text-rose-600" /> },
                      ] as { key: keyof typeof notifPrefs; label: string; desc: string; icon: React.ReactNode }[]).map((pref) => (
                        <div key={pref.key} className="flex items-center justify-between p-3.5 gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? "bg-slate-800" : "bg-slate-50"}`}>{pref.icon}</div>
                            <div>
                              <p className={`font-bold text-xs ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{pref.label}</p>
                              <p className="text-[10px] text-slate-400">{pref.desc}</p>
                            </div>
                          </div>
                          <Toggle id={`notif-${pref.key}`} checked={notifPrefs[pref.key]} onChange={() => setNotifPrefs((prev) => ({ ...prev, [pref.key]: !prev[pref.key] }))} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dark Mode */}
                <div className={`pt-4 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200/60"}`}>
                  <div className="flex items-center justify-between py-1">
                    <p className="font-bold text-xs text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                      {isDarkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />} Dark Mode
                    </p>
                    <Toggle checked={isDarkMode} onChange={handleToggleDarkMode} id="dark-mode-settings-toggle" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{isDarkMode ? "Dark mode is on — easier on the eyes at night." : "Switch to dark mode for a sleek nighttime look."}</p>
                </div>
              </div>
            )}

            {/* ── H. Live Chat ─────────────────────────────────────────────── */}
            {activeModal === "chat" && (
              <div className="flex flex-col h-full max-w-2xl mx-auto w-full" style={{ height: "calc(100vh - 3.5rem)" }}>
                {/* Chat header banner */}
                <div className="shrink-0 p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base leading-tight">Kay&apos;s Packs Live Support</h3>
                    <p className="text-[11px] text-blue-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online &amp; Ready to Help
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDarkMode ? "bg-slate-950" : "bg-slate-50/50"}`}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                      <div className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-xs"
                          : isDarkMode ? "bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700" : "bg-white text-slate-800 rounded-bl-xs shadow-xs border border-slate-100"
                      }`}>{msg.text}</div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}
                  {isBotTyping && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 p-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-150" />
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-300" />
                    </div>
                  )}
                </div>

                {/* Quick chips */}
                <div className={`shrink-0 p-2 border-t flex gap-1.5 overflow-x-auto text-[11px] scrollbar-none ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                  <button onClick={() => handleSendMessage("When will my water pack arrive?")} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium">Track delivery</button>
                  <button onClick={() => handleSendMessage("How do I pay with MoMo?")} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium">MoMo payment</button>
                  <button onClick={() => handleSendMessage("Do you deliver bulk wholesale?")} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium">Bulk packs</button>
                </div>

                {/* Input */}
                <div className={`shrink-0 p-3 border-t flex items-center gap-2 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}>
                  <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                    placeholder="Type your question..."
                    className={`flex-1 p-2.5 rounded-xl text-xs outline-none focus:border-blue-500 ${isDarkMode ? "bg-slate-800 border border-slate-700 text-white" : "bg-slate-50 border border-slate-200 text-slate-900"}`}
                  />
                  <button onClick={() => handleSendMessage()} className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
