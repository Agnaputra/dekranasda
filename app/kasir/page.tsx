"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Calculator,
  Barcode,
  Sparkles,
  CreditCard
} from "lucide-react";

interface Product {
  id: number;
  barcode: string;
  name: string;
  unit: string;
  basePrice: number;
  sellingPrice: number;
  currentStock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Cashier() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Gagal mengambil data produk.");
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat daftar produk.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSearchTerm("");
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    if (quantity <= 0) {
      setError("Jumlah penjualan harus lebih dari 0.");
      return;
    }

    const availableStock = selectedProduct.currentStock;
    const existingCartItem = cart.find(item => item.product.id === selectedProduct.id);
    const existingQty = existingCartItem ? existingCartItem.quantity : 0;
    const totalRequestQty = existingQty + quantity;

    if (totalRequestQty > availableStock) {
      setError(`Stok tidak mencukupi! Stok ${selectedProduct.name} hanya tinggal ${availableStock} ${selectedProduct.unit}.`);
      return;
    }

    setError(null);

    if (existingCartItem) {
      setCart(cart.map(item => 
        item.product.id === selectedProduct.id 
          ? { ...item, quantity: totalRequestQty }
          : item
      ));
    } else {
      setCart([...cart, { product: selectedProduct, quantity }]);
    }

    // Reset selection
    setSelectedProduct(null);
    setQuantity(1);
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.sellingPrice * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Send API requests for each cart item
      // We will perform checkouts sequentially to avoid concurrent state issues
      const recordedSales = [];
      
      for (const item of cart) {
        const response = await fetch("/api/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: item.product.id,
            quantitySold: item.quantity,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `Transaksi gagal untuk ${item.product.name}`);
        }
        
        recordedSales.push(data);
      }

      setLastTransaction({
        items: [...cart],
        total: calculateTotal(),
        date: new Date().toLocaleString("id-ID"),
      });

      // Clear Cart and refresh products to get new stocks
      setCart([]);
      setSuccess(true);
      await fetchProducts();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal memproses transaksi kasir.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Filter products for dropdown
  const filteredProducts = searchTerm
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
          <ShoppingCart className="h-8 w-8 text-emerald-400" />
          <span>Kasir Penjualan</span>
        </h1>
        <p className="text-slate-400 mt-1">
          Pilih produk, tentukan jumlah penjualan, dan catat transaksi secara instan.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Grid Layout: POS Selection vs Shopping Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Product Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 backdrop-blur-xl space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-400" />
              <span>Cari & Pilih Produk</span>
            </h2>

            {/* Search Input for Products */}
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama produk atau scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Barcode className="h-5 w-5" />
              </span>

              {/* Search Dropdown Results */}
              {searchTerm && (
                <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl max-h-60 overflow-y-auto shadow-2xl z-55 divide-y divide-slate-800/50">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-800/60 transition-all flex justify-between items-center text-sm"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{product.name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{product.barcode}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-emerald-400">{formatRupiah(product.sellingPrice)}</div>
                          <div className="text-xs text-slate-400">Stok: {product.currentStock} {product.unit}</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500 text-center">
                      Produk tidak ditemukan
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Product Card & Quantity Selector */}
            {selectedProduct ? (
              <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 space-y-4 animate-fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{selectedProduct.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedProduct.barcode}</p>
                  </div>
                  <span className="text-emerald-400 font-extrabold text-lg font-mono">
                    {formatRupiah(selectedProduct.sellingPrice)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-b border-slate-800/85 py-2 text-slate-400">
                  <span>Stok Tersedia:</span>
                  <span className="font-semibold text-slate-250">
                    {selectedProduct.currentStock} {selectedProduct.unit}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400">Jumlah Terjual</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.currentStock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-bold shadow-lg shadow-emerald-500/10 transition-all text-sm flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart className="h-4.5 w-4.5" />
                      <span>Tambahkan</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
                Cari produk di atas untuk memilih barang.
              </div>
            )}
          </div>

          {/* Checkout Success Receipt Panel */}
          {success && lastTransaction && (
            <div className="rounded-2xl bg-emerald-950/20 border border-emerald-800/40 p-6 backdrop-blur-xl space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-6 w-6" />
                <h3 className="font-bold text-lg">Transaksi Berhasil!</h3>
              </div>
              <div className="bg-slate-950/60 rounded-xl p-4 space-y-3 font-mono text-xs text-slate-300 border border-slate-800/40">
                <div className="flex justify-between text-slate-500 border-b border-slate-800 pb-2">
                  <span>Waktu:</span>
                  <span>{lastTransaction.date}</span>
                </div>
                <div className="space-y-1">
                  {lastTransaction.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.product.name} ({item.quantity}x)
                      </span>
                      <span>{formatRupiah(item.product.sellingPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-emerald-400 text-sm">
                  <span>Total Bayar:</span>
                  <span>{formatRupiah(lastTransaction.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Cart Summary (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 backdrop-blur-xl flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-emerald-400" />
                <span>Keranjang Belanja</span>
              </h2>
              <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full">
                {cart.length} Item
              </span>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 py-2 max-h-[300px]">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.product.id} className="py-4 flex justify-between items-center group">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {formatRupiah(item.product.sellingPrice)} × {item.quantity} {item.product.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-white font-mono text-sm">
                        {formatRupiah(item.product.sellingPrice * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-650 py-16">
                  <ShoppingCart className="h-16 w-16 opacity-10 mb-3" />
                  <p className="text-sm">Keranjang Anda masih kosong</p>
                  <p className="text-xs text-slate-600 mt-1">Pilih produk di sebelah kiri untuk berbelanja.</p>
                </div>
              )}
            </div>

            {/* Checkout Pricing Panel */}
            <div className="border-t border-slate-800/80 pt-6 mt-auto space-y-4">
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">{formatRupiah(calculateTotal())}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Pajak (0%)</span>
                <span className="font-mono">Rp 0</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-850 pt-4 font-bold text-white">
                <span className="text-base flex items-center gap-1.5">
                  <Calculator className="h-5 w-5 text-emerald-400" />
                  <span>Total Pembayaran</span>
                </span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {formatRupiah(calculateTotal())}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0 || submitting}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:scale-100 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="h-5 w-5" />
                <span>{submitting ? "Memproses Transaksi..." : "Bayar Sekarang (Checkout)"}</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
