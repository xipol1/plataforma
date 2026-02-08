import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config({ path: "../../.env" });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required for db:seed");
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });

async function main() {
  await client.connect();

  const opsUser = await client.query(
    `INSERT INTO "User"("email", "passwordHash", "role")
     VALUES ($1, $2, $3)
     ON CONFLICT ("email") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "role" = EXCLUDED."role"
     RETURNING id, email`,
    ["ops@plataforma.local", "dummy_hash_ops", "OPS"],
  );

  const advertiser = await client.query(
    `INSERT INTO "User"("email", "passwordHash", "role")
     VALUES ($1, $2, $3)
     ON CONFLICT ("email") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "role" = EXCLUDED."role"
     RETURNING id, email`,
    ["advertiser@plataforma.local", "dummy_hash_adv", "ADVERTISER"],
  );

  const channelAdmin = await client.query(
    `INSERT INTO "User"("email", "passwordHash", "role")
     VALUES ($1, $2, $3)
     ON CONFLICT ("email") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "role" = EXCLUDED."role"
     RETURNING id, email`,
    ["admin@plataforma.local", "dummy_hash_admin", "CHANNEL_ADMIN"],
  );

  await client.query(
    `INSERT INTO "Channel"("id", "ownerUserId", "platform", "name", "category", "audienceSize", "engagementHint", "pricePerPost", "status")
     VALUES
      ('11111111-1111-1111-1111-111111111111', $1, 'TELEGRAM', 'Crypto Daily LATAM', 'crypto', 18000, 'alto engagement en noticias diarias', 120, 'ACTIVE'),
      ('22222222-2222-2222-2222-222222222222', $1, 'TELEGRAM', 'Ecommerce Growth Hub', 'ecommerce', 9600, 'audiencia nicho de founders', 90, 'ACTIVE'),
      ('33333333-3333-3333-3333-333333333333', $1, 'TELEGRAM', 'Finanzas Personales Pro', 'finanzas', 22000, 'buen CTR en enlaces de herramientas', 150, 'ACTIVE')
     ON CONFLICT ("id") DO UPDATE SET
      "ownerUserId" = EXCLUDED."ownerUserId",
      "platform" = EXCLUDED."platform",
      "name" = EXCLUDED."name",
      "category" = EXCLUDED."category",
      "audienceSize" = EXCLUDED."audienceSize",
      "engagementHint" = EXCLUDED."engagementHint",
      "pricePerPost" = EXCLUDED."pricePerPost",
      "status" = EXCLUDED."status"`,
    [channelAdmin.rows[0].id],
  );

  await client.query(
    `INSERT INTO "Campaign"("id", "advertiserUserId", "channelId", "copyText", "destinationUrl", "status")
     VALUES ($1, $2, $3, $4, $5, 'DRAFT')
     ON CONFLICT ("id") DO UPDATE SET
      "advertiserUserId" = EXCLUDED."advertiserUserId",
      "channelId" = EXCLUDED."channelId",
      "copyText" = EXCLUDED."copyText",
      "destinationUrl" = EXCLUDED."destinationUrl",
      "status" = EXCLUDED."status",
      "scheduledAt" = NULL,
      "publishedAt" = NULL`,
    [
      "44444444-4444-4444-4444-444444444444",
      advertiser.rows[0].id,
      "11111111-1111-1111-1111-111111111111",
      "Prueba nuestra plataforma para lanzar anuncios en canales cerrados.",
      "https://example.com/landing",
    ],
  );

  console.log(`Seed completed: ops=${opsUser.rows[0].email}, advertiser=${advertiser.rows[0].email}, channel_admin=${channelAdmin.rows[0].email}`);
  await client.end();
}

main().catch(async (error) => {
  console.error(error);
  await client.end();
  process.exit(1);
});
