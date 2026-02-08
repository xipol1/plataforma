import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

dotenv.config({ path: "../../.env" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required for db:migrate");
  process.exit(1);
}

const migrationsDir = path.resolve("prisma/migrations");
const client = new Client({ connectionString: databaseUrl });

await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS _app_migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

const migrationFolders = fs.readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const folder of migrationFolders) {
  const already = await client.query("SELECT 1 FROM _app_migrations WHERE name = $1", [folder]);
  if (already.rowCount) {
    console.log(`Skipping ${folder} (already applied)`);
    continue;
  }

  const migrationPath = path.join(migrationsDir, folder, "migration.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  console.log(`Applying ${folder}...`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO _app_migrations(name) VALUES ($1)", [folder]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

await client.end();
console.log("db:migrate finished");
