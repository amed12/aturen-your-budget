import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { BottomNav } from '@/components/BottomNav';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aturen - Budgeting Keluarga",
  description: "Aplikasi pencatatan keuangan keluarga paling simpel",
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
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
