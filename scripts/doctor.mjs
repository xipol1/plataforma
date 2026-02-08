#!/usr/bin/env node
import fs from "node:fs";
import process from "node:process";
import { Client } from "pg";

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['\"]|['\"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function checkDatabase(databaseUrl) {
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  const start = Date.now();
  await client.connect();
  await client.query("SELECT 1");
  const latency = Date.now() - start;
  await client.end();
  return latency;
}

async function main() {
  loadEnvFromFile(".env");

  const checks = [];
  let hasFailure = false;

  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor >= 20) {
    checks.push(`✅ Node version OK (${process.versions.node})`);
  } else {
    hasFailure = true;
    checks.push(`❌ Node version too low (${process.versions.node}). Required: >= 20.`);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (!databaseUrl) {
    hasFailure = true;
    checks.push("❌ DATABASE_URL is missing. Set DATABASE_URL in .env (remote Postgres) or use USE_DOCKER_DB=1.");
  } else {
    checks.push("✅ DATABASE_URL is set.");

    try {
      const latencyMs = await checkDatabase(databaseUrl);
      checks.push(`✅ Postgres connection OK (SELECT 1, latency: ${latencyMs}ms).`);
    } catch (error) {
      hasFailure = true;
      const message = error instanceof Error ? error.message : String(error);
      checks.push(`❌ Postgres connection failed: ${message}`);
    }
  }

  console.log("\n=== Doctor report ===");
  for (const line of checks) {
    console.log(line);
  }
  console.log(`Result: ${hasFailure ? "FAIL" : "PASS"}\n`);

  process.exit(hasFailure ? 1 : 0);
}

main();
