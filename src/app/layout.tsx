import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { QueryProvider } from "@/lib/providers/query-provider";
import { OfflineIndicator } from "@/components/offline/offline-indicator";

export const metadata: Metadata = {
  title: "Winter Arc - AI-Powered Training",
  description: "AI-powered fitness tracking and programming",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Winter Arc",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#8B5CF6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <QueryProvider>
            {children}
            <OfflineIndicator />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
