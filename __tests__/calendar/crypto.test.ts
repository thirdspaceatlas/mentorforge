import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "@/lib/calendar/crypto";

// Valid 32-byte hex key for testing
const TEST_KEY = "a".repeat(64);

describe("crypto", () => {
  beforeEach(() => {
    vi.stubEnv("CALENDAR_ENCRYPTION_KEY", TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("round-trips: decrypt(encrypt(text)) returns original", () => {
    const original = "ya29.a0ARrdaM_super_secret_access_token_here";
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("produces different ciphertext for the same plaintext (random IV)", () => {
    const text = "same-input-different-output";
    const a = encrypt(text);
    const b = encrypt(text);
    expect(a).not.toBe(b);
    // But both decrypt to the same value
    expect(decrypt(a)).toBe(text);
    expect(decrypt(b)).toBe(text);
  });

  it("handles empty string", () => {
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("handles long strings (OAuth tokens can be 2KB+)", () => {
    const long = "x".repeat(3000);
    const encrypted = encrypt(long);
    expect(decrypt(encrypted)).toBe(long);
  });

  it("handles unicode characters", () => {
    const unicode = "token with émojis 🔐 and ñ";
    const encrypted = encrypt(unicode);
    expect(decrypt(encrypted)).toBe(unicode);
  });

  it("throws on missing encryption key", () => {
    vi.stubEnv("CALENDAR_ENCRYPTION_KEY", "");
    expect(() => encrypt("test")).toThrow("CALENDAR_ENCRYPTION_KEY");
  });

  it("throws on wrong-length key", () => {
    vi.stubEnv("CALENDAR_ENCRYPTION_KEY", "abc123");
    expect(() => encrypt("test")).toThrow("64-character hex string");
  });

  it("throws on tampered ciphertext", () => {
    const encrypted = encrypt("sensitive data");
    // Tamper with the ciphertext (flip a character)
    const buf = Buffer.from(encrypted, "base64");
    buf[buf.length - 1] ^= 0xff;
    const tampered = buf.toString("base64");
    expect(() => decrypt(tampered)).toThrow();
  });
});
