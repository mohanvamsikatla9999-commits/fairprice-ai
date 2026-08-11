import { env } from "@/config/env";
import { MockIdentityVerificationProvider } from "./mock-provider";
import type { IdentityVerificationProvider } from "./types";

export type {
  IdentityVerificationProvider,
  CreateVerificationSessionInput,
  CreateVerificationSessionResult,
  ProviderVerificationResult,
  WebhookHandleResult,
  LivenessChallenge,
} from "./types";
export { MockIdentityVerificationProvider } from "./mock-provider";

let cached: IdentityVerificationProvider | null = null;
let mockSingleton: MockIdentityVerificationProvider | null = null;

export function getMockIdentityProvider(): MockIdentityVerificationProvider {
  if (!mockSingleton) mockSingleton = new MockIdentityVerificationProvider();
  return mockSingleton;
}

/**
 * Provider factory. Production should inject a real vendor adapter.
 * When MOCK_IDENTITY_VERIFICATION is true (default in development), use mock.
 */
export function createIdentityVerificationProvider(
  force = false,
): IdentityVerificationProvider {
  if (cached && !force) return cached;

  const useMock =
    env.MOCK_IDENTITY_VERIFICATION ||
    env.IDENTITY_VERIFICATION_PROVIDER === "mock" ||
    env.NODE_ENV !== "production";

  if (useMock) {
    cached = getMockIdentityProvider();
    return cached;
  }

  // Future: switch on env.IDENTITY_VERIFICATION_PROVIDER for vendor adapters.
  // Until a real provider is configured, fall back to mock and keep isMock=true.
  cached = getMockIdentityProvider();
  return cached;
}
