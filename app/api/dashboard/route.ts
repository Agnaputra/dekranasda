import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // 1. Total Product Types
    const totalProducts = await prisma.product.count();

    // 2. Total Stock count across all products
    const stockSum = await prisma.product.aggregate({
      _sum: {
        currentStock: true,
      },
    });
    const totalStock = stockSum._sum.currentStock || 0;

    // 3. Cumulative Profit
    const profitSum = await prisma.salesDaily.aggregate({
      _sum: {
        profit: true,
      },
    });
    const cumulativeProfit = profitSum._sum.profit || 0;

    return NextResponse.json({
      totalProducts,
      totalStock,
      cumulativeProfit,
    });
  } catch (error: any) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil statistik dashboard: " + error.message },
      { status: 500 }
    );
  }
}
