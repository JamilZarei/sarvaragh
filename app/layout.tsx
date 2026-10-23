import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { preconnect } from "react-dom";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { TouchHover } from "@/components/motion/touch-hover";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE_DESCRIPTION, SITE_NAME, SITE_NAME_EN } from "@/lib/constants";

import "./globals.css";

/*
 * Main typeface: B Nazanin, limited to Arabic-script code points and scaled up
 * (it renders small at the same nominal size). Latin text falls through to
 * Vazirmatn / Newsreader. See app/fonts/NOTICE-b-nazanin.txt.
 */
const bNazanin = localFont({
  src: [
    { path: "./fonts/BNazanin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/BNazanin-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-nazanin",
  display: "swap",
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+00AB, U+00BB",
    },
    { prop: "size-adjust", value: "118%" },
  ],
});

/* Fallback and Latin fonts are self-hosted (SIL Open Font License, see app/fonts/LICENSE-*.txt). */
const vazirmatn = localFont({
  src: "./fonts/vazirmatn-arabic-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-vazirmatn",
  display: "swap",
  preload: false,
});

const vazirmatnLatin = localFont({
  src: "./fonts/vazirmatn-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-vazirmatn-latin",
  display: "swap",
});

/* Editorial serif used for Latin book titles. */
const newsreader = localFont({
  src: "./fonts/newsreader-latin-opsz-normal.woff2",
  weight: "200 800",
  variable: "--font-newsreader",
  display: "swap",
  preload: false,
});

/** Absolute base for Open Graph URLs: explicit setting, else the Vercel production domain, else local. */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | ${SITE_NAME_EN} — کتاب بعدی‌ات را کشف کن`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: `${SITE_NAME} | ${SITE_NAME_EN}`,
    title: `${SITE_NAME} — کتاب بعدی‌ات را کشف کن`,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f0" },
    { media: "(prefers-color-scheme: dark)", color: "#131512" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Covers come from Open Library; open the connection early.
  preconnect("https://covers.openlibrary.org");
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={`${bNazanin.variable} ${vazirmatn.variable} ${vazirmatnLatin.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <DirectionProvider dir="rtl">
            <TooltipProvider delayDuration={400}>
              <Header />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
              <Toaster position="bottom-center" dir="rtl" />
              <TouchHover />
            </TooltipProvider>
          </DirectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
