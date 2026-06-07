/* ════════════════════════════════════════════════════════
   FOROMANE AUTH - Authentication & account management
   ════════════════════════════════════════════════════════ */

var ADMIN_PASSWORD = localStorage.getItem('foromane_admin_password') || 'thecore7676';
// Wave 1.4: Hardcoded password is a dev fallback only.
// Production admin auth uses Firestore admins collection.

const Auth = {
  _loginAttemptTimestamps: [],
  _authFailureLog: { recent: [] },

  _logAuthFailure(method, context) {
    var entry = { method, context: context || '', ts: Date.now() };
    try {
      var stored = localStorage.getItem('foromane_auth_failures');
      var log = stored ? JSON.parse(stored) : { recent: [] };
      if (!Array.isArray(log.recent)) log.recent = [];
      log.recent.push(entry);
      var cutoff = Date.now() - 7 * 86400000;
      log.recent = log.recent.filter(function(e) { return e.ts > cutoff; });
      if (log.recent.length > 200) log.recent = log.recent.slice(-200);
      localStorage.setItem('foromane_auth_failures', JSON.stringify(log));
    } catch (e) { /* silently ignore logging errors */ }
  },

  _getAuthFailureTrends() {
    try {
      var stored = localStorage.getItem('foromane_auth_failures');
      if (!stored) return { total: 0, login: 0, register: 0, recent: [] };
      var log = JSON.parse(stored);
      var recent = Array.isArray(log.recent) ? log.recent : [];
      var cutoff = Date.now() - 24 * 60 * 60 * 1000;
      var last24h = recent.filter(function(e) { return e.ts > cutoff; });
      return {
        total: recent.length,
        login: recent.filter(function(e) { return e.method === 'login'; }).length,
        register: recent.filter(function(e) { return e.method === 'register'; }).length,
        last24h: last24h.length
      };
    } catch (e) { return { total: 0, login: 0, register: 0, recent: [] }; }
  },

  _pruneLoginAttempts() {
    const now = Date.now();
    this._loginAttemptTimestamps = this._loginAttemptTimestamps.filter(t => now - t < 120000);
  },

  _isLoginLocked() {
    this._pruneLoginAttempts();
    if (this._loginAttemptTimestamps.length < 5) return false;
    const oldest = this._loginAttemptTimestamps[0];
    const remaining = Math.ceil((oldest + 120000 - Date.now()) / 1000);
    if (remaining > 0) return remaining;
    this._loginAttemptTimestamps = [];
    return false;
  },

  _recordLoginAttempt() {
    this._loginAttemptTimestamps.push(Date.now());
  },

  _normalizeCredential(value) {
    if (!value || typeof value !== 'string') return '';
    var normalized = value.trim().toLowerCase();
    if (normalized.includes('@')) return normalized;
    return normalized.replace(/[\s\-\(\)\+]/g, '');
  },
  _clearLoginForm() {
    var u = document.getElementById('login-username');
    var w = document.getElementById('login-whatsapp');
    var p = document.getElementById('login-password');
    var e = document.getElementById('login-error');
    if (u) u.value = '';
    if (w) w.value = '';
    if (p) p.value = '';
    if (e) e.style.display = 'none';
  },
  isGuest() {
    return UserState.id === 'guest';
  },

  isAdmin() {
    return UserState.role === 'Administrator';
  },

  isRealUser() {
    return UserState.id !== 'guest' && UserState.role !== 'Administrator';
  },

  async loginAsGuest() {
    try {
      const account = window.DEMO_ACCOUNTS.find(a => a.id === 'guest');
      if (!account) return;
      UserState.set(account.id, account.name, account.role, '', account.town, '');
      localStorage.setItem('foromane_userId', account.id);
      UserState.business = null;
      UserState.kpi = { ads: 0, views: 0, likes: 0, noteAdds: 0 };
      UserState.interests = [];
      enterApp();
      renderPromos();
      updateAccountHero();
      resetBusinessCard();
      updateKPI();
      updateAccountUI();
      reloadNotesForUser();
    } catch(e) { console.error('loginAsGuest failed:', e); }
  },

  async loginWithCredential() {
    var locked = this._isLoginLocked();
    if (locked) {
      var lockedErrorEl = document.getElementById('login-error');
      lockedErrorEl.textContent = 'Too many attempts. Try again in ' + locked + 's.';
      lockedErrorEl.style.display = 'block';
      var pw = document.getElementById('login-password');
      if (pw) pw.value = '';
      return;
    }

    const credential = document.getElementById('login-username').value.trim();
    const whatsapp = document.getElementById('login-whatsapp').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';

    if (!credential || !password) {
      errorEl.textContent = 'Please enter your username and password.';
      return;
    }

    if (typeof window.invokeServerRateLimit === 'function') {
      try {
        var rateLimitResult = await window.invokeServerRateLimit('login', { credential: credential });
        if (rateLimitResult?.blocked) {
          errorEl.textContent = rateLimitResult.reason || 'Too many login attempts. Try again later.';
          errorEl.style.display = 'block';
          return;
        }
      } catch (rateLimitError) {
        console.warn('Login rate limiter unavailable:', rateLimitError);
      }
    }

    try {
      var profile = null;
      if (typeof window.loginWithFirebaseCredential === 'function') {
        try {
          profile = await window.loginWithFirebaseCredential(credential, password);
        } catch (firebaseError) {
          if (firebaseError && firebaseError.code === 'auth/network-request-failed') {
            console.warn('Firebase login network issue, falling back to local login.', firebaseError);
          } else if (firebaseError && firebaseError.message && firebaseError.message.toLowerCase().includes('firebase unavailable')) {
            console.warn('Firebase unavailable, falling back to local login.', firebaseError);
          } else {
            this._recordLoginAttempt();
            this._logAuthFailure('login', 'firebase_auth_failed: ' + (firebaseError?.message || 'unknown'));
            errorEl.textContent = 'Invalid login details.';
            errorEl.style.display = 'block';
            var pwx = document.getElementById('login-password');
            if (pwx) pwx.value = '';
            return;
          }
        }
      }

      if (profile) {
        this._loginAttemptTimestamps = [];
        await this.switchToProfile(profile);
        return;
      }

      if (!ForomaneDB.db) {
        errorEl.textContent = 'Database unavailable. Try again.';
        errorEl.style.display = 'block';
        return;
      }

      const normalizedCredential = this._normalizeCredential(credential);
      const credentialIsWhatsApp = /^[\d]+$/.test(normalizedCredential);
      if (!credentialIsWhatsApp && !whatsapp) {
        errorEl.textContent = 'Please provide your WhatsApp number when logging in with a username.';
        errorEl.style.display = 'block';
        return;
      }

      const allCreds = await ForomaneDB.getAll('credentials');
      const credentialEntry = allCreds.find(function(c) {
        if (!c.credential) return false;
        return this._normalizeCredential(c.credential) === normalizedCredential;
      }.bind(this));
      if (!credentialEntry) {
        this._recordLoginAttempt();
        this._logAuthFailure('login', 'local_credential_not_found');
        errorEl.textContent = 'Invalid login details.';
        errorEl.style.display = 'block';
        var pw1 = document.getElementById('login-password');
        if (pw1) pw1.value = '';
        return;
      }

      const profileEntry = await ForomaneDB.get('profiles', credentialEntry.profileId);
      if (!profileEntry) {
        this._recordLoginAttempt();
        this._logAuthFailure('login', 'local_profile_not_found');
        errorEl.textContent = 'Invalid login details.';
        errorEl.style.display = 'block';
        var pw2 = document.getElementById('login-password');
        if (pw2) pw2.value = '';
        return;
      }

      const normalizedWhatsapp = this._normalizeCredential(whatsapp);
      const hasWhatsapp = (profileEntry.contacts?.whatsapps || []).some(function(wa) {
        var stored = this._normalizeCredential((wa.countryCode || '') + (wa.number || ''));
        return stored === normalizedWhatsapp;
      }.bind(this));
      if (!hasWhatsapp && !credentialIsWhatsApp) {
        this._recordLoginAttempt();
        this._logAuthFailure('login', 'whatsapp_mismatch');
        errorEl.textContent = 'Invalid login details.';
        errorEl.style.display = 'block';
        var pw3 = document.getElementById('login-password');
        if (pw3) pw3.value = '';
        return;
      }

      if (profileEntry.password !== password) {
        this._recordLoginAttempt();
        this._logAuthFailure('login', 'wrong_password');
        errorEl.textContent = 'Invalid login details.';
        errorEl.style.display = 'block';
        var pw4 = document.getElementById('login-password');
        if (pw4) pw4.value = '';
        return;
      }

      this._loginAttemptTimestamps = [];
      await this.switchToProfile(profileEntry);
    } catch (e) {
      console.error('Login error:', e);
      this._recordLoginAttempt();
      errorEl.textContent = 'Login failed. Please try again.';
      errorEl.style.display = 'block';
      var pw5 = document.getElementById('login-password');
      if (pw5) pw5.value = '';
    }
  },

  showForgotPassword() {
    document.getElementById('login-form-fields').style.display = 'none';
    document.getElementById('forgot-password-section').style.display = 'block';
    var err = document.getElementById('login-error');
    if (err) err.style.display = 'none';
  },

  hideForgotPassword() {
    document.getElementById('forgot-password-section').style.display = 'none';
    document.getElementById('login-form-fields').style.display = 'block';
    var fr = document.getElementById('forgot-result');
    if (fr) fr.style.display = 'none';
    var inp = document.getElementById('forgot-email');
    if (inp) inp.value = '';
  },

  async retrievePassword() {
    var email = document.getElementById('forgot-email').value.trim();
    var resultEl = document.getElementById('forgot-result');
    resultEl.style.display = 'none';

    if (!email) {
      resultEl.textContent = 'Please enter your email.';
      resultEl.style.display = 'block';
      return;
    }

    try {
      if (typeof window.sendPasswordResetEmail === 'function') {
        await window.sendPasswordResetEmail(email);
        resultEl.style.color = '#1a8a1a';
        resultEl.innerHTML = 'If that email is registered, a password reset link has been sent. Check your inbox.';
        resultEl.style.display = 'block';
        return;
      }

      if (!ForomaneDB.db) {
        resultEl.textContent = 'Database unavailable. Try again.';
        resultEl.style.display = 'block';
        return;
      }

      var allCreds = await ForomaneDB.getAll('credentials');
      var emailEntry = allCreds.find(function(c) { return c.credential === email; });
      if (!emailEntry) {
        resultEl.innerHTML = 'No account found with that email. If you need help, contact us on WhatsApp <a href="https://wa.me/26771829765" target="_blank" style="color:var(--orange);font-weight:600;">+267 71829765</a>.';
        resultEl.style.display = 'block';
        return;
      }

      var profile = await ForomaneDB.get('profiles', emailEntry.profileId);
      if (!profile) {
        resultEl.innerHTML = 'Account data not found. Contact us on WhatsApp <a href="https://wa.me/26771829765" target="_blank" style="color:var(--orange);font-weight:600;">+267 71829765</a>.';
        resultEl.style.display = 'block';
        return;
      }

      resultEl.style.color = '#1a8a1a';
      resultEl.innerHTML = 'Your password is: <strong>' + profile.password + '</strong>. Please change it after logging in.';
      resultEl.style.display = 'block';
    } catch (e) {
      console.error('Retrieve password error:', e);
      resultEl.textContent = 'Failed to send reset link. Try again or contact us on WhatsApp +267 71829765.';
      resultEl.style.display = 'block';
    }
  },

  async register() {
    const firstName = document.getElementById('id-firstname').value.trim();
    const surname = document.getElementById('id-surname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const town = document.getElementById('loc-town').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    const errorEl = document.getElementById('register-error');
    errorEl.style.display = 'none';

    if (!firstName || !surname) {
      errorEl.textContent = 'Please enter your first name and surname.';
      errorEl.style.display = 'block'; return;
    }
    var dob = document.getElementById('id-dob').value;
    if (dob) {
      var age = new Date().getFullYear() - new Date(dob).getFullYear();
      var monthDiff = new Date().getMonth() - new Date(dob).getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < new Date(dob).getDate())) age--;
      if (age < 12) {
        errorEl.textContent = 'You must be at least 12 years old to create a profile.';
        errorEl.style.display = 'block'; return;
      }
    }
    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters.';
      errorEl.style.display = 'block'; return;
    }
    if (password !== confirm) {
      errorEl.textContent = 'Passwords do not match.';
      errorEl.style.display = 'block'; return;
    }

    const photoPreview = document.getElementById('reg-photo-preview');
    const photo = photoPreview && photoPreview.src ? photoPreview.src : '';

    try {
      if (!ForomaneDB.db) {
        errorEl.textContent = 'Database unavailable. Try again.';
        errorEl.style.display = 'block';
        return;
      }

      const primaryMobileEntry = UserState.contacts.mobiles.find(function(m) { return m.isPrimary; }) || UserState.contacts.mobiles[0];
      const primaryMobile = primaryMobileEntry && primaryMobileEntry.countryCode && primaryMobileEntry.number ? primaryMobileEntry.countryCode + primaryMobileEntry.number : '';
      const whatsapps = UserState.contacts.whatsapps || [];
      const primaryWhatsAppEntry = whatsapps.find(function(w) { return w.isPrimary; }) || whatsapps[0];
      const primaryWhatsApp = primaryWhatsAppEntry && primaryWhatsAppEntry.countryCode && primaryWhatsAppEntry.number ? primaryWhatsAppEntry.countryCode + primaryWhatsAppEntry.number : '';

      if (typeof window.invokeServerRateLimit === 'function') {
        try {
          var rateLimitResult = await window.invokeServerRateLimit('register', {
            email: email,
            username: UserState.username || '',
            mobile: primaryMobile,
            whatsapp: primaryWhatsApp
          });
          if (rateLimitResult?.blocked) {
            errorEl.textContent = rateLimitResult.reason || 'Too many registration attempts. Try again later.';
            errorEl.style.display = 'block';
            return;
          }
        } catch (rateLimitError) {
          console.warn('Registration rate limiter unavailable:', rateLimitError);
        }
      }

      if (!primaryWhatsApp) {
        errorEl.textContent = 'Please add your WhatsApp number. This is required to sign in.';
        errorEl.style.display = 'block';
        return;
      }

      async function credentialExists(value) {
        const normalizedValue = this._normalizeCredential(value);
        if (!normalizedValue) return false;
        const allCreds = await ForomaneDB.getAll('credentials');
        return Array.isArray(allCreds) && allCreds.some(function(c) {
          return this._normalizeCredential(c.credential) === normalizedValue;
        }.bind(this));
      }

      if (email && await credentialExists.call(this, email)) {
        errorEl.textContent = 'An account with that email already exists. Please sign in or use another email.';
        errorEl.style.display = 'block';
        return;
      }
      if (primaryMobile && await credentialExists.call(this, primaryMobile)) {
        errorEl.textContent = 'That mobile number is already registered. Please sign in or use a different number.';
        errorEl.style.display = 'block';
        return;
      }
      if (primaryWhatsApp && await credentialExists.call(this, primaryWhatsApp)) {
        errorEl.textContent = 'That WhatsApp number is already registered. Please sign in or use a different number.';
        errorEl.style.display = 'block';
        return;
      }
      const username = UserState.username || '';
      if (username && await credentialExists.call(this, username)) {
        errorEl.textContent = 'That username is already taken. Please choose a different username.';
        errorEl.style.display = 'block';
        return;
      }

      var remoteProfile = null;
      if (typeof window.findCredentialRecord === 'function') {
        try {
          if (email && await window.findCredentialRecord(email)) {
            errorEl.textContent = 'An account with that email already exists. Please sign in or use another email.';
            errorEl.style.display = 'block';
            return;
          }
          if (username && await window.findCredentialRecord(username)) {
            errorEl.textContent = 'That username is already taken. Please choose a different username.';
            errorEl.style.display = 'block';
            return;
          }
          if (primaryMobile && await window.findCredentialRecord(primaryMobile)) {
            errorEl.textContent = 'That mobile number is already registered. Please sign in or use a different number.';
            errorEl.style.display = 'block';
            return;
          }
          if (primaryWhatsApp && await window.findCredentialRecord(primaryWhatsApp)) {
            errorEl.textContent = 'That WhatsApp number is already registered. Please sign in or use a different number.';
            errorEl.style.display = 'block';
            return;
          }
        } catch (remoteCheckError) {
          console.warn('Unable to validate remote credentials; continuing with local validation.', remoteCheckError);
        }
      }

      const id = 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const name = firstName + ' ' + surname;
      const initials = (firstName[0] + surname[0]).toUpperCase();
      const color = window.APP_COLORS[initials.charCodeAt(0) % window.APP_COLORS.length];
      const role = 'General User';

      const profile = {
        id, firstName, surname, name, role, town, email, password, initials, color, photo,
        username: UserState.username || localStorage.getItem('foromane_username') || '',
        dateOfBirth: UserState.dateOfBirth || localStorage.getItem('foromane_dob') || '',
        gender: UserState.gender || localStorage.getItem('foromane_gender') || '',
        nationality: UserState.nationality || localStorage.getItem('foromane_nationality') || '',
        race: UserState.race || localStorage.getItem('foromane_race') || '',
        contacts: UserState.contacts || JSON.parse(localStorage.getItem('foromane_contacts') || '{"mobiles":[],"whatsapps":[],"social":{}}'),
        location: UserState.location || JSON.parse(localStorage.getItem('foromane_location') || '{"town":"","area":""}'),
        interests: UserState.interests || JSON.parse(localStorage.getItem('foromane_interests') || '[]'),
        verified: !!primaryWhatsApp,
        verificationStatus: primaryWhatsApp ? 'verified' : 'pending'
      };

      if (typeof window.createFirebaseUserProfile === 'function') {
        try {
          remoteProfile = await window.createFirebaseUserProfile(Object.assign({}, profile, {
            primaryMobile: primaryMobile,
            primaryWhatsApp: primaryWhatsApp,
            whatsapps: whatsapps
          }));
        } catch (remoteError) {
          if (remoteError && remoteError.code && remoteError.code !== 'auth/network-request-failed' && remoteError.code !== 'auth/operation-not-allowed') {
            throw remoteError;
          }
          if (remoteError && remoteError.message && remoteError.message.toLowerCase().includes('network')) {
            console.warn('Firebase network unavailable. Saving profile locally for offline use.', remoteError.message || remoteError);
            remoteProfile = null;
          } else {
            console.warn('Firebase registration failed, falling back to local storage:', remoteError.message || remoteError);
            remoteProfile = null;
          }
        }
      }

      var localProfile = profile;
      if (remoteProfile) {
        localProfile = Object.assign({}, remoteProfile, { password: password });
      } else {
        localProfile.pendingSync = true;
        localProfile.localOnly = true;
        localProfile.syncStatus = 'pending';
      }

      await ForomaneDB.put('profiles', localProfile);
      try {
        if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
          await window.SyncQueue.enqueue('profiles', localProfile, { clientId: localProfile.id });
          if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
        }
      } catch(e) { console.warn('Failed to enqueue profile for sync:', e); }

      var pendingSyncMetadata = !remoteProfile ? { pendingSync: true, localOnly: true, syncStatus: 'pending' } : {};

      if (email) {
        const normalizedEmail = this._normalizeCredential(email);
        const cred = Object.assign({ id: 'cred_email_' + normalizedEmail, credential: normalizedEmail, profileId: localProfile.id }, pendingSyncMetadata);
        await ForomaneDB.put('credentials', cred);
        try { if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') { await window.SyncQueue.enqueue('credentials', cred, { clientId: localProfile.id }); if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{}); } } catch(e) { console.warn('Failed to enqueue credential (email) for sync:', e); }
      }
      if (primaryMobileEntry && primaryMobileEntry.countryCode && primaryMobileEntry.number) {
        var phone = this._normalizeCredential(primaryMobileEntry.countryCode + primaryMobileEntry.number);
        const cred2 = Object.assign({ id: 'cred_phone_' + phone, credential: phone, profileId: localProfile.id }, pendingSyncMetadata);
        await ForomaneDB.put('credentials', cred2);
        try { if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') { await window.SyncQueue.enqueue('credentials', cred2, { clientId: localProfile.id }); if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{}); } } catch(e) { console.warn('Failed to enqueue credential (phone) for sync:', e); }
      }

      if (localProfile.username) {
        const normalizedUsername = this._normalizeCredential(localProfile.username);
        const cred3 = Object.assign({ id: 'cred_username_' + normalizedUsername, credential: normalizedUsername, profileId: localProfile.id }, pendingSyncMetadata);
        await ForomaneDB.put('credentials', cred3);
        try { if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') { await window.SyncQueue.enqueue('credentials', cred3, { clientId: localProfile.id }); if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{}); } } catch(e) { console.warn('Failed to enqueue credential (username) for sync:', e); }
      }

      for (var wi = 0; wi < whatsapps.length; wi++) {
        var wa = whatsapps[wi];
        if (wa.countryCode && wa.number) {
          var fullWa = this._normalizeCredential(wa.countryCode + wa.number);
          const cred4 = Object.assign({ id: 'cred_whatsapp_' + fullWa, credential: fullWa, profileId: localProfile.id }, pendingSyncMetadata);
          await ForomaneDB.put('credentials', cred4);
          try { if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') { await window.SyncQueue.enqueue('credentials', cred4, { clientId: localProfile.id }); if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{}); } } catch(e) { console.warn('Failed to enqueue credential (whatsapp) for sync:', e); }
        }
      }

      goTo('view-account');
      await this.switchToProfile(localProfile);

      try {
        if (window.DriveAPI && typeof window.DriveAPI.isSignedIn === 'function' && window.DriveAPI.isSignedIn()) {
          window.DriveAPI.ensureUserFolder(localProfile.id).catch(function(e) {
            console.warn('Failed to create Drive user folder:', e);
          });
        }
      } catch(e) { console.warn('Drive folder creation error:', e); }

      showToast('Profile created! Welcome to Foromane!');
    } catch (e) {
      console.error('Registration error:', e);
      this._logAuthFailure('register', e?.code || e?.name || e?.message || 'unknown');
      if (e && e.code === 'auth/email-already-in-use') {
        errorEl.textContent = 'An account with that email already exists. Please sign in or use another email.';
      } else if (e && e.code === 'auth/invalid-email') {
        errorEl.textContent = 'Please enter a valid email address.';
      } else if (e && e.name === 'ConstraintError') {
        errorEl.textContent = 'Registration failed: email or phone / WhatsApp number appears to be already registered.';
      } else {
        errorEl.textContent = 'Registration failed. Please try again.';
      }
      errorEl.style.display = 'block';
    }
  },

  async switchToProfile(profile) {
    try {
      if (profile.status === 'suspended' || profile.status === 'banned') {
        showToast('Account ' + profile.status + '. Contact support for assistance.');
        return;
      }
      UserState.status = profile.status || 'active';
      localStorage.setItem('foromane_status', UserState.status);
      UserState.set(profile.id, profile.name, profile.role, '', profile.town, profile.phone || '');
      UserState.firstName = profile.firstName || '';
      UserState.surname = profile.surname || '';
      UserState.username = profile.username || '';
      UserState.dateOfBirth = profile.dateOfBirth || '';
      UserState.gender = profile.gender || '';
      UserState.nationality = profile.nationality || '';
      UserState.race = profile.race || '';
      UserState.contacts = profile.contacts || { mobiles:[], whatsapps:[], social:{} };
      UserState.location = profile.location || { town: profile.town || '', area: '' };
      UserState.interests = profile.interests || [];
      UserState.setVerified(!!profile.verified);
      localStorage.setItem('foromane_userId', profile.id);
      if (profile.photo) localStorage.setItem('foromane_photo', profile.photo);
      localStorage.setItem('foromane_username', UserState.username);
      localStorage.setItem('foromane_dob', UserState.dateOfBirth);
      localStorage.setItem('foromane_gender', UserState.gender);
      localStorage.setItem('foromane_nationality', UserState.nationality);
      localStorage.setItem('foromane_race', UserState.race);
      UserState._persistContacts();
      UserState._persistLocation();
      UserState._persistInterests();
      UserState.pendingSync = !!profile.pendingSync;
      UserState.localOnly = !!profile.localOnly;
      UserState.syncStatus = profile.syncStatus || '';
      UserState.syncError = profile.syncError || '';
      UserState.conflictType = profile.conflictType || '';
      UserState.conflictValue = profile.conflictValue || '';
      UserState.conflictExistingProfileId = profile.conflictExistingProfileId || '';

      UserState.kpi = { ads: 0, views: 0, likes: 0, noteAdds: 0 };
      UserState.business = null;

      if (typeof window.fetchUserBusiness === 'function') {
        try {
          var businessProfile = await window.fetchUserBusiness(profile.id);
          if (businessProfile) {
            UserState.business = businessProfile;
          }
        } catch (e) {
          console.warn('Failed to load user business profile:', e);
        }
      }

      try {
        if (window.DriveAPI && typeof window.DriveAPI.isSignedIn === 'function' && window.DriveAPI.isSignedIn()) {
          window.DriveAPI.ensureUserFolder(profile.id).catch(function(e) {
            console.warn('Failed to ensure Drive user folder:', e);
          });
        }
      } catch(e) { console.warn('Drive folder error:', e); }

      enterApp();
      renderPromos();
      updateAccountHero();
      resetBusinessCard();
      updateKPI();
      updateAccountUI();
      reloadNotesForUser();
    } catch(e) { console.error('switchToProfile failed:', e); }
  },

  async adminLogin() {
    const password = document.getElementById('admin-password-input').value.trim();
    const errorEl = document.getElementById('admin-pw-error');
    errorEl.style.display = 'none';

    // 1. Check Firestore admin list (production path)
    var isFirebaseAdmin = false;
    var firebaseUid = null;
    if (typeof window.refreshAdminList === 'function') {
      try {
        var admins = await window.refreshAdminList();
        var fb = window._ensureFirebase ? await window._ensureFirebase() : null;
        if (fb && fb.auth && fb.auth.currentUser) {
          firebaseUid = fb.auth.currentUser.uid;
          if (admins.indexOf(firebaseUid) !== -1) {
            isFirebaseAdmin = true;
          }
        } else if (admins.length > 0 && admins.indexOf(password) !== -1) {
          // Offline: allow admin login using user ID as password when admin list is cached
          isFirebaseAdmin = true;
          firebaseUid = password;
        }
      } catch (e) { console.warn('Firestore admin check failed:', e); }
    }

    // 2. Fallback: hardcoded dev password
    if (!isFirebaseAdmin && password !== ADMIN_PASSWORD) {
      errorEl.textContent = 'Incorrect password.';
      errorEl.style.display = 'block';
      return;
    }

    closeModal('admin-pw-modal');

    // 3. Persist admin ID for the session
    var adminUserId = firebaseUid || 'admin';
    var adminName = 'Admin';
    if (firebaseUid && window.UserState && window.UserState.id !== 'guest') {
      adminName = window.UserState.name || 'Admin';
    }

    UserState.set(adminUserId, adminName, 'Administrator', '', 'Gaborone', '');
    localStorage.setItem('foromane_userId', adminUserId);
    UserState.status = 'active';
    localStorage.setItem('foromane_status', 'active');
    UserState.business = null;
    UserState.kpi = { ads: 0, views: 0, likes: 0, noteAdds: 0 };
    UserState.interests = [];
    enterApp();
    renderPromos();
    updateAccountHero();
    resetBusinessCard();
    updateKPI();
    updateAccountUI();
    showToast('Welcome Admin');
  },

  async logout() {
    try {
      if (typeof window.signOutFirebase === 'function') {
        await window.signOutFirebase();
      }
    } catch (e) {
      console.warn('Firebase sign-out failed:', e);
    }
    UserState.clear();
    location.reload();
  }

};

window.Auth = Auth;
window.ADMIN_PASSWORD = ADMIN_PASSWORD;
