/* ════════════════════════════════════════════════════════
   FOROMANE BACKEND LOGIC - Firebase cloud sync (optional)
   Cloud-first auth/profile handling with offline IndexedDB fallback.
   Firestore is the source of truth when available; local storage is
   only used when Firebase is unavailable.
   ════════════════════════════════════════════════════════ */

// Lazy Firebase loader — dynamic import works from file:// for CDN URLs
var _firebase = null;

async function _getFirebase() {
  if (_firebase) return _firebase;
  try {
    var fa = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    var fs = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    var au = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    var st = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js');

    var app = fa.initializeApp(window.firebaseConfig);
    var auth = au.getAuth(app);
    try {
      await au.setPersistence(auth, au.browserLocalPersistence);
    } catch (persistenceError) {
      console.warn('Could not set Firebase auth persistence:', persistenceError);
    }
    await new Promise(function(resolve) {
      au.onAuthStateChanged(auth, function(user) {
        resolve(user);
      });
    });
    if (!auth.currentUser) {
      await au.signInAnonymously(auth).catch(function(){});
    }
    _firebase = {
      app: app,
      db: fs.getFirestore(app),
      auth: auth,
      storage: st.getStorage(app),
      firestore: fs,
      authModule: au,
      storageModule: st
    };
    return _firebase;
  } catch (e) {
    console.warn('Firebase not available (offline or network issue):', e.message);
    return null;
  }
}

function _normalizeCredential(value) {
  if (!value || typeof value !== 'string') return '';
  var normalized = value.trim().toLowerCase();
  if (normalized.includes('@')) {
    return normalized;
  }
  return normalized.replace(/[\s\-\(\)\+]/g, '');
}

function _generateCloudEmail(value) {
  var normalized = _normalizeCredential(value);
  if (!normalized) return '';
  return normalized + '@foromane.local';
}

async function _ensureFirebase() {
  var fb = await _getFirebase();
  if (!fb) throw new Error('Firebase unavailable');
  return fb;
}

async function findCredentialRecord(rawCredential) {
  var fb = await _ensureFirebase();
  var credential = _normalizeCredential(rawCredential);
  if (!credential) return null;

  var credentialTypes = ['email', 'username', 'phone', 'whatsapp'];
  for (var i = 0; i < credentialTypes.length; i++) {
    var docId = credentialTypes[i] + '_' + credential;
    var credDoc = fb.firestore.doc(fb.db, 'credentials', docId);
    var snap = await fb.firestore.getDoc(credDoc);
    if (snap.exists()) {
      return Object.assign({ id: snap.id }, snap.data());
    }
  }
  return null;
}

async function fetchUserProfileByCredential(rawCredential) {
  var fb = await _ensureFirebase();
  var record = await findCredentialRecord(rawCredential);
  if (!record) return null;
  var userId = record.uid || record.profileId;
  if (!userId) return null;
  var profileDoc = fb.firestore.doc(fb.db, 'profiles', userId);
  var snap = await fb.firestore.getDoc(profileDoc);
  if (!snap.exists()) return null;
  return Object.assign({ id: snap.id }, snap.data());
}

async function fetchUserProfileByUid(uid) {
  if (!uid) return null;
  var fb = await _ensureFirebase();
  var profileDoc = fb.firestore.doc(fb.db, 'profiles', uid);
  var snap = await fb.firestore.getDoc(profileDoc);
  if (!snap.exists()) return null;
  return Object.assign({ id: snap.id }, snap.data());
}

async function loadFirebaseUserSession() {
  var fb = await _ensureFirebase();
  if (!fb.auth.currentUser) return null;
  return await fetchUserProfileByUid(fb.auth.currentUser.uid);
}

async function _assertCredentialAvailable(rawCredential, type) {
  var fb = await _ensureFirebase();
  if (!rawCredential || !type) return;
  var normalized = _normalizeCredential(rawCredential);
  if (!normalized) return;
  var docId = type + '_' + normalized;
  var credDoc = fb.firestore.doc(fb.db, 'credentials', docId);
  var snap = await fb.firestore.getDoc(credDoc);
  if (snap.exists()) {
    var conflictData = snap.data() || {};
    var error = new Error('Credential already registered: ' + type);
    error.code = 'credential_conflict';
    error.conflictType = type;
    error.conflictValue = normalized;
    error.existingProfileId = conflictData.profileId || conflictData.uid || null;
    throw error;
  }
}

async function createFirebaseUserProfile(profileData) {
  var fb = await _ensureFirebase();
  if (!profileData) throw new Error('Profile data is required for cloud registration.');
  var actualEmail = profileData.email ? profileData.email.trim().toLowerCase() : '';
  var password = profileData.password;
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  var cloudEmail = actualEmail;
  if (!cloudEmail) {
    var whatsappValue = profileData.primaryWhatsApp || (Array.isArray(profileData.whatsapps) && profileData.whatsapps[0] && profileData.whatsapps[0].countryCode && profileData.whatsapps[0].number ? profileData.whatsapps[0].countryCode + profileData.whatsapps[0].number : '');
    cloudEmail = _generateCloudEmail(whatsappValue);
  }
  if (!cloudEmail) {
    throw new Error('A WhatsApp number is required when no email is provided.');
  }

  // Confirm this new profile will not collide with an existing credential mapping.
  await _assertCredentialAvailable(actualEmail || cloudEmail, 'email');
  await _assertCredentialAvailable(profileData.username, 'username');
  await _assertCredentialAvailable(profileData.primaryMobile, 'phone');
  if (Array.isArray(profileData.whatsapps)) {
    for (var wi = 0; wi < profileData.whatsapps.length; wi++) {
      var wa = profileData.whatsapps[wi];
      if (wa && wa.countryCode && wa.number) {
        await _assertCredentialAvailable(wa.countryCode + wa.number, 'whatsapp');
      }
    }
  }

  var userCredential = await fb.authModule.createUserWithEmailAndPassword(fb.auth, cloudEmail, password);
  var user = userCredential.user;
  await fb.authModule.updateProfile(user, { displayName: profileData.name || '', photoURL: profileData.photo || '' }).catch(function() {});

  var normalizedUsername = profileData.username ? _normalizeCredential(profileData.username) : '';
  var normalizedMobile = profileData.primaryMobile ? _normalizeCredential(profileData.primaryMobile) : '';
  var normalizedWhatsApp = profileData.primaryWhatsApp ? _normalizeCredential(profileData.primaryWhatsApp) : '';
  var contacts = profileData.contacts || { mobiles: [], whatsapps: [], social: {} };
  if (normalizedMobile && (!contacts.mobiles || !contacts.mobiles.length)) {
    contacts.mobiles = [{ countryCode: '', number: normalizedMobile, isPrimary: true }];
  }
  if (normalizedWhatsApp && (!contacts.whatsapps || !contacts.whatsapps.length)) {
    contacts.whatsapps = [{ countryCode: '', number: normalizedWhatsApp, isPrimary: true }];
  }

  var profile = Object.assign({}, profileData, {
    id: user.uid,
    uid: user.uid,
    email: actualEmail || '',
    cloudEmail: cloudEmail,
    username: normalizedUsername || profileData.username || '',
    phone: normalizedMobile || profileData.phone || '',
    primaryMobile: normalizedMobile || profileData.primaryMobile || '',
    primaryWhatsApp: normalizedWhatsApp || profileData.primaryWhatsApp || '',
    contacts: contacts,
    location: profileData.location || { town: profileData.town || '', area: '' },
    interests: Array.isArray(profileData.interests) ? profileData.interests : (profileData.interests || []),
    verified: false,
    verificationStatus: 'pending',
    createdAt: fb.firestore.serverTimestamp(),
    authProvider: 'firebase'
  });
  delete profile.password;

  var profileRef = fb.firestore.doc(fb.db, 'profiles', user.uid);
  var batch = fb.firestore.writeBatch(fb.db);
  batch.set(profileRef, profile);

  function addCredential(type, value) {
    if (!value) return;
    var normalized = _normalizeCredential(value);
    if (!normalized) return;
    var credRef = fb.firestore.doc(fb.db, 'credentials', type + '_' + normalized);
    batch.set(credRef, {
      credential: normalized,
      profileId: user.uid,
      uid: user.uid,
      type: type,
      cloudEmail: cloudEmail,
      createdAt: fb.firestore.serverTimestamp()
    });
  }

  if (actualEmail) addCredential('email', actualEmail);
  addCredential('username', profileData.username);
  if (profileData.primaryMobile) addCredential('phone', profileData.primaryMobile);
  if (Array.isArray(profileData.whatsapps)) {
    profileData.whatsapps.forEach(function(wa) {
      if (wa && wa.countryCode && wa.number) {
        addCredential('whatsapp', wa.countryCode + wa.number);
      }
    });
  }

  await batch.commit();
  return profile;
}

async function updateFirebaseUserVerification(userId, verified) {
  var fb = await _ensureFirebase();
  if (!userId) throw new Error('User ID is required for verification update.');
  var profileRef = fb.firestore.doc(fb.db, 'profiles', userId);
  await fb.firestore.updateDoc(profileRef, {
    verified: !!verified,
    verificationStatus: verified ? 'verified' : 'pending',
    updatedAt: fb.firestore.serverTimestamp()
  });
  return { ok: true };
}

async function syncOfflineUserProfile(profileData) {
  if (!profileData || !profileData.pendingSync) {
    throw new Error('No pending offline profile found to sync');
  }
  return await createFirebaseUserProfile(profileData);
}

async function syncPendingOfflineProfiles() {
  var fb = await _ensureFirebase();
  if (!fb) throw new Error('Firebase unavailable');
  if (!fb.auth.currentUser || (fb.auth.currentUser && !fb.auth.currentUser.isAnonymous && fb.auth.currentUser.uid)) {
    throw new Error('Cannot sync pending offline profiles while a non-anonymous Firebase user is signed in.');
  }
  if (!window.ForomaneDB || !window.ForomaneDB.db) {
    throw new Error('Local IndexedDB is unavailable.');
  }

  var allProfiles = await window.ForomaneDB.getAll('profiles');
  var pendingProfiles = Array.isArray(allProfiles) ? allProfiles.filter(function(profile) {
    return profile && profile.pendingSync;
  }) : [];

  var results = { ok: true, attempted: pendingProfiles.length, synced: 0, conflicts: 0, failed: [] };
  for (var i = 0; i < pendingProfiles.length; i++) {
    var localProfile = pendingProfiles[i];
    try {
      var syncedProfile = await syncOfflineUserProfile(localProfile);
      var syncedLocalProfile = Object.assign({}, syncedProfile, {
        password: localProfile.password,
        pendingSync: false,
        localOnly: false,
        syncStatus: 'synced',
        originalLocalId: localProfile.id
      });

      await window.ForomaneDB.put('profiles', syncedLocalProfile);
      if (window.UserState && window.UserState.id === localProfile.id) {
        window.UserState.id = syncedLocalProfile.id;
        localStorage.setItem('foromane_userId', syncedLocalProfile.id);
        window.UserState.pendingSync = false;
        window.UserState.localOnly = false;
        window.UserState.syncStatus = 'synced';
        window.UserState.syncError = '';
        window.UserState.conflictType = '';
        window.UserState.conflictValue = '';
        window.UserState.conflictExistingProfileId = '';
      }
      if (localProfile.id !== syncedProfile.id) {
        await window.ForomaneDB.delete('profiles', localProfile.id);
      }

      var creds = await window.ForomaneDB.getAll('credentials');
      if (Array.isArray(creds)) {
        for (var j = 0; j < creds.length; j++) {
          var cred = creds[j];
          if (cred && cred.profileId === localProfile.id) {
            cred.profileId = syncedProfile.id;
            cred.uid = syncedProfile.id;
            cred.pendingSync = false;
            cred.localOnly = false;
            cred.syncStatus = 'synced';
            await window.ForomaneDB.put('credentials', cred);
          }
        }
      }

      results.synced++;
    } catch (error) {
      var failure = { id: localProfile.id, error: error.message || String(error) };
      if (error && error.code === 'credential_conflict') {
        failure.type = 'conflict';
        failure.conflictType = error.conflictType;
        failure.conflictValue = error.conflictValue;
        failure.existingProfileId = error.existingProfileId;
        results.conflicts++;

        localProfile.syncStatus = 'conflict';
        localProfile.syncError = error.message;
        localProfile.conflictType = error.conflictType;
        localProfile.conflictValue = error.conflictValue;
        localProfile.conflictExistingProfileId = error.existingProfileId;
        await window.ForomaneDB.put('profiles', localProfile);
      }
      results.failed.push(failure);
    }
  }

  if (typeof window.refreshCurrentOfflineProfileState === 'function') {
    await window.refreshCurrentOfflineProfileState();
  }
  return results;
}

async function getPendingOfflineProfileConflicts() {
  if (!window.ForomaneDB || !window.ForomaneDB.db) {
    throw new Error('Local IndexedDB unavailable.');
  }
  var profiles = await window.ForomaneDB.getAll('profiles');
  return Array.isArray(profiles) ? profiles.filter(function(profile) {
    return profile && profile.syncStatus === 'conflict';
  }) : [];
}

async function discardPendingOfflineProfile(profileId) {
  if (!profileId) {
    throw new Error('Profile ID is required');
  }
  if (!window.ForomaneDB || !window.ForomaneDB.db) {
    throw new Error('Local IndexedDB unavailable.');
  }
  var profile = await window.ForomaneDB.get('profiles', profileId);
  if (!profile) {
    throw new Error('Offline profile not found');
  }
  if (!profile.pendingSync && profile.syncStatus !== 'conflict') {
    throw new Error('Profile is not an offline pending or conflict record');
  }
  var creds = await window.ForomaneDB.getAll('credentials');
  if (Array.isArray(creds)) {
    for (var k = 0; k < creds.length; k++) {
      var cred = creds[k];
      if (cred && cred.profileId === profileId) {
        await window.ForomaneDB.delete('credentials', cred.id);
      }
    }
  }
  await window.ForomaneDB.delete('profiles', profileId);
  return { ok: true, removedProfileId: profileId };
}

async function refreshCurrentOfflineProfileState() {
  if (!window.ForomaneDB || !window.ForomaneDB.db || !window.UserState || !window.UserState.id) {
    return null;
  }
  var profile = await window.ForomaneDB.get('profiles', window.UserState.id);
  if (!profile) return null;

  window.UserState.set(profile.id, profile.name, profile.role, '', profile.town, profile.phone || '');
  window.UserState.firstName = profile.firstName || '';
  window.UserState.surname = profile.surname || '';
  window.UserState.username = profile.username || '';
  window.UserState.dateOfBirth = profile.dateOfBirth || '';
  window.UserState.gender = profile.gender || '';
  window.UserState.nationality = profile.nationality || '';
  window.UserState.race = profile.race || '';
  window.UserState.contacts = profile.contacts || { mobiles:[], whatsapps:[], social:{} };
  window.UserState.location = profile.location || { town: profile.town || '', area: '' };
  window.UserState.interests = profile.interests || [];
  window.UserState.setVerified(!!profile.verified);
  localStorage.setItem('foromane_userId', profile.id);
  if (profile.photo) localStorage.setItem('foromane_photo', profile.photo);
  localStorage.setItem('foromane_username', window.UserState.username);
  localStorage.setItem('foromane_dob', window.UserState.dateOfBirth);
  localStorage.setItem('foromane_gender', window.UserState.gender);
  localStorage.setItem('foromane_nationality', window.UserState.nationality);
  localStorage.setItem('foromane_race', window.UserState.race);
  if (typeof window.UserState._persistContacts === 'function') window.UserState._persistContacts();
  if (typeof window.UserState._persistLocation === 'function') window.UserState._persistLocation();
  if (typeof window.UserState._persistInterests === 'function') window.UserState._persistInterests();

  window.UserState.pendingSync = !!profile.pendingSync;
  window.UserState.localOnly = !!profile.localOnly;
  window.UserState.syncStatus = profile.syncStatus || '';
  window.UserState.syncError = profile.syncError || '';
  window.UserState.conflictType = profile.conflictType || '';
  window.UserState.conflictValue = profile.conflictValue || '';
  window.UserState.conflictExistingProfileId = profile.conflictExistingProfileId || '';
  return profile;
}

async function updateOfflineProfileCredential(profileId, type, rawValue) {
  if (!profileId || !type || !rawValue) {
    throw new Error('Profile ID, credential type and new value are required.');
  }
  if (!window.ForomaneDB || !window.ForomaneDB.db) {
    throw new Error('Local IndexedDB unavailable.');
  }
  var allowedTypes = ['email', 'username', 'phone', 'whatsapp'];
  if (allowedTypes.indexOf(type) === -1) {
    throw new Error('Unsupported credential type: ' + type);
  }
  var normalized = _normalizeCredential(rawValue);
  if (!normalized) {
    throw new Error('Enter a valid credential value.');
  }
  var profile = await window.ForomaneDB.get('profiles', profileId);
  if (!profile) {
    throw new Error('Offline profile not found.');
  }
  if (!profile.pendingSync && profile.syncStatus !== 'conflict') {
    throw new Error('Profile is not pending sync or in conflict.');
  }

  if (type === 'email') {
    profile.email = normalized;
  } else if (type === 'username') {
    profile.username = normalized;
  } else if (type === 'phone') {
    profile.primaryMobile = normalized;
    profile.phone = normalized;
    if (profile.contacts && Array.isArray(profile.contacts.mobiles)) {
      var primaryMobile = profile.contacts.mobiles.find(function(m) { return m.isPrimary; }) || profile.contacts.mobiles[0];
      if (primaryMobile) {
        primaryMobile.countryCode = '';
        primaryMobile.number = normalized;
      }
    }
  } else if (type === 'whatsapp') {
    profile.primaryWhatsApp = normalized;
    if (profile.contacts && Array.isArray(profile.contacts.whatsapps)) {
      var primaryWa = profile.contacts.whatsapps.find(function(w) { return w.isPrimary; }) || profile.contacts.whatsapps[0];
      if (primaryWa) {
        primaryWa.countryCode = '';
        primaryWa.number = normalized;
      }
    }
    if (Array.isArray(profile.whatsapps) && profile.whatsapps.length) {
      profile.whatsapps[0].countryCode = '';
      profile.whatsapps[0].number = normalized;
    }
  }

  profile.syncStatus = 'pending';
  profile.syncError = '';
  profile.conflictType = '';
  profile.conflictValue = '';
  profile.conflictExistingProfileId = '';

  var existingCreds = await window.ForomaneDB.getAll('credentials');
  if (Array.isArray(existingCreds)) {
    for (var i = 0; i < existingCreds.length; i++) {
      var cred = existingCreds[i];
      if (!cred || cred.profileId !== profileId || !cred.id) continue;
      if (cred.id.indexOf('cred_' + type + '_') !== 0) continue;
      if (cred.credential === normalized) continue;
      await window.ForomaneDB.delete('credentials', cred.id);
    }
  }

  var newCred = {
    id: 'cred_' + type + '_' + normalized,
    credential: normalized,
    profileId: profileId,
    pendingSync: !!profile.pendingSync,
    localOnly: !!profile.localOnly,
    syncStatus: profile.syncStatus
  };
  await window.ForomaneDB.put('credentials', newCred);
  await window.ForomaneDB.put('profiles', profile);

  try {
    if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
      await window.SyncQueue.enqueue('profiles', profile, { clientId: profileId });
      await window.SyncQueue.enqueue('credentials', newCred, { clientId: profileId });
      if (window.requestBackgroundSync) {
        await window.requestBackgroundSync().catch(function() {});
      }
    }
  } catch (e) {
    console.warn('Failed to enqueue updated offline credential for sync:', e);
  }

  return profile;
}

window.getPendingOfflineProfileConflicts = getPendingOfflineProfileConflicts;
window.discardPendingOfflineProfile = discardPendingOfflineProfile;
window.refreshCurrentOfflineProfileState = refreshCurrentOfflineProfileState;
window.updateOfflineProfileCredential = updateOfflineProfileCredential;

async function loginWithFirebaseCredential(rawCredential, password) {
  var fb = await _ensureFirebase();
  var credential = _normalizeCredential(rawCredential);
  if (!credential) throw new Error('Enter a username, WhatsApp number, or phone to sign in.');

  var record = await findCredentialRecord(credential);
  if (!record) return null;

  var signInEmail = record.cloudEmail || record.email;
  if (!signInEmail) return null;

  await fb.authModule.signInWithEmailAndPassword(fb.auth, signInEmail, password);
  return await fetchUserProfileByUid(fb.auth.currentUser.uid);
}

async function sendPasswordResetEmail(email) {
  var fb = await _ensureFirebase();
  var rawEmail = email ? email.trim().toLowerCase() : '';
  if (!rawEmail || !rawEmail.includes('@')) throw new Error('A real email address is required.');
  if (rawEmail.endsWith('@foromane.local')) throw new Error('No real email address is registered for this account.');
  await fb.authModule.sendPasswordResetEmail(fb.auth, rawEmail);
}

async function signOutFirebase() {
  var fb = await _ensureFirebase();
  await fb.authModule.signOut(fb.auth);
}

async function invokeServerRateLimit(action, details) {
  var endpoint = window.RATE_LIMIT_ENDPOINT || window.rateLimitEndpoint;
  if (!endpoint) {
    return { ok: true };
  }
  try {
    var response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action || 'unknown', details: details || {}, timestamp: Date.now() })
    });
    var payload = await response.json().catch(function() { return null; });
    if (!response.ok) {
      console.warn('Rate limit endpoint returned', response.status, payload || response.statusText);
      return { ok: false, blocked: payload?.error || true, reason: payload?.error || 'Rate limit check failed' };
    }
    return payload || { ok: true };
  } catch (e) {
    console.warn('Rate limit endpoint unavailable:', e);
    return { ok: true };
  }
}

// ==========================================
// 2. ZERO-BUDGET CLOUD SYNC (P350 ONBOARDING)
// ==========================================
async function syncBusinessOnboarding(businessData) {
  var fb = await _getFirebase();
  if (!fb) throw new Error('Firebase unavailable — cannot sync business data.');

  if (!fb.auth.currentUser) {
    throw new Error('Access Denied: User must be authenticated to sync business data.');
  }

  var userId = fb.auth.currentUser.uid;
  var logoPath = window.generateHierarchyPath(
    businessData.category || 'misc',
    businessData.subCategory || 'general',
    businessData.name || 'unnamed-biz',
    'logo.png'
  );

  var logoUrl = null;

  if (businessData.logoFile instanceof Blob) {
    try {
      var storageRef = fb.storageModule.ref(fb.storage, logoPath);
      await fb.storageModule.uploadBytes(storageRef, businessData.logoFile);
      logoUrl = await fb.storageModule.getDownloadURL(storageRef);
      console.log('Logo uploaded to Cloud Storage:', logoUrl);
    } catch (e) {
      console.error('Cloud Storage Upload Failed:', e);
    }

    try {
      await window.ForomaneMediaCache.put(logoPath, businessData.logoFile);
      console.log('Logo cached locally at:', logoPath);
    } catch (e) {
      console.warn('Local cache failed, falling back to cloud URL.');
    }
  }

  var payload = Object.assign({}, businessData, {
    logoPath: logoPath,
    logoUrl: logoUrl,
    onboardedBy: userId,
    ownerId: userId,
    status: 'pending_approval',
    timestamp: fb.firestore.serverTimestamp()
  });

  delete payload.logoFile;
  delete payload.bannerFile;

  try {
    var docRef = await fb.firestore.addDoc(fb.firestore.collection(fb.db, 'businesses'), payload);
    console.log('Business Onboarding Synced. Doc ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Cloud Sync Failed:', error);
    throw error;
  }
}

// ==========================================
// 8. ADMIN USER MANAGEMENT (suspend/ban/reactivate)
// ==========================================

var _adminCache = { list: [], loaded: false };

async function refreshAdminList() {
  var fb = await _getFirebase();
  if (!fb) { _adminCache = { list: ['admin'], loaded: false }; return ['admin']; }
  try {
    var col = fb.firestore.collection(fb.db, 'admins');
    var snap = await fb.firestore.getDocs(col);
    var admins = [];
    snap.forEach(function(doc) { admins.push(doc.id); });
    _adminCache = { list: admins, loaded: true };
    return admins;
  } catch (e) {
    console.warn('Failed to load admin list from Firestore:', e);
    _adminCache = { list: ['admin'], loaded: false };
    return ['admin'];
  }
}

async function isAdminUser(userId) {
  if (!userId || userId === 'guest') return false;
  if (userId === 'admin') return true;
  if (!_adminCache.loaded) await refreshAdminList();
  return _adminCache.list.indexOf(userId) !== -1;
}

async function updateUserStatus(userId, status, reason) {
  var fb = await _ensureFirebase();
  if (!userId) throw new Error('User ID is required');
  var adminId = fb.auth.currentUser ? fb.auth.currentUser.uid : null;
  if (!adminId || !await isAdminUser(adminId)) {
    throw new Error('Unauthorized: Only admins can change user status');
  }
  var validStatuses = ['active', 'suspended', 'banned'];
  if (validStatuses.indexOf(status) === -1) {
    throw new Error('Invalid status: must be active, suspended, or banned');
  }
  var profileRef = fb.firestore.doc(fb.db, 'profiles', userId);
  var updateData = {
    status: status,
    statusChangedAt: fb.firestore.serverTimestamp(),
    statusChangedBy: adminId
  };
  if (reason) updateData.statusReason = reason;
  await fb.firestore.updateDoc(profileRef, updateData);
  // Also update local IndexedDB if the user is the current profile
  if (window.ForomaneDB && window.ForomaneDB.db) {
    try {
      var localProfile = await window.ForomaneDB.get('profiles', userId);
      if (localProfile) {
        localProfile.status = status;
        localProfile.statusChangedAt = new Date().toISOString();
        localProfile.statusChangedBy = adminId;
        if (reason) localProfile.statusReason = reason;
        await window.ForomaneDB.put('profiles', localProfile);
      }
    } catch (e) { console.warn('Failed to update local profile status:', e); }
  }
  return { ok: true, userId: userId, status: status };
}

async function suspendUser(userId, reason) {
  return await updateUserStatus(userId, 'suspended', reason || 'Suspended by admin');
}

async function banUser(userId, reason) {
  return await updateUserStatus(userId, 'banned', reason || 'Banned by admin');
}

async function reactivateUser(userId) {
  return await updateUserStatus(userId, 'active', '');
}

window._ensureFirebase = _ensureFirebase;
window.refreshAdminList = refreshAdminList;
window.isAdminUser = isAdminUser;
window.updateUserStatus = updateUserStatus;
window.suspendUser = suspendUser;
window.banUser = banUser;
window.reactivateUser = reactivateUser;

window.syncBusinessOnboarding = syncBusinessOnboarding;

// ==========================================
// 3. ADMIN APPROVAL QUEUE (INDEXEDDB WRAPPER)
// ==========================================
const ApprovalQueueDB = {
  dbName: 'foromane-admin-queue',
  dbVersion: 1,
  storeName: 'approvalQueue',
  dbInstance: null,

  async init() {
    var self = this;
    return new Promise(function(resolve, reject) {
      var request = indexedDB.open(self.dbName, self.dbVersion);
      request.onerror = function() { reject(request.error); };
      request.onsuccess = function() {
        self.dbInstance = request.result;
        resolve(self.dbInstance);
      };
      request.onupgradeneeded = function(event) {
        var db = event.target.result;
        if (!db.objectStoreNames.contains(self.storeName)) {
          db.createObjectStore(self.storeName, { keyPath: 'localId', autoIncrement: true });
        }
      };
    });
  },

  async addPending(data) {
    if (!this.dbInstance) await this.init();
    var self = this;
    return new Promise(function(resolve, reject) {
      var tx = self.dbInstance.transaction(self.storeName, 'readwrite');
      var store = tx.objectStore(self.storeName);
      data.localCreatedAt = Date.now();
      var request = store.add(data);
      request.onsuccess = function() { resolve(request.result); };
      request.onerror = function() { reject(request.error); };
    });
  },

  async getAllPending() {
    if (!this.dbInstance) await this.init();
    var self = this;
    return new Promise(function(resolve, reject) {
      var tx = self.dbInstance.transaction(self.storeName, 'readonly');
      var store = tx.objectStore(self.storeName);
      var request = store.getAll();
      request.onsuccess = function() { resolve(request.result); };
      request.onerror = function() { reject(request.error); };
    });
  },

  async removePending(localId) {
    if (!this.dbInstance) await this.init();
    var self = this;
    return new Promise(function(resolve, reject) {
      var tx = self.dbInstance.transaction(self.storeName, 'readwrite');
      var store = tx.objectStore(self.storeName);
      var request = store.delete(localId);
      request.onsuccess = function() { resolve(); };
      request.onerror = function() { reject(request.error); };
    });
  }
};

window.ApprovalQueueDB = ApprovalQueueDB;

// ==========================================
// 4. ROBUST ACCOUNT DELETION (HUSTLER LOGIC)
// ==========================================
async function deleteAccount() {
  console.warn('Initiating robust account deletion...');

  localStorage.clear();
  sessionStorage.clear();

  if (window.UserState && typeof window.UserState.clear === 'function') {
    window.UserState.clear();
  }

  if (window.ForomaneDB && window.ForomaneDB.db) {
    window.ForomaneDB.db.close();
  }
  if (ApprovalQueueDB.dbInstance) {
    ApprovalQueueDB.dbInstance.close();
  }

  var databasesToWipe = ['foromane-supply-solutions', 'foromane-admin-queue', 'foromane-sync'];

  var deletePromises = databasesToWipe.map(function(dbName) {
    return new Promise(function(resolve) {
      var req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = function() { resolve(); };
      req.onerror = function() { resolve(); };
      req.onblocked = function() { resolve(); };
    });
  });

  await Promise.all(deletePromises);
  if (location.protocol !== 'file:') window.location.replace('/');
}

window.deleteAccount = deleteAccount;

// ==========================================
// 5. ADMIN FIRESTORE UTILITIES
// ==========================================

async function fetchPendingOnboarding() {
  var fb = await _getFirebase();
  if (!fb) throw new Error('Firebase unavailable');

  var q = fb.firestore.query(
    fb.firestore.collection(fb.db, 'businesses'),
    fb.firestore.where('status', '==', 'pending_approval')
  );
  var querySnapshot = await fb.firestore.getDocs(q);
  var results = [];
  querySnapshot.forEach(function(doc) {
    results.push(Object.assign({ id: doc.id }, doc.data()));
  });
  return results;
}

async function approveOnboarding(docId) {
  var fb = await _getFirebase();
  if (!fb) throw new Error('Firebase unavailable');

  var docRef = fb.firestore.doc(fb.db, 'businesses', docId);
  await fb.firestore.updateDoc(docRef, {
    status: 'active',
    approvedAt: fb.firestore.serverTimestamp(),
    approvedBy: fb.auth.currentUser ? fb.auth.currentUser.uid : 'system'
  });
  console.log('Business ' + docId + ' approved and active!');
  return true;
}

async function recordInteraction(bizId, type) {
  if (type === undefined || type === null) type = 'views';
  if (!bizId || bizId.startsWith('biz_sample')) return;

  var fb = await _getFirebase();
  if (!fb) return;

  var docRef = fb.firestore.doc(fb.db, 'businesses', bizId);
  await fb.firestore.updateDoc(docRef, {});
  var update = {};
  update['kpi.' + type] = fb.firestore.increment(1);
  await fb.firestore.updateDoc(docRef, update);
}

async function fetchUserBusiness(uid) {
  var fb = await _getFirebase();
  if (!fb) throw new Error('Firebase unavailable');

  function queryByField(field) {
    return fb.firestore.query(
      fb.firestore.collection(fb.db, 'businesses'),
      fb.firestore.where(field, '==', uid)
    );
  }

  var querySnapshot = await fb.firestore.getDocs(queryByField('ownerId'));
  if (!querySnapshot.empty) {
    var doc = querySnapshot.docs[0];
    return Object.assign({ id: doc.id }, doc.data());
  }

  querySnapshot = await fb.firestore.getDocs(queryByField('onboardedBy'));
  if (!querySnapshot.empty) {
    var doc = querySnapshot.docs[0];
    return Object.assign({ id: doc.id }, doc.data());
  }

  return null;
}

// ==========================================
// 6. CROWD-SOURCED AREA DATABASE
// ==========================================

var _submittedAreasLoaded = false;

async function submitAreaToFirestore(country, town, area) {
  var fb = await _getFirebase();
  if (!fb) return;
  try {
    var col = fb.firestore.collection(fb.db, 'submitted_areas');
    var type = area ? 'area' : 'town';
    await fb.firestore.addDoc(col, {
      type: type,
      country: country,
      town: town,
      area: area || '',
      submittedAt: fb.firestore.serverTimestamp(),
      approved: false
    });
  } catch (e) {
    console.warn('Could not sync area to Firestore:', e.message);
  }
}

async function loadSubmittedAreas() {
  if (_submittedAreasLoaded) return;
  window.submittedTownsCache = window.submittedTownsCache || [];
  window.submittedAreasCache = window.submittedAreasCache || [];
  var fb = await _getFirebase();
  if (!fb) return;
  try {
    var col = fb.firestore.collection(fb.db, 'submitted_areas');
    var snap = await fb.firestore.getDocs(col);
    snap.forEach(function(doc) {
      var d = doc.data();
      var cache = d.type === 'town' ? window.submittedTownsCache : window.submittedAreasCache;
      var exists = cache.some(function(e) {
        return e.country === d.country && e.town === d.town && (d.type !== 'area' || e.area === d.area);
      });
      if (!exists) cache.push(d);
    });
    _submittedAreasLoaded = true;
  } catch (e) {
    console.warn('Could not load submitted areas:', e.message);
  }
}

window.submitAreaToFirestore = submitAreaToFirestore;
window.loadSubmittedAreas = loadSubmittedAreas;
window.fetchPendingOnboarding = fetchPendingOnboarding;
window.approveOnboarding = approveOnboarding;
window.recordInteraction = recordInteraction;
window.fetchUserBusiness = fetchUserBusiness;
window.findCredentialRecord = findCredentialRecord;
window.fetchUserProfileByCredential = fetchUserProfileByCredential;
window.fetchUserProfileByUid = fetchUserProfileByUid;
window.loadFirebaseUserSession = loadFirebaseUserSession;
window.createFirebaseUserProfile = createFirebaseUserProfile;
window.updateFirebaseUserVerification = updateFirebaseUserVerification;
window.syncOfflineUserProfile = syncOfflineUserProfile;
window.syncPendingOfflineProfiles = syncPendingOfflineProfiles;
window.loginWithFirebaseCredential = loginWithFirebaseCredential;
window.invokeServerRateLimit = invokeServerRateLimit;
window.sendPasswordResetEmail = sendPasswordResetEmail;
window.signOutFirebase = signOutFirebase;

// ==========================================
// 7. BRAND REGISTRY SYNC
// ==========================================

async function syncBrandSubmission(brandName, userId, userEmail) {
  var fb = await _getFirebase();
  if (!fb) return null;
  try {
    var col = fb.firestore.collection(fb.db, 'brand_registry');
    var q = fb.firestore.query(
      col,
      fb.firestore.where('brand', '==', brandName.toLowerCase().trim())
    );
    var snap = await fb.firestore.getDocs(q);
    if (snap.empty) {
      var docRef = await fb.firestore.addDoc(col, {
        brand: brandName.toLowerCase().trim(),
        displayName: brandName.trim(),
        submittedBy: userId || 'anonymous',
        submittedByEmail: userEmail || '',
        submittedAt: fb.firestore.serverTimestamp(),
        addedByUserIds: [userId || 'anonymous'],
        verified: false
      });
      return { id: docRef.id, added: true };
    } else {
      var doc = snap.docs[0];
      var data = doc.data();
      var addedBy = data.addedByUserIds || [];
      if (!addedBy.includes(userId || 'anonymous')) {
        addedBy.push(userId || 'anonymous');
      }
      var verified = addedBy.length >= 25;
      await fb.firestore.updateDoc(fb.firestore.doc(fb.db, 'brand_registry', doc.id), {
        addedByUserIds: addedBy,
        verified: verified,
        lastUpdated: fb.firestore.serverTimestamp()
      });
      return { id: doc.id, added: false, verified: verified, count: addedBy.length };
    }
  } catch (e) {
    console.warn('Brand sync to Firestore failed:', e.message);
    return null;
  }
}

async function loadVerifiedBrands() {
  var fb = await _getFirebase();
  if (!fb) return [];
  try {
    var col = fb.firestore.collection(fb.db, 'brand_registry');
    var q = fb.firestore.query(col, fb.firestore.where('verified', '==', true));
    var snap = await fb.firestore.getDocs(q);
    var brands = [];
    snap.forEach(function(doc) {
      var d = doc.data();
      brands.push({
        name: d.displayName || d.brand,
        categories: d.categories || [],
        firestoreId: doc.id,
        verified: true
      });
    });
    return brands;
  } catch (e) {
    console.debug('Could not load verified brands from Firestore:', e.message);
    return [];
  }
}

window.syncBrandSubmission = syncBrandSubmission;
window.loadVerifiedBrands = loadVerifiedBrands;

// ==========================================
// 9. CONTENT FLAGGING & MODERATION
// ==========================================

async function flagContent(type, targetId, reason, details) {
  if (!type || !targetId || !reason) throw new Error('type, targetId, and reason are required');
  var validTypes = ['promo', 'business', 'profile', 'credential'];
  if (validTypes.indexOf(type) === -1) throw new Error('Invalid type: ' + type);
  var fb = await _ensureFirebase();
  var reporterId = fb.auth.currentUser ? fb.auth.currentUser.uid : (window.UserState ? window.UserState.id : null);
  if (!reporterId || reporterId === 'guest') throw new Error('You must be logged in to flag content');
  var flagDoc = {
    type: type,
    targetId: targetId,
    reportedBy: reporterId,
    reason: reason,
    details: details || '',
    status: 'pending',
    createdAt: fb.firestore.serverTimestamp(),
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: ''
  };
  var flagsCol = fb.firestore.collection(fb.db, 'flagged_content');
  var docRef = await fb.firestore.addDoc(flagsCol, flagDoc);
  return { ok: true, flagId: docRef.id };
}

async function getFlaggedContent(statusFilter) {
  var fb = await _ensureFirebase();
  var adminId = fb.auth.currentUser ? fb.auth.currentUser.uid : null;
  if (!adminId || !await isAdminUser(adminId)) throw new Error('Unauthorized');
  var flagsCol = fb.firestore.collection(fb.db, 'flagged_content');
  var constraints = [];
  if (statusFilter && statusFilter !== 'all') {
    constraints.push(fb.firestore.where('status', '==', statusFilter));
  }
  constraints.push(fb.firestore.orderBy('createdAt', 'desc'));
  var snap = await fb.firestore.getDocs(fb.firestore.query(flagsCol, ...constraints));
  var results = [];
  snap.forEach(function(doc) { results.push(Object.assign({ id: doc.id }, doc.data())); });
  return results;
}

async function reviewFlaggedContent(flagId, action, note) {
  var fb = await _ensureFirebase();
  var adminId = fb.auth.currentUser ? fb.auth.currentUser.uid : null;
  if (!adminId || !await isAdminUser(adminId)) throw new Error('Unauthorized');
  var validActions = ['dismissed', 'action_taken'];
  if (validActions.indexOf(action) === -1) throw new Error('Invalid action');
  var flagRef = fb.firestore.doc(fb.db, 'flagged_content', flagId);
  await fb.firestore.updateDoc(flagRef, {
    status: action,
    reviewedBy: adminId,
    reviewedAt: fb.firestore.serverTimestamp(),
    reviewNote: note || ''
  });
  return { ok: true, flagId: flagId, action: action };
}

async function dismissFlag(flagId, note) {
  return await reviewFlaggedContent(flagId, 'dismissed', note);
}

async function takeActionOnFlag(flagId, note) {
  return await reviewFlaggedContent(flagId, 'action_taken', note);
}

window.flagContent = flagContent;
window.getFlaggedContent = getFlaggedContent;
window.reviewFlaggedContent = reviewFlaggedContent;
window.dismissFlag = dismissFlag;
window.takeActionOnFlag = takeActionOnFlag;

// ==========================================
// 10. ADMIN REGISTRATION (first-time setup)
// ==========================================

async function registerAdmin(userId) {
  if (!userId) throw new Error('User ID is required');
  var fb = await _ensureFirebase();
  // Check if admins collection has any entries
  var adminsCol = fb.firestore.collection(fb.db, 'admins');
  var existingSnap = await fb.firestore.getDocs(adminsCol);
  var existingCount = 0;
  existingSnap.forEach(function() { existingCount++; });

  if (existingCount > 0) {
    // Require existing admin authorization for subsequent additions
    var callerId = fb.auth.currentUser ? fb.auth.currentUser.uid : null;
    if (!callerId) throw new Error('You must be signed in to register an admin');
    var callerDoc = await fb.firestore.getDoc(fb.firestore.doc(fb.db, 'admins', callerId));
    if (!callerDoc.exists()) throw new Error('Only existing admins can add new admins');
  }

  // Add the user to admins collection
  await fb.firestore.setDoc(fb.firestore.doc(fb.db, 'admins', userId), {
    role: 'admin',
    addedAt: fb.firestore.serverTimestamp(),
    registeredBy: fb.auth.currentUser ? fb.auth.currentUser.uid : 'system'
  });

  // Update local cache
  if (window.refreshAdminList) await window.refreshAdminList();

  return { ok: true, userId: userId };
}

async function isFirestoreAdminConfigured() {
  try {
    var fb = await _ensureFirebase();
    var adminsCol = fb.firestore.collection(fb.db, 'admins');
    var snap = await fb.firestore.getDocs(fb.firestore.query(adminsCol, fb.firestore.limit(1)));
    return !snap.empty;
  } catch (e) { return false; }
}

window.registerAdmin = registerAdmin;
window.isFirestoreAdminConfigured = isFirestoreAdminConfigured;

// ==========================================
// 11. AUDIT LOGGING
// ==========================================

var _auditLogLocal = JSON.parse(localStorage.getItem('foromane_audit_log') || '[]');

async function auditLog(action, details) {
  var entry = {
    action: action,
    details: details || {},
    timestamp: Date.now(),
    userId: window.UserState ? window.UserState.id : null,
    userRole: window.UserState ? window.UserState.role : null
  };
  _auditLogLocal.push(entry);
  if (_auditLogLocal.length > 1000) _auditLogLocal = _auditLogLocal.slice(-500);
  localStorage.setItem('foromane_audit_log', JSON.stringify(_auditLogLocal));
  // Firestore write (best-effort)
  try {
    var fb = await _ensureFirebase();
    var auditCol = fb.firestore.collection(fb.db, 'audit_log');
    await fb.firestore.addDoc(auditCol, {
      action: action,
      details: typeof details === 'object' ? details : { message: String(details) },
      userId: window.UserState ? window.UserState.id : null,
      userRole: window.UserState ? window.UserState.role : null,
      createdAt: fb.firestore.serverTimestamp()
    });
  } catch (e) { /* Firestore audit write is best-effort */ }
  return entry;
}

async function getAuditLogs(filters) {
  var fb = await _ensureFirebase();
  var adminId = fb.auth.currentUser ? fb.auth.currentUser.uid : null;
  if (!adminId || !await isAdminUser(adminId)) throw new Error('Unauthorized');
  var auditCol = fb.firestore.collection(fb.db, 'audit_log');
  var constraints = [];
  if (filters && filters.action) constraints.push(fb.firestore.where('action', '==', filters.action));
  constraints.push(fb.firestore.orderBy('createdAt', 'desc'));
  if (filters && filters.limit) constraints.push(fb.firestore.limit(filters.limit));
  else constraints.push(fb.firestore.limit(200));
  var snap = await fb.firestore.getDocs(fb.firestore.query(auditCol, ...constraints));
  var results = [];
  snap.forEach(function(doc) { results.push(Object.assign({ id: doc.id }, doc.data())); });
  return results;
}

window.auditLog = auditLog;
window.getAuditLogs = getAuditLogs;

// ==========================================
// 12. ERROR MONITORING
// ==========================================

var _errorLog = JSON.parse(localStorage.getItem('foromane_error_log') || '[]');

function captureError(source, message, stack, context) {
  var entry = {
    source: source,
    message: String(message).slice(0, 500),
    stack: stack ? String(stack).slice(0, 2000) : '',
    context: context || {},
    timestamp: Date.now(),
    userId: window.UserState ? window.UserState.id : null,
    url: window.location ? window.location.href : ''
  };
  _errorLog.push(entry);
  if (_errorLog.length > 200) _errorLog = _errorLog.slice(-100);
  localStorage.setItem('foromane_error_log', JSON.stringify(_errorLog));
  // Also try Firestore
  (async function() {
    try {
      var fb = await _ensureFirebase();
      var errCol = fb.firestore.collection(fb.db, 'error_logs');
      await fb.firestore.addDoc(errCol, {
        source: source,
        message: String(message).slice(0, 500),
        stack: stack ? String(stack).slice(0, 2000) : '',
        context: context || {},
        userId: window.UserState ? window.UserState.id : null,
        url: window.location ? window.location.href : '',
        createdAt: fb.firestore.serverTimestamp()
      });
    } catch (e) { /* best-effort */ }
  })();
}

function getLocalErrorLog() {
  return JSON.parse(localStorage.getItem('foromane_error_log') || '[]');
}

function clearLocalErrorLog() {
  _errorLog = [];
  localStorage.removeItem('foromane_error_log');
}

// Install global error handlers (once)
if (typeof window._foromaneErrorHandlersInstalled === 'undefined') {
  window._foromaneErrorHandlersInstalled = true;
  window.addEventListener('error', function(e) {
    captureError('window.onerror', e.message || 'Script error', e.error ? e.error.stack : '', {
      lineno: e.lineno,
      colno: e.colno,
      filename: e.filename
    });
  });
  window.addEventListener('unhandledrejection', function(e) {
    captureError('unhandledrejection', e.reason ? e.reason.message || String(e.reason) : 'Promise rejected', e.reason ? e.reason.stack : '', {});
  });
}

window.captureError = captureError;
window.getLocalErrorLog = getLocalErrorLog;
window.clearLocalErrorLog = clearLocalErrorLog;

// ==========================================
// 13. USER FEEDBACK / BUG REPORT
// ==========================================

async function submitFeedback(category, message, contactInfo) {
  if (!message || message.trim().length < 3) throw new Error('Please provide a message (at least 3 characters)');
  var validCategories = ['bug', 'feature', 'feedback', 'other'];
  if (validCategories.indexOf(category) === -1) category = 'other';

  var entry = {
    category: category,
    message: message.trim(),
    contactInfo: contactInfo || '',
    status: 'pending',
    timestamp: Date.now(),
    userId: window.UserState ? window.UserState.id : null,
    userName: window.UserState ? window.UserState.name : null
  };

  // Store locally
  var localFeedback = JSON.parse(localStorage.getItem('foromane_feedback') || '[]');
  localFeedback.push(entry);
  if (localFeedback.length > 100) localFeedback = localFeedback.slice(-50);
  localStorage.setItem('foromane_feedback', JSON.stringify(localFeedback));

  // Store in Firestore (best-effort)
  try {
    var fb = await _ensureFirebase();
    var feedbackCol = fb.firestore.collection(fb.db, 'feedback');
    await fb.firestore.addDoc(feedbackCol, {
      category: category,
      message: message.trim(),
      contactInfo: contactInfo || '',
      status: 'pending',
      userId: window.UserState ? window.UserState.id : null,
      userName: window.UserState ? window.UserState.name : null,
      createdAt: fb.firestore.serverTimestamp()
    });
  } catch (e) { /* best-effort */ }

  return { ok: true };
}

async function getFeedback(filters) {
  var fb = await _ensureFirebase();
  var adminId = fb.auth.currentUser ? fb.auth.currentUser.uid : null;
  if (!adminId || !await isAdminUser(adminId)) throw new Error('Unauthorized');
  var feedbackCol = fb.firestore.collection(fb.db, 'feedback');
  var constraints = [];
  if (filters && filters.status && filters.status !== 'all') {
    constraints.push(fb.firestore.where('status', '==', filters.status));
  }
  constraints.push(fb.firestore.orderBy('createdAt', 'desc'));
  if (filters && filters.limit) constraints.push(fb.firestore.limit(filters.limit));
  else constraints.push(fb.firestore.limit(200));
  var snap = await fb.firestore.getDocs(fb.firestore.query(feedbackCol, ...constraints));
  var results = [];
  snap.forEach(function(doc) { results.push(Object.assign({ id: doc.id }, doc.data())); });
  return results;
}

async function reviewFeedback(feedbackId, status, note) {
  var fb = await _ensureFirebase();
  var adminId = fb.auth.currentUser ? fb.auth.currentUser.uid : null;
  if (!adminId || !await isAdminUser(adminId)) throw new Error('Unauthorized');
  var validStatuses = ['acknowledged', 'resolved', 'dismissed'];
  if (validStatuses.indexOf(status) === -1) throw new Error('Invalid status');
  var feedbackRef = fb.firestore.doc(fb.db, 'feedback', feedbackId);
  await fb.firestore.updateDoc(feedbackRef, {
    status: status,
    reviewNote: note || '',
    reviewedBy: adminId,
    reviewedAt: fb.firestore.serverTimestamp()
  });
  return { ok: true, feedbackId: feedbackId, status: status };
}

window.submitFeedback = submitFeedback;
window.getFeedback = getFeedback;
window.reviewFeedback = reviewFeedback;

// ==========================================
// 14. USER DATA EXPORT (GDPR-style)
// ==========================================

async function exportUserData() {
  var userId = window.UserState ? window.UserState.id : null;
  if (!userId || userId === 'guest') throw new Error('You must be logged in to export data');

  var data = {
    exportedAt: new Date().toISOString(),
    userId: userId,
    profile: null,
    credentials: [],
    business: null,
    promos: [],
    payments: [],
    artwork: [],
    feedback: []
  };

  // Collect from IndexedDB
  if (window.ForomaneDB && window.ForomaneDB.get) {
    try { data.profile = await window.ForomaneDB.get('profiles', userId); } catch (e) {}
    try {
      var allCreds = await window.ForomaneDB.getAll('credentials');
      data.credentials = allCreds.filter(function(c) { return c.profileId === userId; });
    } catch (e) {}
  }

  // Collect from UserState
  if (window.UserState) {
    data.profile = data.profile || {};
    data.profile.name = window.UserState.name;
    data.profile.firstName = window.UserState.firstName;
    data.profile.surname = window.UserState.surname;
    data.profile.role = window.UserState.role;
    data.profile.town = window.UserState.town;
    data.profile.email = window.UserState.username;
    data.profile.contacts = window.UserState.contacts;
    data.profile.interests = window.UserState.interests;
    data.profile.isVerified = window.UserState.isVerified;
    data.business = window.UserState.business;
  }

  // Collect from localStorage
  try {
    data.promos = JSON.parse(localStorage.getItem('foromane_promo_requests') || '[]').filter(function(p) { return p.userId === userId; });
    data.payments = JSON.parse(localStorage.getItem('foromane_payment_requests') || '[]').filter(function(p) { return p.userId === userId; });
    data.artwork = JSON.parse(localStorage.getItem('foromane_artwork_submissions') || '[]').filter(function(a) { return a.userId === userId; });
    data.feedback = JSON.parse(localStorage.getItem('foromane_feedback') || '[]').filter(function(f) { return f.userId === userId; });
  } catch (e) {}

  // Try to fetch from Firestore
  try {
    var fb = await _ensureFirebase();
    var profileDoc = await fb.firestore.getDoc(fb.firestore.doc(fb.db, 'profiles', userId));
    if (profileDoc.exists()) data.firestoreProfile = Object.assign({ id: profileDoc.id }, profileDoc.data());
  } catch (e) {}

  return data;
}

function downloadUserData() {
  exportUserData().then(function(data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'foromane-data-' + (data.userId || 'user') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
  }).catch(function(e) {
    showToast('Export failed: ' + e.message);
  });
}

window.exportUserData = exportUserData;
window.downloadUserData = downloadUserData;

// ==========================================
// 15. PUSH NOTIFICATIONS
// ==========================================

async function _requestNotifyPerm() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') {
    showToast('Notifications were blocked. Update your browser settings.');
    return false;
  }
  var p = await Notification.requestPermission();
  return p === 'granted';
}

function _showLocalNotify(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { body: body, icon: '/assets/icons/icon-192.png' }); } catch (e) {}
}

async function subscribeUserToPush() {
  var userId = window.UserState ? window.UserState.id : null;
  if (!userId || userId === 'guest') { showToast('Please log in to enable notifications'); return; }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    showToast('Push notifications not supported in this browser');
    return;
  }

  var granted = await _requestNotifyPerm();
  if (!granted) return;

  try {
    var registration = await navigator.serviceWorker.ready;
    var subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BMrms90KfmY9G3gvLf_q6xI57TL59K5FWoUEz8vJooxR_4Q2zzKvM9f2Qys1gxXm1n2JQ6_Nr7_Z0T1H5T3Gdx0'
    });

    // Save subscription to Firestore
    var fb = await _ensureFirebase();
    var subRef = fb.firestore.doc(fb.db, 'push_subscriptions', userId);
    await fb.firestore.setDoc(subRef, {
      userId: userId,
      subscription: subscription.toJSON(),
      userAgent: navigator.userAgent,
      enabledAt: fb.firestore.serverTimestamp(),
      lastSeen: fb.firestore.serverTimestamp()
    }, { merge: true });

    // Also save to localStorage as backup
    try {
      var subs = JSON.parse(localStorage.getItem('foromane_push_subscriptions') || '[]');
      subs = subs.filter(function(s) { return s.userId !== userId; });
      subs.push({
        userId: userId,
        subscription: subscription.toJSON(),
        enabledAt: new Date().toISOString()
      });
      localStorage.setItem('foromane_push_subscriptions', JSON.stringify(subs));
    } catch (e) {}

    showToast('Notifications enabled successfully');
    return subscription;
  } catch (e) {
    if (e.code === 20) {
      showToast('Notifications are blocked. Update your browser settings.');
    } else {
      console.warn('Push subscription error:', e);
      showToast('Failed to enable notifications: ' + e.message);
    }
  }
}

async function sendPushNotification(title, body, targetUserId) {
  // For development: show local notification
  _showLocalNotify(title, body);

  // In production, this would call a Firebase Cloud Function
  // For now, save to Firestore for the Cloud Function to pick up
  try {
    var fb = await _ensureFirebase();
    var payload = {
      title: title,
      body: body,
      targetUserId: targetUserId || null,
      createdAt: fb.firestore.serverTimestamp(),
      sent: false
    };
    await fb.firestore.addDoc(fb.firestore.collection(fb.db, 'push_notifications'), payload);
  } catch (e) {
    console.warn('Failed to log push notification:', e);
  }
}

window.subscribeUserToPush = subscribeUserToPush;
window.sendPushNotification = sendPushNotification;
