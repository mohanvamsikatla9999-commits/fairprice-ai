# FairPrice ID — Identity Verification

FairPrice ID is the trust and identity verification layer for FairPrice AI.

> Face + liveness verification **reduces identity-related fraud risk**. It does **not** prove a listing is legitimate or that a person is trustworthy.

## Architecture

```
UI (/verify/*)
  → API (/api/verification/*)
    → IdentityVerificationService
      → IdentityVerificationProvider (mock | future vendor)
      → LivenessVerificationService
      → AntiSpoofingService
      → DuplicateAccountDetectionService
      → TrustScoreEngine / FraudRiskEngine signals
```

All final verification decisions are **server-authoritative**. Clients cannot set `faceVerified`, `identityVerified`, or `status=VERIFIED`.

## Verification levels (FairPrice ID)

| Level | Meaning |
|------|---------|
| 0 | Unverified |
| 1 | Email verified |
| 2 | Phone verified |
| 3 | Identity verified |
| 4 | Face + liveness verified |
| 5 | Trusted seller |
| 6 | Business verified |

Capability flags are stored separately (`identityVerifiedAt`, `faceVerifiedAt`, `livenessVerifiedAt`) and never collapsed into a fake “face score”.

## Auth face challenge (login / register / Google)

When `FACE_VERIFICATION_AT_SIGNIN=true` (default):

1. Password login, password register, and Google OAuth create a session with `signinFaceVerifiedAt = null`
2. Client is sent to `/login/face`
3. Consent → camera → liveness → server decision
4. On success, `Session.signinFaceVerifiedAt` is set and the session is fully usable
5. `requireUser()` returns `FACE_CHALLENGE_REQUIRED` until the challenge passes (except face/me endpoints)

This is **not** a separate marketplace-only step — face+liveness runs as part of authentication.

## Privacy

Default pipeline: **capture → process → verify → discard temporary biometric data**.

Stored by default:

- status, provider, timestamps, method  
- capability flags, risk class, provider reference ID  
- consent version + audit events  

**Not** stored by default: raw face images, biometric templates, embeddings.

- Do not log face images  
- Do not send biometrics to analytics  
- Do not send face images to Ollama / Gemini / any LLM  
- Admins see metadata only (`/admin/verification`)

## Provider abstraction

`IdentityVerificationProvider`:

- `createVerificationSession`
- `getVerificationStatus` / `getVerificationResult`
- `cancelVerification`
- `handleWebhook`
- `deleteTemporaryData`

Development uses `MockIdentityVerificationProvider` when `MOCK_IDENTITY_VERIFICATION=true`. Mock results are labeled **Development verification** and cannot grant production identity when `ALLOW_MOCK_IDV_IN_PRODUCTION=false`.

## Liveness & anti-spoofing

Challenges are randomized (`blink`, `look_left`, `look_right`, …).

Anti-spoof signals (not disclosed to users) include: static frames, display artifacts, multiple faces, automation hints, rapid retries, camera anomalies.

Production should prefer a specialized identity vendor for liveness/anti-spoof — the browser flow is an orchestration layer, not a claim of enterprise-grade biometrics.

## Attempt limits

Configurable via `VerificationPolicy` (admin):

- max attempts / hour / day  
- cooldown after failure  
- temporary lock after repeated failures  

## High-value listings

`requireIdentityAboveInr` (default ₹50,000) is admin-configurable. Unverified high-value listings raise fraud signals and may show “Use extra caution” on the product page.

## Fraud & trust integration

Verification is **one layer** among:

identity + face + liveness + phone + email + device/session risk + listing risk + price anomaly + message safety + behavior + moderation.

`TrustScoreEngine` caps verification contribution (~22 points max). Face verification alone cannot create an extremely high trust score.

Even face-verified accounts can be HIGH/CRITICAL risk when other signals stack.

## Webhooks

`POST /api/webhooks/identity-verification`

- Requires signature (`x-fairprice-idv-signature`)  
- Idempotent via `providerEventId`  
- Rejects unsigned / invalid signatures  

## Admin

`/admin/verification` — stats, policy thresholds, review cases, revoke.  
Actions write `VerificationAuditLog` + `AuditLog`.

## Retention & deletion

- Metadata retention: policy `metadataRetentionDays`  
- User deletion request: `/api/verification/deletion-request` clears capability flags, withdraws consent, revokes verified sessions; audit may be retained for legal reasons  

## Security tests covered

- State machine transitions  
- Client status manipulation rejected  
- Webhook signature + replay idempotency  
- RBAC `verification:review`  
- Biometric scrubbing in audit metadata  
- Fraud still fires for verified users with stacked risk  

## Production provider integration

1. Implement `IdentityVerificationProvider` for your vendor  
2. Set `IDENTITY_VERIFICATION_PROVIDER=external`  
3. Set `MOCK_IDENTITY_VERIFICATION=false`  
4. Configure `IDENTITY_WEBHOOK_SECRET`  
5. Keep temporary media with the provider; store only references + status locally  
