import { PrismaClient } from "@/prisma/generated/client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const getPrismaClient = (): PrismaClient => {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables.");
  }

  try {
    const url = new URL(databaseUrl);
    
    // Parse connection parameters
    const host = url.hostname;
    const port = url.port ? parseInt(url.port) : 3306;
    const user = url.username;
    const password = decodeURIComponent(url.password);
    const database = url.pathname.substring(1); // Remove leading slash
    
    // Check if SSL is required (Aiven or explicit ssl-mode in url)
    const hasSsl = databaseUrl.includes("ssl-mode") || host.includes("aivencloud.com");
    
    const config: any = {
      host,
      port,
      user,
      password,
      database,
      connectionLimit: 10,
    };

    if (hasSsl) {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }

    const adapter = new PrismaMariaDb(config);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error("Failed to parse DATABASE_URL or initialize Prisma Client:", error);
    throw error;
  }
};

export const prisma = getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
