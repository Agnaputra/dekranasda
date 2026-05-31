import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/prisma/generated/client/client";
import { prisma } from "@/lib/db";

// GET /api/sales - Retrieve sales history with product details
export async function GET() {
  try {
    const sales = await prisma.salesDaily.findMany({
      include: {
        product: true,
      },
      orderBy: {
        date: "desc",
      },
    });
    return NextResponse.json(sales);
  } catch (error: any) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data laporan penjualan: " + error.message },
      { status: 500 }
    );
  }
}

// POST /api/sales - Record a sale and update product stock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantitySold } = body;

    // Validation
    if (!productId || quantitySold === undefined || quantitySold <= 0) {
      return NextResponse.json(
        { error: "Mohon isi ID produk dan jumlah penjualan yang valid." },
        { status: 400 }
      );
    }

    const pId = parseInt(productId);
    const qty = parseInt(quantitySold);

    // Run transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Fetch product and lock/verify stock
      const product = await tx.product.findUnique({
        where: { id: pId },
      });

      if (!product) {
        throw new Error("Produk tidak ditemukan.");
      }

      if (product.currentStock < qty) {
        throw new Error(`Stok tidak mencukupi. Stok saat ini: ${product.currentStock} ${product.unit}.`);
      }

      // 2. Calculate profit & total payment
      // sellingPrice - basePrice is the profit per unit
      const profitPerUnit = product.sellingPrice - product.basePrice;
      const profit = profitPerUnit * qty;
      const totalPayment = product.sellingPrice * qty;

      // 3. Create SalesDaily record
      const sale = await tx.salesDaily.create({
        data: {
          productId: pId,
          quantitySold: qty,
          totalPayment,
          profit,
        },
        include: {
          product: true,
        },
      });

      // 4. Update Product stock
      await tx.product.update({
        where: { id: pId },
        data: {
          currentStock: {
            decrement: qty,
          },
        },
      });

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/sales error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mencatat transaksi penjualan." },
      { status: 500 }
    );
  }
}
