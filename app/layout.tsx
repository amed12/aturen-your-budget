import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { BottomNav } from '@/components/BottomNav';
import { OfflineSync } from '@/components/OfflineSync';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Aturen - Budgeting Keluarga",
  description: "Aplikasi pencatatan keuangan keluarga paling simpel",
  manifest: "/manifest.json",
  themeColor: "#D4845A",
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
      <body className={`${inter.variable} ${nunito.variable} font-[family-name:var(--font-inter)] mx-auto max-w-md min-h-screen relative pb-20`} style={{ color: '#3D2C2E' }}>
        {children}
        <BottomNav />
        <OfflineSync />
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'rgba(255, 253, 251, 0.95)',
              backdropFilter: 'blur(20px)',
              color: '#3D2C2E',
              borderRadius: '16px',
              border: '1px solid rgba(232, 168, 124, 0.2)',
              boxShadow: '0 8px 32px rgba(139, 74, 39, 0.1)',
              fontFamily: 'var(--font-nunito), sans-serif',
              fontWeight: '600',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#85BDA6', secondary: '#F0F7F4' },
            },
            error: {
              iconTheme: { primary: '#E07A7A', secondary: '#FFF2F2' },
            },
          }}
        />
      </body>
    </html>
  );
}
