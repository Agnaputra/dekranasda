import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/products - Get all products, optionally search by name or barcode, including sales history
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { barcode: { contains: query } },
        ],
      },
      include: {
        sales: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data produk: " + error.message },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barcode, name, unit, basePrice, currentStock } = body;

    // Validation
    if (!barcode || !name || basePrice === undefined || currentStock === undefined) {
      return NextResponse.json(
        { error: "Mohon isi semua field wajib (Barcode, Nama, Harga Asli, dan Stok)." },
        { status: 400 }
      );
    }

    // Check if barcode already exists
    const existingProduct = await prisma.product.findUnique({
      where: { barcode },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: `Produk dengan barcode '${barcode}' sudah ada dalam sistem.` },
        { status: 400 }
      );
    }

    // Automatic selling price calculation: HJA = Harga Asli + 30% margin
    const calculatedBasePrice = parseFloat(basePrice);
    const sellingPrice = calculatedBasePrice + (calculatedBasePrice * 0.3);
    const stock = parseInt(currentStock);

    const product = await prisma.product.create({
      data: {
        barcode,
        name,
        unit: unit || "pcs",
        basePrice: calculatedBasePrice,
        sellingPrice,
        initialStock: stock,
        additionalStock: 0,
        currentStock: stock,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan produk: " + error.message },
      { status: 500 }
    );
  }
}
