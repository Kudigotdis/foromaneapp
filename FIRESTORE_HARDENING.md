# Firestore Hardening and Indexing

## Current Firestore usage

The app currently uses Firestore in `backend-logic.js` for:

- `credentials` collection
  - Query by `credential` for login and duplicate checks.
- `profiles` collection
  - Read by document ID (user UID) for session restoration.
  - Create and update on registration.
- `businesses` collection
  - Query by `status`, `ownerId`, `onboardedBy` for onboarding and admin views.
- `submitted_areas` collection
  - Add public area submissions.
  - Read all submitted areas for town/area lookup.
- `brand_registry` collection
  - Query by `brand`, `verified` for brand verification and public display.

## Recommended Firestore indexes

The following indexes are added in `firestore.indexes.json`:

- `credentials.credential`
- `businesses.status`
- `businesses.ownerId`
- `businesses.onboardedBy`
- `brand_registry.brand`
- `brand_registry.verified`
- `submitted_areas.country`
- `submitted_areas.town`
- `submitted_areas.area`

## Security rule goals

The `firestore.rules` file now attempts to enforce:

- Only authenticated users may write their own `profiles`.
- `credentials` write operations are allowed only when tied to the authenticated user's UID.
- `businesses` may be created by authenticated users and updated only by the business owner.
- `submitted_areas` may be written by authenticated users, but once created they cannot be updated or deleted by clients.
- `brand_registry` is readable publicly but writeable only by authenticated users.

## Remaining hardening requirements

- `credentials` reads are currently open for login lookup. The app now uses document-level credential lookup by ID (`credentials/{type}_{normalizedCredential}`) instead of Firestore query/list, which is safer for production.
- Add custom claims or a backend admin check for role-based admin operations.
- Enforce stricter field validation in rules for all user-supplied profile fields.
- Add rate limiting on login and profile creation to a server-side endpoint. The client now has optional `window.invokeServerRateLimit()` support for `login` and `register` actions.
- Ensure `createFirebaseUserProfile()` checks remote credential availability before writing user and credential documents, to prevent duplicate credential collisions.
- Mark offline-only local profile and credential records with `pendingSync` / `localOnly` so they remain distinct from cloud-synced accounts.
- Track sync conflict state with `syncStatus: 'conflict'` for locally-created profiles whose credentials already exist in Firestore.
- Add a verified WhatsApp/phone state property before allowing account activation.
- Replace the current `sendWhatsAppVerificationCode` / `verifyWhatsAppCode` stubs in `backend-logic.js` with a real provider integration.

## Production deployment

### Prerequisites

- Firebase project created at [Firebase Console](https://console.firebase.google.com/)
- Firebase CLI installed (`npm install -g firebase-tools`)
- Logged in: `firebase login`

### Deploy all resources

```bash
firebase deploy --only firestore,hosting,functions
```

This deploys:
- **firestore**: Security rules (`firestore.rules`) and indexes (`firestore.indexes.json`)
- **hosting**: Static assets from the project root (with SPA rewrite for client-side routing)
- **functions**: Cloud Functions from `cloud-functions/` (rate limiting, WhatsApp verification)

### Deploy individual resources

```bash
# Deploy only Firestore rules and indexes
firebase deploy --only firestore

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Cloud Functions
firebase deploy --only functions
```

### Post-deployment checks

1. **Firestore rules**: Verify a profile read/write with the Firebase Auth UID and without auth (should be rejected).
2. **WhatsApp verification**: Call `sendWhatsAppVerificationCode` / `verifyWhatsAppCode` via the cloud function endpoint.
3. **Rate limiting**: Trigger 10+ rapid login attempts and confirm 429 response.
4. **Auth fallback**: Test login with Firebase available, then offline, confirm local fallback works.

## Hybrid local/cloud model

The current app is moving toward a cloud-first experience with local fallback for offline access:

- Firestore is the source of truth when available: auth, profiles, credentials, and onboarding data are written to the cloud.
- IndexedDB is treated as an offline cache and local sync queue only. Local profile creation is only allowed when Firebase is unavailable.
- On startup, `window.loadFirebaseUserSession()` restores a Firebase-authenticated user into app state before any local profile is loaded.
- Registration uses `window.createFirebaseUserProfile()` first and only saves locally when Firebase network or service is unavailable.
- Login uses `window.loginWithFirebaseCredential()` first and falls back to local database only when Firebase is unreachable.
- Sync conflict resolution is handled client-side via `syncPendingOfflineProfiles()` with credential conflict detection and user-facing resolve/discard/retry UI in `account.js`.
