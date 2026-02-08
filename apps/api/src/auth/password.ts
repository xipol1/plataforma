import argon2 from "argon2";

function withPepper(password: string) {
  const pepper = process.env.PASSWORD_PEPPER ?? "";
  return `${password}${pepper}`;
}

export async function hashPassword(password: string) {
  return argon2.hash(withPepper(password));
}

export async function verifyPassword(password: string, passwordHash: string) {
  return argon2.verify(passwordHash, withPepper(password));
}
