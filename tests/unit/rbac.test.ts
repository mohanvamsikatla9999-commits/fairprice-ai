import { describe, expect, it } from "vitest";
import {
  getPermissionsForRole,
  hasPermission,
  hasRole,
  requirePermission,
  requireRole,
} from "@/lib/auth/rbac";
import { ForbiddenError, UnauthorizedError } from "@/lib/api/errors";

describe("RBAC", () => {
  it("ranks SUPER_ADMIN above ADMIN and USER", () => {
    expect(hasRole("SUPER_ADMIN", "ADMIN")).toBe(true);
    expect(hasRole("ADMIN", "SUPER_ADMIN")).toBe(false);
    expect(hasRole("USER", "SELLER")).toBe(false);
    expect(hasRole("SELLER", ["USER", "BUYER"])).toBe(true);
  });

  it("grants admin:access to ADMIN and SUPER_ADMIN only", () => {
    expect(hasPermission("ADMIN", "admin:access")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "admin:access")).toBe(true);
    expect(hasPermission("MODERATOR", "admin:access")).toBe(false);
    expect(hasPermission("USER", "admin:access")).toBe(false);
  });

  it("grants moderation:access to MODERATOR+", () => {
    expect(hasPermission("MODERATOR", "moderation:access")).toBe(true);
    expect(hasPermission("SUPPORT", "moderation:access")).toBe(false);
    expect(hasPermission("SELLER", "listing:create")).toBe(true);
  });

  it("requireRole throws when unauthenticated", () => {
    expect(() => requireRole(null, "ADMIN")).toThrow(UnauthorizedError);
  });

  it("requireRole throws Forbidden for insufficient role", () => {
    expect(() => requireRole("USER", "ADMIN")).toThrow(ForbiddenError);
  });

  it("requirePermission throws for missing permission", () => {
    expect(() => requirePermission("BUYER", "user:manage")).toThrow(
      ForbiddenError,
    );
  });

  it("lists permissions for a role", () => {
    const perms = getPermissionsForRole("BUSINESS");
    expect(perms).toContain("business:api");
    expect(perms).toContain("valuation:run");
  });
});
