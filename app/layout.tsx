import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AppSidebar from "./components/common/AppSidebar";
import AppToaster from "./components/common/AppToaster";
import AuthSessionGuard from "./components/common/AuthSessionGuard";
import Providers from "./providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = "IssueFixu";
const appDescription =
  "IssueFixu is a modern QA defect tracking and analytics platform that helps teams log issues, monitor trends, and ship better software faster.";
const appUrl = process.env.APP_BASE_URL || "http://localhost:3000";
const ogImage = "/ogImage.png";
const ogImageUrl = new URL(ogImage, appUrl).toString();
const faviconUrl = "/favicon.ico?v=20260412";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${appName} | QA Defect Tracking & Analytics Platform`,
    template: `%s | ${appName}`,
  },
  description: appDescription,
  applicationName: appName,
  keywords: [
    "IssueFixu",
    "QA defect tracking",
    "bug tracking",
    "quality assurance dashboard",
    "test execution analytics",
    "software quality metrics",
    "defect management",
    "test cycle monitoring",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: appName,
    title: `${appName} | QA Defect Tracking & Analytics Platform`,
    description: appDescription,
    images: [
      {
        url: ogImageUrl,
        secureUrl: ogImageUrl,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: `${appName} social preview image`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} | QA Defect Tracking & Analytics Platform`,
    description: appDescription,
    images: [ogImageUrl],
  },
  icons: {
    icon: faviconUrl,
    shortcut: faviconUrl,
    apple: faviconUrl,
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${poppins.className} ${geistMono.variable} antialiased`}
      >
        <Script
          id="issuefixu-jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: appName,
            url: appUrl,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: appDescription,
          })}
        </Script>
        <Providers>
          <div className="flex min-h-screen w-full bg-(--page-background)">
            <AppSidebar />
            <div className="min-w-0 flex-1">
              <AuthSessionGuard />
              <AppToaster />
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
