import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";
import { decodeSession, encodeSession } from "@/lib/auth";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", () => {
    const stored = hashPassword("hunter2secret");
    expect(verifyPassword("hunter2secret", stored)).toBe(true);
    expect(verifyPassword("hunter2wrong", stored)).toBe(false);
  });

  it("produces unique salts", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });

  it("rejects malformed stored values", () => {
    expect(verifyPassword("x", "not-a-hash")).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips a user id", () => {
    const token = encodeSession("user_123");
    expect(decodeSession(token)).toEqual({ userId: "user_123" });
  });

  it("rejects tampered tokens", () => {
    const token = encodeSession("user_123");
    const [payload] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ userId: "user_admin", exp: Date.now() + 1e7 }),
    ).toString("base64url");
    expect(decodeSession(`${forgedPayload}.${token.split(".")[1]}`)).toBeNull();
    expect(decodeSession(`${payload}.AAAA`)).toBeNull();
    expect(decodeSession("garbage")).toBeNull();
  });
});
