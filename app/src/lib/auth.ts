// Cookie-session credential auth with server-side RBAC (DECISIONS.md D-014).
// Passwords: scrypt (Node crypto, no native deps). Sessions: HMAC-signed payloads in
// HTTP-only cookies. Production path: swap this module for Supabase Auth behind the
// same getSession() seam — callers never touch cookies directly.

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { env } from "./env";
import type { Role } from "./state-machines";

export { hashPassword, verifyPassword } from "./password";

const COOKIE_NAME = "st_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function sign(payload: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(payload).digest("base64url");
}

export function encodeSession(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + SESSION_TTL_MS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string): { userId: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.userId !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const decoded = decodeSession(token);
  if (!decoded) return null;
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
}

export async function setSessionCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, encodeSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

// Server-side role guard — used by every protected route handler and server action.
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthError("Not signed in", 401);
  if (!roles.includes(session.role)) throw new AuthError("Forbidden", 403);
  return session;
}
