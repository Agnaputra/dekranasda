"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Download, 
  Search, 
  Calendar,
  AlertCircle, 
  ShoppingBag,
  DollarSign,
  Package
} from "lucide-react";
import * as XLSX from "xlsx";

interface Product {
  id: number;
  barcode: string;
  name: string;
  unit: string;
  basePrice: number;
  sellingPrice: number;
  initialStock: number;
  additionalStock: number;
  currentStock: number;
  sales: {
    quantitySold: number;
    totalPayment: number;
    profit: number;
    date: string;
  }[];
}

interface SaleRecord {
  id: number;
  productId: number;
  quantitySold: number;
  totalPayment: number;
  profit: number;
  date: string;
  product: {
    barcode: string;
    name: string;
    unit: string;
    basePrice: number;
    sellingPrice: number;
  };
}

export default function Laporan() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [exportLoading, setExportLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, productsRes] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/products"),
      ]);

      if (!salesRes.ok || !productsRes.ok) {
        throw new Error("Gagal mengambil data dari database Aiven.");
      }

      const salesData = await salesRes.json();
      const productsData = await productsRes.json();

      setSales(salesData);
      setProducts(productsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal memuat laporan penjualan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Filter Sales Records for transaction table
  const filteredSales = sales.filter((sale) => {
    const matchesSearch = 
      sale.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.product.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const saleDateObj = new Date(sale.date);
    const filterDateObj = dateFilter ? new Date(dateFilter) : null;
    
    const matchesDate = filterDateObj 
      ? saleDateObj.toDateString() === filterDateObj.toDateString()
      : true;

    return matchesSearch && matchesDate;
  });

  // Calculate Aggregates
  const totalQtySold = filteredSales.reduce((sum, item) => sum + item.quantitySold, 0);
  const totalRevenue = filteredSales.reduce((sum, item) => sum + item.totalPayment, 0);
  const totalProfit = filteredSales.reduce((sum, item) => sum + item.profit, 0);

  // Helper to compute daily sales quantity for a specific day of the current month
  const getDailySalesQty = (productSales: any[], day: number) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return productSales
      .filter((s) => {
        const d = new Date(s.date);
        return (
          d.getDate() === day &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((sum, s) => sum + s.quantitySold, 0);
  };

  // Export to Excel Function (Aligned exactly with the client's spreadsheet layout)
  const handleExportToExcel = async () => {
    if (products.length === 0) return;
    setExportLoading(true);

    try {
      // Structure the data to match the Excel sheet layout
      const exportRows = products.map((product) => {
        const totalSold = product.sales.reduce((sum, s) => sum + s.quantitySold, 0);
        const totalRevenue = product.sales.reduce((sum, s) => sum + s.totalPayment, 0);
        const totalProfit = product.sales.reduce((sum, s) => sum + s.profit, 0);
        
        const row: any = {
          "Nama": product.name,
          "Harga asli": product.basePrice,
          "Jumlah Stok": product.currentStock,
          "Satuan": product.unit,
          "Harga30%": product.basePrice * 0.3,
          "HJA": product.sellingPrice,
          "StokAwal": product.initialStock,
        };

        // Add sales columns for days 1 to 12
        for (let day = 1; day <= 12; day++) {
          const qty = getDailySalesQty(product.sales, day);
          row[`${day}`] = qty || ""; // Blank if 0
        }

        row["Stok tambahan"] = product.additionalStock || 0;
        row["Jumlah Penjualan"] = totalSold;
        row["Pembayaran"] = totalRevenue;
        row["Keuntungan"] = totalProfit;

        return row;
      });

      // Create sheet from JSON
      const worksheet = XLSX.utils.json_to_sheet(exportRows);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Stok & Penjualan");

      // Auto-fit column widths
      const colWidths = [
        { wch: 25 }, // Nama
        { wch: 12 }, // Harga asli
        { wch: 12 }, // Jumlah Stok
        { wch: 8 },  // Satuan
        { wch: 12 }, // Harga30%
        { wch: 12 }, // HJA
        { wch: 10 }, // StokAwal
        // Columns 1-12
        ...Array(12).fill({ wch: 4 }),
        { wch: 14 }, // Stok tambahan
        { wch: 15 }, // Jumlah Penjualan
        { wch: 15 }, // Pembayaran
        { wch: 15 }, // Keuntungan
      ];
      worksheet["!cols"] = colWidths;

      // Trigger file download
      const filename = `Laporan_Stok_Keuntungan_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Export error:", err);
      alert("Terjadi kesalahan saat mengunduh laporan Excel.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2.5">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <span>Laporan Keuntungan</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Riwayat lengkap transaksi harian dan export file laporan fisik ke format spreadsheet (.xlsx).
          </p>
        </div>
        <button
          onClick={handleExportToExcel}
          disabled={products.length === 0 || exportLoading || loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-semibold transition-all disabled:opacity-55 disabled:scale-100 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Download className={`h-5 w-5 text-emerald-400 ${exportLoading ? "animate-bounce" : ""}`} />
          <span>{exportLoading ? "Mengekspor..." : "Export ke Excel"}</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Aggregate Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-teal-400">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Total Barang Terjual (Terfilter)</p>
            <h3 className="text-2xl font-bold mt-1 text-white font-mono">
              {loading ? "..." : totalQtySold} item
            </h3>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-blue-400">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Total Omset Penjualan (Terfilter)</p>
            <h3 className="text-2xl font-bold mt-1 text-white font-mono">
              {loading ? "..." : formatRupiah(totalRevenue)}
            </h3>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Total Profit Bersih (Terfilter)</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-400 font-mono">
              {loading ? "..." : formatRupiah(totalProfit)}
            </h3>
          </div>
        </div>
      </div>

      {/* Reports Table Panel */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden backdrop-blur-xl">
        {/* Filters */}
        <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Riwayat Transaksi Penjualan</span>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-normal">
              {filteredSales.length} Transaksi
            </span>
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari barcode / nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Date Filter */}
            <div className="relative w-full sm:w-48">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Tanggal & Waktu</th>
                <th className="py-4 px-6">Barcode</th>
                <th className="py-4 px-6">Nama Produk</th>
                <th className="py-4 px-6 text-center">Jumlah</th>
                <th className="py-4 px-6 text-right">Total Bayar</th>
                <th className="py-4 px-6 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-40"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-8 mx-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr 
                    key={sale.id} 
                    className="hover:bg-slate-800/20 transition-all text-sm group"
                  >
                    <td className="py-4 px-6 text-slate-400 font-mono">
                      {formatDate(sale.date)}
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-300">
                      {sale.product.barcode}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-200 group-hover:text-white">
                      {sale.product.name}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-300 font-mono font-medium">
                      {sale.quantitySold} {sale.product.unit}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-250 font-mono font-semibold">
                      {formatRupiah(sale.totalPayment)}
                    </td>
                    <td className="py-4 px-6 text-right text-emerald-400 font-semibold font-mono">
                      {formatRupiah(sale.profit)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="text-base">Belum ada riwayat transaksi</p>
                    <p className="text-xs mt-1 text-slate-600">
                      Transaksi yang Anda lakukan di menu Kasir akan muncul di sini.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
