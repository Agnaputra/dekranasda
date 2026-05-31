import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/products/restock - Restock an existing product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId || quantity === undefined || quantity <= 0) {
      return NextResponse.json(
        { error: "Mohon isi ID produk dan jumlah stok tambahan yang valid." },
        { status: 400 }
      );
    }

    const pId = parseInt(productId);
    const qty = parseInt(quantity);

    // Update product stock fields in a transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: pId },
      });

      if (!product) {
        throw new Error("Produk tidak ditemukan.");
      }

      const newProduct = await tx.product.update({
        where: { id: pId },
        data: {
          additionalStock: {
            increment: qty,
          },
          currentStock: {
            increment: qty,
          },
        },
      });

      return newProduct;
    });

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/products/restock error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menambah stok tambahan." },
      { status: 500 }
    );
  }
}
