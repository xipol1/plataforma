import dotenv from "dotenv";
import process from "node:process";
import { Client } from "pg";

if (process.env.NODE_ENV === "production") {
  console.error("db:reset is blocked in production");
  process.exit(1);
}

dotenv.config({ path: "../../.env" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required for db:reset");
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });
await client.connect();

await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
await client.end();

console.log("Database reset completed");
