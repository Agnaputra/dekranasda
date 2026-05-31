"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Package, 
  Layers, 
  DollarSign, 
  Search, 
  Plus, 
  RefreshCw,
  AlertCircle,
  PlusCircle,
  X,
  CheckCircle,
  Info
} from "lucide-react";

interface Sale {
  id: number;
  quantitySold: number;
  totalPayment: number;
  profit: number;
  date: string;
}

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
  sales: Sale[];
}

interface Stats {
  totalProducts: number;
  totalStock: number;
  cumulativeProfit: number;
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalStock: 0,
    cumulativeProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Restock Modal State
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<string>("");
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockSuccess, setRestockSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [statsRes, productsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/products"),
      ]);

      if (!statsRes.ok || !productsRes.ok) {
        throw new Error("Gagal mengambil data dari database Aiven.");
      }

      const statsData = await statsRes.json();
      const productsData = await productsRes.json();

      setStats(statsData);
      setProducts(productsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handleOpenRestock = (product: Product) => {
    setRestockProduct(product);
    setRestockQty("");
    setRestockSuccess(null);
    setError(null);
  };

  const handleCloseRestock = () => {
    setRestockProduct(null);
    setRestockQty("");
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || !restockQty || parseInt(restockQty) <= 0) return;

    setRestockLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/products/restock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: restockProduct.id,
          quantity: parseInt(restockQty),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menambah stok.");
      }

      setRestockSuccess(`Stok tambahan sebanyak ${restockQty} ${restockProduct.unit} berhasil ditambahkan!`);
      
      // Refresh database records
      await fetchData();

      setTimeout(() => {
        handleCloseRestock();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal menghubungkan ke database Aiven.");
    } finally {
      setRestockLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Dashboard Stok
          </h1>
          <p className="text-slate-400 mt-1">
            Data terstruktur real-time tersinkronisasi penuh dengan cloud database Aiven MySQL.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="flex items-center justify-center p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
          <Link
            href="/products/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Produk</span>
          </Link>
        </div>
      </div>

      {error && !restockProduct && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-300">Koneksi Database Bermasalah</h3>
            <p className="text-sm mt-0.5 text-red-200/80">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative group overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 hover:shadow-lg">
          <div className="absolute top-0 right-0 p-4 -mt-2 -mr-2 text-slate-800/20 pointer-events-none transition-colors group-hover:text-emerald-500/5">
            <Package className="h-28 w-28" />
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Jenis Barang</p>
              <h3 className="text-3xl font-bold mt-1 text-white">
                {loading ? "..." : stats.totalProducts}
              </h3>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 hover:shadow-lg">
          <div className="absolute top-0 right-0 p-4 -mt-2 -mr-2 text-slate-800/20 pointer-events-none transition-colors group-hover:text-teal-500/5">
            <Layers className="h-28 w-28" />
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Jumlah Stok Sekarang</p>
              <h3 className="text-3xl font-bold mt-1 text-white">
                {loading ? "..." : stats.totalStock}
              </h3>
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-xl transition-all duration-300 hover:border-slate-700/80 hover:shadow-lg">
          <div className="absolute top-0 right-0 p-4 -mt-2 -mr-2 text-slate-800/20 pointer-events-none transition-colors group-hover:text-emerald-450/5">
            <DollarSign className="h-28 w-28" />
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-emerald-400 group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white transition-all duration-300">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Profit Terkumpul</p>
              <h3 className="text-3xl font-bold mt-1 text-emerald-400">
                {loading ? "..." : formatRupiah(stats.cumulativeProfit)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Master Stock Table */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden backdrop-blur-xl">
        {/* Table Controls */}
        <div className="p-6 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Daftar Master Stok Barang</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-normal">
                {filteredProducts.length} Produk
              </span>
            </h2>
            <p className="text-xs text-slate-400">Stok awal dan tambahan dikelola dan dihitung otomatis oleh sistem.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari barcode atau nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-4 px-6">Barcode</th>
                <th className="py-4 px-6">Nama Produk</th>
                <th className="py-4 px-6 text-center">Satuan</th>
                <th className="py-4 px-6 text-right">Harga Asli</th>
                <th className="py-4 px-6 text-right">Harga Jual (HJA)</th>
                <th className="py-4 px-6 text-center">Stok Awal</th>
                <th className="py-4 px-6 text-center">Stok Tambahan</th>
                <th className="py-4 px-6 text-center">Stok Sekarang</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-48"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-12 mx-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-20 ml-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-10 mx-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-10 mx-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-10 mx-auto"></div></td>
                    <td className="py-4 px-6"><div className="h-6 bg-slate-800 rounded w-16 mx-auto"></div></td>
                  </tr>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.currentStock <= 0;
                  const isLowStock = product.currentStock > 0 && product.currentStock <= 5;
                  
                  return (
                    <tr 
                      key={product.id} 
                      className="hover:bg-slate-800/20 transition-all text-sm group"
                    >
                      <td className="py-4 px-6 font-mono text-slate-300 font-medium group-hover:text-white">
                        {product.barcode}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-200 group-hover:text-white">
                        {product.name}
                      </td>
                      <td className="py-4 px-6 text-center text-slate-400">
                        <span className="bg-slate-850 px-2 py-1 rounded-md border border-slate-800/40 text-xs">
                          {product.unit}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-slate-300 font-mono">
                        {formatRupiah(product.basePrice)}
                      </td>
                      <td className="py-4 px-6 text-right text-emerald-400 font-semibold font-mono">
                        {formatRupiah(product.sellingPrice)}
                      </td>
                      <td className="py-4 px-6 text-center text-slate-450 font-mono">
                        {product.initialStock}
                      </td>
                      <td className="py-4 px-6 text-center text-teal-400 font-mono font-medium">
                        {product.additionalStock || "-"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span 
                          className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isOutOfStock 
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : isLowStock
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20"
                          }`}
                        >
                          {product.currentStock} {product.unit}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenRestock(product)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-teal-400 hover:text-teal-350 border border-slate-800 hover:border-slate-700 transition-all font-semibold cursor-pointer text-xs"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <p className="text-base">Tidak ada produk ditemukan</p>
                    <p className="text-xs mt-1 text-slate-600">
                      Silakan tambah produk baru terlebih dahulu.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Dialog Modal */}
      {restockProduct && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">Stok Tambahan Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Tambah persediaan barang ke database Aiven</p>
              </div>
              <button
                onClick={handleCloseRestock}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRestockSubmit} className="p-6 space-y-5">
              {restockSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-355 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-450" />
                  <span>{restockSuccess}</span>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-350 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Produk</span>
                <h4 className="font-bold text-white text-base">{restockProduct.name}</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Barcode: {restockProduct.barcode}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-950/50 p-4 border border-slate-850">
                <div className="text-center border-r border-slate-850">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Stok Saat Ini</span>
                  <span className="text-lg font-bold text-slate-300 font-mono mt-0.5 block">
                    {restockProduct.currentStock} {restockProduct.unit}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Stok Tambahan</span>
                  <span className="text-lg font-bold text-teal-400 font-mono mt-0.5 block">
                    {restockProduct.additionalStock} {restockProduct.unit}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-350">
                  Jumlah Stok Baru Ditambahkan <span className="text-emerald-450">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Masukkan jumlah..."
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-550 text-xs font-semibold">
                    {restockProduct.unit}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-550">
                <Info className="h-3.5 w-3.5" />
                <span>Nilai "Stok Tambahan" dan "Jumlah Stok" akan di-update di Aiven</span>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseRestock}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-white transition-all text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={restockLoading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-450 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/10 disabled:opacity-50 transition-all text-xs cursor-pointer"
                >
                  {restockLoading ? "Menyimpan..." : "Tambah Stok"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
