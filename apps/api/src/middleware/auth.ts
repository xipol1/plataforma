import type { NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "../auth/jwt.js";
import { prisma } from "../lib/prisma.js";
import type { UserRole } from "../types/user.js";

type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};

async function loadUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  const payload = verifyAuthToken(token);
  const result = await prisma.$queryRaw<AuthenticatedUser>`
    SELECT id::text, email, role::text
    FROM "User"
    WHERE id = ${payload.sub}
    LIMIT 1
  `;

  return result.rows[0] ?? null;
}

export async function authRequired(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const user = await loadUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export async function authOptional(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const user = await loadUserFromToken(token);
    if (user) {
      req.user = user;
    }
  } catch {
    // ignore optional auth errors
  }

  return next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
