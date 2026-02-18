import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import authRouter from "./routes.auth.js";
import channelsRouter from "./routes.channels.js";
import campaignsRouter from "./routes.campaigns.js";
import trackingRouter from "./routes.tracking.js";
import integrationRouter from "./routes.integration.js";
import chatRouter from "./routes.chat.js";
import blogRouter from "./routes.blog.js";
import { prisma } from "./lib/prisma.js";
import { startCampaignPublisher } from "./campaigns.publisher.js";
import { ensureDemoSeed } from "./demo.seed.js";

dotenv.config({ path: "../../.env" });
dotenv.config();

const app = express();
const port = Number(process.env.PORT_API ?? process.env.API_PORT ?? 4000);

const allowed = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowed.length ? allowed : "*",
    methods: ["GET", "POST", "PATCH"],
    credentials: false,
  }),
);
app.options(
  "*",
  cors({
    origin: allowed.length ? allowed : "*",
    methods: ["GET", "POST", "PATCH"],
    credentials: false,
  }),
);
app.use((req, res, next) => {
  if (req.path === "/payments/webhook") return next();
  return express.json({ limit: "1mb" })(req, res, next);
});
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  next();
});
app.use(authRouter);
app.use(channelsRouter);
app.use(campaignsRouter);
app.use(trackingRouter);
app.use(integrationRouter);
app.use(chatRouter);
app.use(blogRouter);

app.get("/health", async (_req, res) => {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startedAt;
    return res.status(200).json({ status: "ok", db: true, latency_ms: latencyMs });
  } catch {
    return res.status(500).json({ status: "error", db: false, message: "Database unreachable" });
  }
});

app.get("/", (_req, res) => {
  res.json({ message: "Plataforma API running" });
});

void ensureDemoSeed();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

startCampaignPublisher();
