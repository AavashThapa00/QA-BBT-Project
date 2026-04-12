import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Navigation from "./components/common/Navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className="dark">
      <body
        className={`${poppins.className} ${geistMono.variable} antialiased bg-slate-950`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
