import "server-only";

import { hash, verify, type Options } from "@node-rs/argon2";

const ARGON2_OPTIONS: Options = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

function withPepper(password: string) {
  const pepper = process.env.AUTH_PASSWORD_PEPPER?.trim();

  if (!pepper) {
    throw new Error("AUTH_PASSWORD_PEPPER 환경변수가 필요합니다.");
  }

  return `${password}\u0000${pepper}`;
}

export function hashPassword(password: string) {
  return hash(withPepper(password), ARGON2_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, withPepper(password), ARGON2_OPTIONS);
}
