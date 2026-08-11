import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["cyrillic", "latin"], weight: ["500", "600", "700"] });
const sans = Manrope({ variable: "--font-sans", subsets: ["cyrillic", "latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Love Mailbox", template: "%s — Love Mailbox" },
  description: "A tiny mailbox filled with letters for someone special.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f2b48b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
