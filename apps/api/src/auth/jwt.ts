import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "ADVERTISER" | "CHANNEL_ADMIN" | "OPS";
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload) {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  const payload = decoded as JwtPayload & AuthTokenPayload;
  if (!payload.sub || !payload.email || !payload.role) {
    throw new Error("Invalid token claims");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}
