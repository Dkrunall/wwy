import type { Metadata } from "next";
import { Instrument_Serif, Outfit } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { CartProvider } from "@/components/CartContext";
import { BUSINESS } from "@/lib/business";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wildwildyeast.com";

const DESCRIPTION =
  "Bake-to-order sourdough, delivered across Mumbai every Wednesday and Saturday.";

// Title and description follow the website action plan (C1, C2) minus the ginger ale wording,
// which returns once ferments are listed in the shop (decision D1).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Wild Wild Yeast | Sourdough, Mumbai", template: "%s | Wild Wild Yeast" },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Wild Wild Yeast",
    locale: "en_IN",
    title: "Wild Wild Yeast | Sourdough, Mumbai",
    description: DESCRIPTION,
    images: [{ url: "/product_img/4-dutch-oven.jpg", alt: "Sourdough loaf, straight out of the Dutch oven" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wild Wild Yeast | Sourdough, Mumbai",
    description: DESCRIPTION,
    images: ["/product_img/4-dutch-oven.jpg"],
  },
};

const LOCAL_BUSINESS_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "Wild Wild Yeast",
  legalName: BUSINESS.legalName,
  url: SITE_URL,
  image: `${SITE_URL}/product_img/4-dutch-oven.jpg`,
  description: DESCRIPTION,
  telephone: BUSINESS.carePhone,
  ...(BUSINESS.careEmail ? { email: BUSINESS.careEmail } : {}),
  ...(BUSINESS.gstin ? { taxID: BUSINESS.gstin } : {}),
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mumbai",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
    ...(BUSINESS.registeredAddress ? { streetAddress: BUSINESS.registeredAddress } : {}),
  },
  areaServed: { "@type": "City", name: "Mumbai" },
  sameAs: [BUSINESS.instagramUrl],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${outfit.variable} antialiased selection:bg-brand-accent selection:text-white`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSON_LD) }}
        />
        <CartProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </CartProvider>
      </body>
    </html>
  );
}
