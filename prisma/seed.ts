import { PrismaClient } from "./generated/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined.");
}

const url = new URL(databaseUrl);
const host = url.hostname;
const port = url.port ? parseInt(url.port) : 3306;
const user = url.username;
const password = decodeURIComponent(url.password);
const database = url.pathname.substring(1);

const hasSsl = databaseUrl.includes("ssl-mode") || host.includes("aivencloud.com");

const config: any = {
  host,
  port,
  user,
  password,
  database,
  connectionLimit: 5,
};

if (hasSsl) {
  config.ssl = {
    rejectUnauthorized: false,
  };
}

const adapter = new PrismaMariaDb(config);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Memulai seeding data...");

  // 1. Bersihkan data lama jika ada
  await prisma.salesDaily.deleteMany();
  await prisma.product.deleteMany();
  console.log("Data lama telah dibersihkan.");

  // 2. Buat produk contoh
  const products = [
    {
      barcode: "89912345678",
      name: "Kopi Bubuk Arabika Toraja",
      unit: "pcs",
      basePrice: 20000,
      sellingPrice: 26000, // 20000 + 30%
      currentStock: 45,
    },
    {
      barcode: "89987654321",
      name: "Teh Celup Melati Premium",
      unit: "pcs",
      basePrice: 8000,
      sellingPrice: 10400, // 8000 + 30%
      currentStock: 60,
    },
    {
      barcode: "89945678901",
      name: "Kripik Singkong Balado",
      unit: "pack",
      basePrice: 12000,
      sellingPrice: 15600, // 12000 + 30%
      currentStock: 80,
    },
    {
      barcode: "89955511122",
      name: "Kain Batik Tulis Solo",
      unit: "pcs",
      basePrice: 180000,
      sellingPrice: 234000, // 180000 + 30%
      currentStock: 12,
    },
    {
      barcode: "89999988877",
      name: "Dompet Kulit Sapi Handmade",
      unit: "pcs",
      basePrice: 85000,
      sellingPrice: 110500, // 85000 + 30%
      currentStock: 25,
    },
  ];

  const createdProducts = [];
  for (const p of products) {
    const created = await prisma.product.create({ data: p });
    createdProducts.push(created);
    console.log(`Produk berhasil dibuat: ${created.name}`);
  }

  // 3. Buat beberapa transaksi penjualan contoh
  const sales = [
    {
      productId: createdProducts[0].id, // Kopi
      quantitySold: 5,
      totalPayment: createdProducts[0].sellingPrice * 5, // 130000
      profit: (createdProducts[0].sellingPrice - createdProducts[0].basePrice) * 5, // 30000
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 hari yang lalu
    },
    {
      productId: createdProducts[1].id, // Teh
      quantitySold: 10,
      totalPayment: createdProducts[1].sellingPrice * 10, // 104000
      profit: (createdProducts[1].sellingPrice - createdProducts[1].basePrice) * 10, // 24000
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 hari yang lalu
    },
    {
      productId: createdProducts[2].id, // Kripik
      quantitySold: 15,
      totalPayment: createdProducts[2].sellingPrice * 15, // 234000
      profit: (createdProducts[2].sellingPrice - createdProducts[2].basePrice) * 15, // 54000
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 hari yang lalu
    },
    {
      productId: createdProducts[4].id, // Dompet
      quantitySold: 2,
      totalPayment: createdProducts[4].sellingPrice * 2, // 221000
      profit: (createdProducts[4].sellingPrice - createdProducts[4].basePrice) * 2, // 51000
      date: new Date(), // Hari ini
    },
  ];

  for (const s of sales) {
    const created = await prisma.salesDaily.create({ data: s });
    // Kurangi stok produk
    await prisma.product.update({
      where: { id: s.productId },
      data: {
        currentStock: {
          decrement: s.quantitySold,
        },
      },
    });
    console.log(`Transaksi berhasil diseed untuk produk ID: ${s.productId}`);
  }

  console.log("Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("Kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Clean connection
  });
