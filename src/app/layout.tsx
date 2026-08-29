import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { ChatProvider } from "@/context/chat-context";
import { AuthSessionProvider } from "@/components/ui/session-provider";
import { CustomerChatWidget } from "@/components/chat/CustomerChatWidget";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kay's Packs — Pure Water Delivered to Your Door",
    template: "%s | Kay's Packs",
  },
  description:
    "Order your favourite water brands — Voltic, Bel-Aqua, Verna, Awake, Perla, Slem Fit and more — online and get them delivered nationwide across Ghana.",
  keywords: [
    "water delivery Ghana",
    "buy water online Ghana",
    "Voltic water delivery",
    "Bel-Aqua delivery",
    "water delivery Accra",
    "water delivery Kumasi",
    "wholesale water packs",
    "Kay's Packs Ghana",
  ],
  openGraph: {
    title: "Kay's Packs — Pure Water Delivered to Your Door",
    description:
      "Order water packs from top Ghanaian brands and get them delivered anywhere in Ghana.",
    type: "website",
    locale: "en_GH",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        <AuthSessionProvider>
          <CartProvider>
            <ChatProvider>
              {children}
              <CustomerChatWidget />
            </ChatProvider>
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
