import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { BottomNav } from '@/components/BottomNav';
import { OfflineSync } from '@/components/OfflineSync';

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#111827",
};

export const metadata: Metadata = {
  title: "Aturen - Budgeting Keluarga",
  description: "Aplikasi pencatatan keuangan keluarga paling simpel",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aturen",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 text-gray-900 mx-auto max-w-md min-h-screen relative pb-20`}>
        {children}
        <BottomNav />
        <OfflineSync />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
