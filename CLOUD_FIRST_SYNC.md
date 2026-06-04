# Cloud-First Hybrid Sync Model

This document explains the current hybrid architecture for Foromane and the intended path to a true cloud-first experience with offline fallback.

## Principles

- Firestore is the primary source of truth when available.
- Local IndexedDB is treated as an offline cache and synchronization buffer only.
- User authentication and profile state should prefer cloud state over local state.
- Local storage should not overwrite an active cloud-authenticated profile.

## Current behavior

1. On application startup, the app attempts to restore an active Firebase session via `window.loadFirebaseUserSession()`.
2. If a cloud session is restored, the remote Firestore profile is loaded and the app state is initialized from that profile.
3. If no cloud session exists or Firebase is unavailable, the app falls back to local IndexedDB profile data.
4. Registration first attempts to create a Firebase user profile via `window.createFirebaseUserProfile()`.
5. If Firebase is unavailable, registration data is persisted locally and queued for later synchronization.
6. Pending offline registrations may be reconciled to Firestore automatically when the device reconnects.
7. Login first attempts Firebase credential-based sign-in via `window.loginWithFirebaseCredential()`.
8. Local login is only used when Firebase is unreachable or offline.

## Configuration

- `window.RATE_LIMIT_ENDPOINT` or `window.rateLimitEndpoint` may be set to a cloud function endpoint for server-side protection.
- `window.invokeServerRateLimit()` is available to call the rate limit endpoint for login and registration attempts.
- `window.syncOfflineUserProfile()` is provided as a helper for rehydrating locally-created profiles to Firestore when connectivity returns.

## Recommended migration path

1. Add a dedicated offline sync queue for `profiles` and `credentials` with explicit retry logic.
2. Assign cloud-safe identifiers for offline-created users and mark them as `pendingSync`.
3. Use normalized credential keys consistently to avoid duplicate records across local and cloud storage.
4. Add conflict detection so that if a credential already exists in Firestore, the offline user is prompted to resolve it.
5. Support `pendingSync`, `localOnly`, and `syncStatus: 'conflict'` states for offline-created profiles that cannot be synced automatically.
6. Build a clear offline mode UI state so users understand when they are operating on local-only data.

## Notes for production readiness

- Maintain a consistent normalization strategy for emails, usernames, phone numbers, and WhatsApp numbers.
- Prefer `credentials/{type}_{normalized}` document IDs instead of wide collection queries.
- Keep local-only credentials separate from cloud-synced credentials to prevent accidental overwrite.
- Use `pendingSync` and `localOnly` metadata on offline-created profiles and credential records.
- Add a dedicated sync path to reconcile `pendingSync` users with Firestore once network is restored.
- Replace WhatsApp verification stubs with a real provider before enabling full account activation.
