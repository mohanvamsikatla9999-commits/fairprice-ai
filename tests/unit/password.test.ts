import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password helpers", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("FairPriceDemo1!");
    expect(hash).not.toBe("FairPriceDemo1!");
    expect(hash.startsWith("$2")).toBe(true);
    await expect(verifyPassword("FairPriceDemo1!", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correct-horse-battery");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("returns false for empty inputs", async () => {
    await expect(verifyPassword("", "hash")).resolves.toBe(false);
    await expect(verifyPassword("password", "")).resolves.toBe(false);
  });

  it("produces unique salts per hash", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
    await expect(verifyPassword("same-password", a)).resolves.toBe(true);
    await expect(verifyPassword("same-password", b)).resolves.toBe(true);
  });
});
