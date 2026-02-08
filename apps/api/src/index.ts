import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import authRouter from "./routes.auth.js";
import channelsRouter from "./routes.channels.js";
import campaignsRouter from "./routes.campaigns.js";
import trackingRouter from "./routes.tracking.js";
import integrationRouter from "./routes.integration.js";
import { prisma } from "./lib/prisma.js";

dotenv.config({ path: "../../.env" });
dotenv.config();

const app = express();
const port = Number(process.env.PORT_API ?? process.env.API_PORT ?? 4000);

app.use(cors());
app.use(express.json());
app.use(authRouter);
app.use(channelsRouter);
app.use(campaignsRouter);
app.use(trackingRouter);
app.use(integrationRouter);

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

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
