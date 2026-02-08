import dotenv from "dotenv";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

dotenv.config({ path: "../../.env" });
dotenv.config();

type SqlTemplate = TemplateStringsArray;

class PrismaClient {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async $queryRaw<T extends QueryResultRow>(strings: SqlTemplate, ...values: unknown[]): Promise<QueryResult<T>> {
    const text = strings.reduce((acc, part, index) => `${acc}${part}${index < values.length ? `$${index + 1}` : ""}`, "");
    return this.pool.query<T>(text, values);
  }


  async $query<T extends QueryResultRow>(text: string, values: unknown[] = []): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async $disconnect() {
    await this.pool.end();
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
