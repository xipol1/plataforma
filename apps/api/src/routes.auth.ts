import { Router } from "express";

import { signAuthToken } from "./auth/jwt.js";
import { hashPassword, verifyPassword } from "./auth/password.js";
import { loginSchema, registerSchema } from "./auth/schemas.js";
import { prisma } from "./lib/prisma.js";
import { authRequired } from "./middleware/auth.js";
import type { UserRole } from "./types/user.js";
import { randomUUID } from "node:crypto";

const router = Router();
const rateState: Map<string, { count: number; resetAtMs: number }> = new Map();
let sweepTick = 0;
function sweepRateState(nowMs: number) {
  for (const [key, rec] of rateState.entries()) {
    if (rec.resetAtMs <= nowMs) rateState.delete(key);
  }
  const maxKeys = 10_000;
  if (rateState.size <= maxKeys) return;
  const toRemove = rateState.size - maxKeys;
  const it = rateState.keys();
  for (let i = 0; i < toRemove; i++) {
    const next = it.next();
    if (next.done) break;
    rateState.delete(next.value);
  }
}

function checkRate(key: string, max: number, windowSeconds: number) {
  const nowMs = Date.now();
  sweepTick += 1;
  if (sweepTick % 200 === 0) sweepRateState(nowMs);

  const rec = rateState.get(key);
  const windowMs = windowSeconds * 1000;
  if (!rec || rec.resetAtMs <= nowMs) {
    rateState.set(key, { count: 1, resetAtMs: nowMs + windowMs });
    return { allowed: true as const };
  }
  if (rec.count < max) {
    rec.count += 1;
    return { allowed: true as const };
  }
  return { allowed: false as const, retryAfter: Math.ceil((rec.resetAtMs - nowMs) / 1000) };
}

router.post("/auth/register", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "unknown";
  if (process.env.DISABLE_AUTH_RATE_LIMIT !== "1") {
    const rate = checkRate(`register:${ip}`, 5, 60);
    if (!rate.allowed) {
      return res.status(429).json({ message: "Rate limit exceeded", retry_after_seconds: rate.retryAfter });
    }
  }
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  const { email, password, role } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const id = randomUUID();
    const created = await prisma.$queryRaw<{ id: string; email: string; role: UserRole }>`
      INSERT INTO "User" (id, email, "passwordHash", role, "createdAt")
      VALUES (${id}::uuid, ${email}, ${passwordHash}, ${role}::"UserRole", NOW())
      RETURNING id::text, email, role::text
    `;

    const user = created.rows[0];
    const token = signAuthToken({ sub: user.id, email: user.email, role: user.role });

    return res.status(201).json({ token, user });
  } catch (error: unknown) {
    const maybeCode = (error as { code?: string }).code;
    if (maybeCode === "23505") {
      return res.status(409).json({ message: "Email already exists" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "unknown";
  if (process.env.DISABLE_AUTH_RATE_LIMIT !== "1") {
    const rateIp = checkRate(`login:${ip}`, 20, 300);
    if (!rateIp.allowed) {
      return res.status(429).json({ message: "Rate limit exceeded", retry_after_seconds: rateIp.retryAfter });
    }
  }
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  if (process.env.DISABLE_AUTH_RATE_LIMIT !== "1") {
    const rateEmail = checkRate(`login-email:${email}`, 5, 60);
    if (!rateEmail.allowed) {
      return res.status(429).json({ message: "Rate limit exceeded", retry_after_seconds: rateEmail.retryAfter });
    }
  }

  try {
    const existing = await prisma.$queryRaw<
      { id: string; email: string; role: UserRole; passwordHash: string }
    >`SELECT id::text, email, role::text, "passwordHash" FROM "User" WHERE email = ${email} LIMIT 1`;

    const user = existing.rows[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAuthToken({ sub: user.id, email: user.email, role: user.role });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", authRequired, async (req, res) => {
  return res.status(200).json({
    id: req.user!.id,
    email: req.user!.email,
    role: req.user!.role,
  });
});

export default router;
