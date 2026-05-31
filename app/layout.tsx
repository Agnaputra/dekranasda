import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dekranasda Inventory & Kasir",
  description: "Sistem Manajemen Stok & Penjualan Terintegrasi Aiven MySQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full bg-slate-950 antialiased">
      <body className={`${inter.className} min-h-screen text-slate-100 flex flex-col lg:flex-row bg-slate-950`}>
        {/* Navigation Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
