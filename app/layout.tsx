import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navigation from "./components/common/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QA/BBT Defect Analytics Dashboard",
  description: "Production-ready defect analytics dashboard for QA/BBT testing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (() => {
              try {
                const stored = localStorage.getItem("theme");
                const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const theme = stored === "light" || stored === "dark" ? stored : (systemPrefersDark ? "dark" : "light");
                document.documentElement.classList.remove("light", "dark");
                document.documentElement.classList.add(theme);
                document.documentElement.setAttribute("data-theme", theme);
              } catch {
                document.documentElement.classList.add("dark");
                document.documentElement.setAttribute("data-theme", "dark");
              }
            })();
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
