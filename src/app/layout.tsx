import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { PatProvider } from "@/lib/pat-context";
import { PageTracker } from "@/components/page-tracker";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DARA Docs - Repository Documentation Portal",
  description:
    "Internal documentation portal for DARA team repositories at Globe Telecom",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>
          <PatProvider>
            <Suspense>
              <Navbar />
            </Suspense>
            <main className="flex-1">{children}</main>
          </PatProvider>
        </AuthProvider>
        <PageTracker />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
