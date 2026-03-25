import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSiteData } from "@/lib/data";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0A0F",
};

export async function generateMetadata(): Promise<Metadata> {
  const siteData = await getSiteData();

  return {
    metadataBase: new URL(siteData.meta.url),
    title: siteData.meta.title,
    description: siteData.meta.description,
    keywords: [
      "full stack developer",
      "react",
      "next.js",
      "typescript",
      "node.js",
      "portfolio",
    ],
    authors: [{ name: siteData.hero.name }],
    icons: {
      icon: withBasePath("/favicon.ico"),
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      title: siteData.meta.title,
      description: siteData.meta.description,
      siteName: "Clawfolio",
      url: siteData.meta.url,
    },
    twitter: {
      card: "summary_large_image",
      title: siteData.meta.title,
      description: siteData.meta.description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteData = await getSiteData();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: siteData.hero.name,
              url: siteData.meta.url,
              jobTitle: siteData.hero.role,
              sameAs: [
                siteData.hero.socials.github,
                siteData.hero.socials.linkedin,
                siteData.hero.socials.twitter,
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
