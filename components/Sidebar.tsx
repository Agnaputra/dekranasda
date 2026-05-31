"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  TrendingUp, 
  PlusCircle, 
  Menu, 
  X,
  PackageCheck
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      name: "Dashboard Stok",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Tambah Produk",
      href: "/products/new",
      icon: PlusCircle,
    },
    {
      name: "Kasir Penjualan",
      href: "/kasir",
      icon: ShoppingCart,
    },
    {
      name: "Laporan Keuntungan",
      href: "/laporan",
      icon: TrendingUp,
    },
  ];

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 shadow-md">
        <div className="flex items-center space-x-2">
          <PackageCheck className="h-6 w-6 text-emerald-400" />
          <span className="text-lg font-bold tracking-wider">DEKRANASDA POS</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:text-emerald-400 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 text-white px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-md shadow-emerald-900/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white min-h-screen shrink-0 p-5 shadow-2xl">
        <div className="flex items-center space-x-3 px-2 py-4 mb-8">
          <PackageCheck className="h-8 w-8 text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              DEKRANASDA
            </h1>
            <p className="text-xs text-emerald-400 font-semibold tracking-widest uppercase">
              Inventory & Kasir
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/10"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-800/80 px-2 text-center">
          <p className="text-xs text-slate-500">v1.0.0 • Connected to Aiven</p>
        </div>
      </aside>
    </>
  );
}
