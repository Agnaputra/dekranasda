"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Calculator,
  Barcode,
  ShoppingBag,
  Info
} from "lucide-react";

export default function NewProduct() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    unit: "pcs",
    basePrice: "",
    currentStock: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate HJA (Harga Jual Akhir) dynamically
  const basePriceNum = parseFloat(formData.basePrice) || 0;
  const sellingPricePreview = basePriceNum + (basePriceNum * 0.3);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Simple validation
    if (!formData.barcode || !formData.name || !formData.basePrice || !formData.currentStock) {
      setError("Semua kolom bertanda * wajib diisi!");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          barcode: formData.barcode,
          name: formData.name,
          unit: formData.unit,
          basePrice: parseFloat(formData.basePrice),
          currentStock: parseInt(formData.currentStock),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan produk.");
      }

      setSuccess(`Produk '${data.name}' berhasil ditambahkan ke database!`);
      setFormData({
        barcode: "",
        name: "",
        unit: "pcs",
        basePrice: "",
        currentStock: "",
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat menghubungkan ke database.");
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center justify-center p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Tambah Produk Baru
          </h1>
          <p className="text-slate-400 mt-1">
            Daftarkan produk baru Anda ke database Aiven MySQL.
          </p>
        </div>
      </div>

      {/* Alert Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Main Form Container */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Barcode & Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="barcode" className="block text-sm font-semibold text-slate-350">
                Barcode / Kode Barang <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  id="barcode"
                  name="barcode"
                  required
                  placeholder="Contoh: 89912345678"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-350">
                Nama Produk <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <ShoppingBag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  placeholder="Contoh: Kopi Bubuk Arabika"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Unit & Stock Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="unit" className="block text-sm font-semibold text-slate-350">
                Satuan Produk
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              >
                <option value="pcs">pcs (Pieces)</option>
                <option value="pack">pack</option>
                <option value="box">box</option>
                <option value="botol">botol</option>
                <option value="kg">kg</option>
                <option value="liter">liter</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="currentStock" className="block text-sm font-semibold text-slate-350">
                Stok Awal <span className="text-emerald-400">*</span>
              </label>
              <input
                type="number"
                id="currentStock"
                name="currentStock"
                required
                min="0"
                placeholder="0"
                value={formData.currentStock}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="basePrice" className="block text-sm font-semibold text-slate-350">
                Harga Asli (Base Price) <span className="text-emerald-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  id="basePrice"
                  name="basePrice"
                  required
                  min="0"
                  placeholder="0"
                  value={formData.basePrice}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-650 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Auto pricing calculation preview */}
            <div className="rounded-xl bg-emerald-950/20 border border-emerald-800/40 p-4 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Calculator className="h-4 w-4" />
                <span>Estimasi Harga Jual (HJA)</span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-350 mt-1 font-mono">
                {formatRupiah(sellingPricePreview)}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500/80 mt-1">
                <Info className="h-3 w-3 shrink-0" />
                <span>Dihitung otomatis dengan margin keuntungan 30%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/60 flex items-center justify-end gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm font-semibold"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-55 disabled:scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
            >
              <Save className="h-4.5 w-4.5" />
              <span>{loading ? "Menyimpan..." : "Simpan Produk"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
