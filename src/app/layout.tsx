import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/theme-context";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('kays_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-slate-50 dark:bg-black text-slate-900 dark:text-neutral-100 min-h-screen selection:bg-blue-600 selection:text-white transition-colors duration-200">
        <AuthSessionProvider>
          <ThemeProvider>
            <CartProvider>
              <ChatProvider>
                {children}
                <CustomerChatWidget />
              </ChatProvider>
            </CartProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
