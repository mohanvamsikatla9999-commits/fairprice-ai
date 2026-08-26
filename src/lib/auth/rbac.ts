import type { Role } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "@/lib/api/errors";

export type Permission =
  | "listing:create"
  | "listing:update"
  | "listing:delete"
  | "listing:moderate"
  | "offer:create"
  | "offer:respond"
  | "chat:send"
  | "valuation:run"
  | "admin:access"
  | "admin:categories"
  | "admin:transactions"
  | "admin:valuations"
  | "admin:market-data"
  | "admin:settings"
  | "moderation:access"
  | "support:access"
  | "business:api"
  | "user:manage"
  | "verification:review";

const ROLE_RANK: Record<Role, number> = {
  USER: 1,
  BUYER: 2,
  SELLER: 2,
  BUSINESS: 3,
  SUPPORT: 4,
  MODERATOR: 5,
  ADMIN: 6,
  SUPER_ADMIN: 7,
};

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER: ["listing:create", "offer:create", "chat:send", "valuation:run"],
  BUYER: ["offer:create", "chat:send", "valuation:run"],
  SELLER: [
    "listing:create",
    "listing:update",
    "listing:delete",
    "offer:respond",
    "chat:send",
    "valuation:run",
  ],
  BUSINESS: [
    "listing:create",
    "listing:update",
    "listing:delete",
    "offer:respond",
    "chat:send",
    "valuation:run",
    "business:api",
  ],
  SUPPORT: [
    "chat:send",
    "support:access",
    "valuation:run",
  ],
  MODERATOR: [
    "listing:moderate",
    "moderation:access",
    "support:access",
    "chat:send",
    "valuation:run",
    "verification:review",
  ],
  ADMIN: [
    "listing:create",
    "listing:update",
    "listing:delete",
    "listing:moderate",
    "offer:create",
    "offer:respond",
    "chat:send",
    "valuation:run",
    "admin:access",
    "admin:categories",
    "admin:transactions",
    "admin:valuations",
    "admin:market-data",
    "admin:settings",
    "moderation:access",
    "support:access",
    "business:api",
    "user:manage",
    "verification:review",
  ],
  SUPER_ADMIN: [
    "listing:create",
    "listing:update",
    "listing:delete",
    "listing:moderate",
    "offer:create",
    "offer:respond",
    "chat:send",
    "valuation:run",
    "admin:access",
    "admin:categories",
    "admin:transactions",
    "admin:valuations",
    "admin:market-data",
    "admin:settings",
    "moderation:access",
    "support:access",
    "business:api",
    "user:manage",
    "verification:review",
  ],
};

export function hasRole(userRole: Role, required: Role | Role[]): boolean {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.some((r) => ROLE_RANK[userRole] >= ROLE_RANK[r]);
}

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

export function requireRole(
  userRole: Role | undefined | null,
  required: Role | Role[],
): void {
  if (!userRole) throw new UnauthorizedError();
  if (!hasRole(userRole, required)) {
    throw new ForbiddenError("Insufficient role");
  }
}

export function requirePermission(
  userRole: Role | undefined | null,
  permission: Permission,
): void {
  if (!userRole) throw new UnauthorizedError();
  if (!hasPermission(userRole, permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

export function getPermissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}
