import { createHash, randomBytes } from "crypto";
import { env } from "@/config/env";

export const GOOGLE_OAUTH_STATE_COOKIE = "fp_google_oauth_state";
export const GOOGLE_OAUTH_NEXT_COOKIE = "fp_google_oauth_next";

export function isGoogleAuthConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleRedirectUri(): string {
  return (
    env.GOOGLE_REDIRECT_URI ||
    `${env.APP_URL.replace(/\/$/, "")}/api/auth/google/callback`
  );
}

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    include_granted_scopes: "true",
    prompt: "select_account",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function createOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export function hashOAuthState(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}

export type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  const data = (await res.json()) as GoogleTokenResponse & { error?: string; error_description?: string };
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || "Google token exchange failed");
  }
  if (!data.access_token) {
    throw new Error("Google did not return an access token");
  }
  return data;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as GoogleUserInfo & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to fetch Google profile");
  }
  if (!data.id || !data.email) {
    throw new Error("Google profile missing id or email");
  }
  return data;
}
