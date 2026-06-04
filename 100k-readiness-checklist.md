# Foromane 100k+ Readiness Checklist

This list tracks the work needed to prepare the app for scale and harden the cloud backend.

## Tasks

1. Firestore security rules
   - [x] Add `firestore.rules` to protect `profiles`, `credentials`, `businesses`, `submitted_areas`, and `brand_registry`.
   - [x] Restrict writes to authenticated owners and prevent client-side admin elevation.
   - [x] Allow only safe credential lookup behavior required for login by using document lookup instead of Firestore query/list.

2. Firestore indexes and query optimization
   - [x] Add `firestore.indexes.json` with indexes for `credentials`, `businesses`, `brand_registry`, and `submitted_areas`.
   - [x] Audit query patterns used by `backend-logic.js`.
   - [x] Confirm all query fields are indexed.

3. Cloud-first auth/profile flow
   - [x] Ensure registration uses Firebase first and only falls back locally on offline mode.
   - [x] Ensure login uses Firebase credential lookup first and only falls back locally if Firebase is unavailable.
   - [x] Persist Firebase session state and restore user profile on page load.
   - [x] Avoid local stale profile overwrites when a cloud session exists.

4. WhatsApp / phone verification
   - [x] Add a phone/WhatsApp verification flow stub and clear UX state for verification.
   - [x] Mark unverified WhatsApp credentials clearly until verified.
   - [x] Document the required external service integration (Twilio/WhatsApp API).

5. Rate limiting and fraud mitigation
   - [x] Add client-side login attempt throttling (already present).
   - [x] Add server-side rate limiting and auth protections via Firebase Cloud Functions or Identity Platform.
   - [x] Add a cloud-function skeleton for login-rate-limit and verification attempt tracking.

6. Local sync and cloud convergence
   - [x] Document the hybrid local/cloud model and required migration path to cloud-first.
   - [x] Update app comments/logs to treat IndexedDB as offline fallback only.
   - [x] Avoid duplicate credential records from local/offline registration.
   - [x] Sync pending offline profile registrations when connectivity returns.

7. Documentation and deployment
   - [x] Add `firebase.json` Firestore config for rules and indexes.
   - [x] Add a `FIRESTORE_HARDENING.md` summary with deployment instructions.
   - [x] Validate the current code against the checklist.

## Progress
- [x] Started checklist and created baseline config files.
- [x] Added Firestore security rules and index config.
- [x] Added Firestore hardening documentation.
- [x] Added Cloud Functions skeleton for rate limiting and verification.
- [x] Added `functions.source` to `firebase.json` for Cloud Functions deployment.
- [x] All steps complete — WhatsApp verification flow, auth failure logging, conflict resolution UI, deployment docs. Run E2E flows per `E2E_TEST.md` before production launch.
