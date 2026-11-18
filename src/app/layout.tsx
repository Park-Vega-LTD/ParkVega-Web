import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/site";
import { Toaster } from "sonner";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { ConsentBanner } from "@/components/analytics/consent-banner";
import { ConsentDefaultScript } from "@/components/analytics/consent-default-script";
import { ConsentProvider } from "@/components/analytics/consent-provider";
import "./globals.css";

const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;

// Brand typefaces: Fredoka for headlines, Nunito Sans for reading text.
const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Park Vega Waterpark – Agbor, Delta State | Tickets from ₦20,000",
    template: "%s",
  },
  description:
    "Park Vega Waterpark in Agbor, Delta State: wave pool, thrill slides and kids' splash zones. Open Thu–Sun & public holidays. Tickets from ₦20,000.",
  applicationName: "Park Vega Waterpark",
  openGraph: { siteName: "Park Vega Waterpark", locale: "en_NG", type: "website" },
  // Google Search Console ownership (only needed if not verified by DNS).
  ...(GSC_VERIFICATION ? { verification: { google: GSC_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#071A42",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunitoSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <ConsentDefaultScript />
          <Providers>
            <ConsentProvider>
              {children}
              <Toaster />
              <ConsentBanner />
              <AnalyticsScripts />
            </ConsentProvider>
          </Providers>
        </body>
    </html>
  );
}
