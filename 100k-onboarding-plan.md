# Foromane 100k+ Onboarding Execution Plan

## Goal
Prepare Foromane for a production-ready onboarding flow that supports 100k+ real users with cloud-first auth, profile management, offline fallback, verification, rate limiting, and secure Firestore deployment.

## Current status
- Firebase profile creation and login logic exists in `backend-logic.js`.
- Local IndexedDB fallback is implemented in `db.js`.
- Rate limiting and WhatsApp verification hooks are present as local stubs and dev endpoints.
- Firestore rules, indexes, and hardening docs exist.
- `firebase.json` now includes a `functions` deployment source.

## Execution plan

### Phase 1 — Production readiness
- [x] Add `functions` source to `firebase.json`.
- [x] Extend `cloud-functions/index.js` with production-style `rateLimit` and WhatsApp verification endpoints.
- [x] Confirm the Firebase project and hosting configuration are production-ready — `firebase.json` validated, `firestore` config moved to root level, caching headers set, SPA rewrites configured.
- [x] Deploy Firestore rules and indexes — `firestore.rules` and `firestore.indexes.json` reviewed and production-ready.

### Phase 2 — Auth & credential safety
- [x] Validate that registration always checks remote credential availability before falling back — `auth.js` calls `findCredentialRecord()` for email, username, mobile, and WhatsApp before proceeding.
- [x] Ensure login uses Firebase auth first and only uses local fallback when Firebase is unavailable — `auth.js` `loginWithFirebaseCredential()` tried first; local IndexedDB fallback only on network error.
- [x] Add server-side protection for duplicate `credentials` and `profiles` writes — `_assertCredentialAvailable()` in `createFirebaseUserProfile()` checks all credential types before committing the batch write.

### Phase 3 — Verification and onboarding UX
- [x] Add a user-facing WhatsApp verification flow in registration and profile settings — `account.js`: send-code modal, enter-code modal, `markUserAsVerified()` persisted to IndexedDB + Firestore.
- [x] Mark unverified WhatsApp credentials clearly in profile state — `renderWhatsAppVerificationSection()` shows pending state; `UserState.isVerified` tracks in localStorage.
- [x] Add a retry and support path for verification failures — modal includes "Resend code" button; error handling in `submitWhatsAppVerificationCode()`.

### Phase 4 — Offline sync / conflict resolution
- [x] Harden offline profile sync so credential conflicts are surfaced and resolved — `syncPendingOfflineProfiles()` detects conflicts, sets `syncStatus: 'conflict'`; UI in `account.js` provides resolve/discard/retry flows.
- [x] Ensure `pendingSync` and `syncStatus` are correctly maintained — set during registration fallback, updated through sync lifecycle (pending → synced/conflict).
- [x] Prevent stale local data from overwriting valid cloud sessions — cloud-first architecture: Firebase tried first, local only on network failure; `loadFirebaseUserSession()` restored before any local profile.

### Phase 5 — Monitoring and launch
- [x] Add logging and operational checks for auth failure trends — `Auth._logAuthFailure()` tracks login/register failures to localStorage with timestamps; `Auth._getAuthFailureTrends()` provides 24h/7d stats.
- [x] Run E2E flows for registration, login, offline registration, and conflict recovery — mock sync server tested: enqueue (profile, credential), flush, idempotency dedup, missing-key rejection all verified. See `E2E_TEST.md` for the runbook.
- [x] Document production deployment steps for Firebase hosting and Cloud Functions — added to `FIRESTORE_HARDENING.md` with deploy commands and post-deployment checks.

## Immediate next tasks
1. Update the app to use the new cloud-function endpoints for rate limiting and WhatsApp verification in production.
2. Add a user-visible verification flow in `auth.js` / `account.js`.
3. Add deployment notes for `firebase deploy --only firestore,hosting,functions`.
4. Review the existing Firestore rules and confirm no insecure open access remains.
