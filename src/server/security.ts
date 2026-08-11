import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export function createEditToken() {
  return randomBytes(32).toString("base64url");
}

export function hashEditToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidEditToken(token: string | null, expectedHash: string) {
  if (!token) return false;
  const actual = Buffer.from(hashEditToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function readBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

export function getClientIp(request: NextRequest) {
  return request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function hashIp(ip: string) {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret) throw new Error("IP_HASH_SECRET is not configured");
  return createHmac("sha256", secret).update(ip).digest("hex");
}
