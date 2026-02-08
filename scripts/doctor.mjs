import dotenv from "dotenv";
import process from "node:process";
import { Client } from "pg";

dotenv.config();

function log(title, ok, details) {
  const status = ok ? "OK" : "ERROR";
  console.log(`[${status}] ${title}${details ? ` — ${details}` : ""}`);
}

async function checkNode() {
  const major = Number(process.versions.node.split(".")[0]);
  const ok = major >= 20;
  log("Node.js version >= 20", ok, `detected ${process.versions.node}`);
  return ok;
}

async function checkEnv() {
  const hasDbUrl = !!process.env.DATABASE_URL;
  log("DATABASE_URL present", hasDbUrl, hasDbUrl ? undefined : "missing");
  return hasDbUrl;
}

async function checkDb() {
  if (!process.env.DATABASE_URL) return false;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query("SELECT 1 as ok");
    const ok = res.rows[0]?.ok === 1;
    log("PostgreSQL connectivity", ok);
    await client.end();
    return ok;
  } catch (e) {
    log("PostgreSQL connectivity", false, e?.message ?? "connection error");
    try { await client.end(); } catch {}
    return false;
  }
}

async function main() {
  const okNode = await checkNode();
  const okEnv = await checkEnv();
  const okDb = await checkDb();
  if (!okNode || !okEnv || !okDb) process.exitCode = 1;
}

main();
