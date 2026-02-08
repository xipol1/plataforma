import { Router } from "express";

import { signAuthToken } from "./auth/jwt.js";
import { hashPassword, verifyPassword } from "./auth/password.js";
import { loginSchema, registerSchema } from "./auth/schemas.js";
import { prisma } from "./lib/prisma.js";
import { authRequired } from "./middleware/auth.js";
import type { UserRole } from "./types/user.js";

const router = Router();

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  const { email, password, role } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    const created = await prisma.$queryRaw<{ id: string; email: string; role: UserRole }>`
      INSERT INTO "User" (email, "passwordHash", role)
      VALUES (${email}, ${passwordHash}, ${role}::"UserRole")
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
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid input", issues: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

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
