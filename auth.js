/* ════════════════════════════════════════════════════════
   FOROMANE AUTH - Authentication & account management
   ════════════════════════════════════════════════════════ */

const ADMIN_PASSWORD = 'kudigotbliss1987';

const Auth = {
  _loginAttemptTimestamps: [],

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
  },

  async loginWithCredential() {
    var locked = this._isLoginLocked();
    if (locked) {
      var errorEl = document.getElementById('login-error');
      errorEl.textContent = 'Too many attempts. Try again in ' + locked + 's.';
      errorEl.style.display = 'block';
      var pw = document.getElementById('login-password');
      if (pw) pw.value = '';
      return;
    }

    const username = document.getElementById('login-username').value.trim();
    const whatsapp = document.getElementById('login-whatsapp').value.trim();
    const password = document.getElementById('login-password').value.trim();
    errorEl = document.getElementById('login-error');
    errorEl.style.display = 'none';

    if (!username || !whatsapp || !password) {
      errorEl.textContent = 'Please enter your username, WhatsApp number and password.';
      errorEl.style.display = 'block';
      return;
    }

    try {
      if (!ForomaneDB.db) {
        errorEl.textContent = 'Database unavailable. Try again.';
        errorEl.style.display = 'block';
        return;
      }

      const allCreds = await ForomaneDB.getAll('credentials');
      const usernameEntry = allCreds.find(c => c.credential === username);
      if (!usernameEntry) {
        this._recordLoginAttempt();
        errorEl.textContent = 'Invalid login details.';
        errorEl.style.display = 'block';
        var pw = document.getElementById('login-password');
        if (pw) pw.value = '';
        return;
      }

      const profile = await ForomaneDB.get('profiles', usernameEntry.profileId);
      if (!profile) {
        this._recordLoginAttempt();
        errorEl.textContent = 'Invalid login details.';
        errorEl.style.display = 'block';
        var pw2 = document.getElementById('login-password');
        if (pw2) pw2.value = '';
        return;
      }

      const normalizedWhatsapp = whatsapp.replace(/[\s\-\(\)]/g, '');
      const hasWhatsapp = (profile.contacts?.whatsapps || []).some(function(wa) {
        return (wa.countryCode + wa.number) === normalizedWhatsapp;
      });
      if (!hasWhatsapp) {
        this._recordLoginAttempt();
        errorEl.textContent = 'Invalid login details.';
        errorEl.style.display = 'block';
        var pw3 = document.getElementById('login-password');
        if (pw3) pw3.value = '';
        return;
      }

      if (profile.password !== password) {
        this._recordLoginAttempt();
        errorEl.textContent = 'Invalid login details.';
        errorEl.style.display = 'block';
        var pw4 = document.getElementById('login-password');
        if (pw4) pw4.value = '';
        return;
      }

      this._loginAttemptTimestamps = [];
      this.switchToProfile(profile);
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
      resultEl.textContent = 'Failed to retrieve password. Try again or contact us on WhatsApp +267 71829765.';
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
        interests: UserState.interests || JSON.parse(localStorage.getItem('foromane_interests') || '[]')
      };

      await ForomaneDB.put('profiles', profile);
      try {
        if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') {
          await window.SyncQueue.enqueue('profiles', profile, { clientId: id });
          if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{});
        }
      } catch(e) { console.warn('Failed to enqueue profile for sync:', e); }

      if (email) {
        const cred = { id: 'cred_email_' + email, credential: email, profileId: id };
        await ForomaneDB.put('credentials', cred);
        try { if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') { await window.SyncQueue.enqueue('credentials', cred, { clientId: id }); if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{}); } } catch(e) { console.warn('Failed to enqueue credential (email) for sync:', e); }
      }
      var primaryMobileEntry = UserState.contacts.mobiles.find(function(m) { return m.isPrimary; }) || UserState.contacts.mobiles[0];
      if (primaryMobileEntry && primaryMobileEntry.countryCode && primaryMobileEntry.number) {
        var phone = primaryMobileEntry.countryCode + primaryMobileEntry.number;
        const cred2 = { id: 'cred_phone_' + phone, credential: phone, profileId: id };
        await ForomaneDB.put('credentials', cred2);
        try { if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') { await window.SyncQueue.enqueue('credentials', cred2, { clientId: id }); if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{}); } } catch(e) { console.warn('Failed to enqueue credential (phone) for sync:', e); }
      }

      if (profile.username) {
        const cred3 = { id: 'cred_username_' + profile.username, credential: profile.username, profileId: id };
        await ForomaneDB.put('credentials', cred3);
        try { if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') { await window.SyncQueue.enqueue('credentials', cred3, { clientId: id }); if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{}); } } catch(e) { console.warn('Failed to enqueue credential (username) for sync:', e); }
      }

      var whatsapps = UserState.contacts.whatsapps || [];
      for (var wi = 0; wi < whatsapps.length; wi++) {
        var wa = whatsapps[wi];
        if (wa.countryCode && wa.number) {
          var fullWa = wa.countryCode + wa.number;
          const cred4 = { id: 'cred_whatsapp_' + fullWa, credential: fullWa, profileId: id };
          await ForomaneDB.put('credentials', cred4);
          try { if (window.SyncQueue && typeof window.SyncQueue.enqueue === 'function') { await window.SyncQueue.enqueue('credentials', cred4, { clientId: id }); if (window.requestBackgroundSync) window.requestBackgroundSync().catch(()=>{}); } } catch(e) { console.warn('Failed to enqueue credential (whatsapp) for sync:', e); }
        }
      }

      goTo('view-account');
      this.switchToProfile(profile);

      try {
        if (window.DriveAPI && typeof window.DriveAPI.isSignedIn === 'function' && window.DriveAPI.isSignedIn()) {
          window.DriveAPI.ensureUserFolder(profile.id).catch(function(e) {
            console.warn('Failed to create Drive user folder:', e);
          });
        }
      } catch(e) { console.warn('Drive folder creation error:', e); }

      showToast('Profile created! Welcome to Foromane!');
    } catch (e) {
      console.error('Registration error:', e);
      errorEl.textContent = 'Registration failed. Please try again.';
      errorEl.style.display = 'block';
    }
  },

  switchToProfile(profile) {
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

    UserState.kpi = { ads: 0, views: 0, likes: 0, noteAdds: 0 };
    UserState.business = null;

    // If Drive is signed in, ensure Drive folders exist
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
  },

  adminLogin() {
    const password = document.getElementById('admin-password-input').value.trim();
    const errorEl = document.getElementById('admin-pw-error');
    errorEl.style.display = 'none';

    if (password !== ADMIN_PASSWORD) {
      errorEl.textContent = 'Incorrect password.';
      errorEl.style.display = 'block';
      return;
    }

    closeModal('admin-pw-modal');
    const name = 'Admin';
    UserState.set('admin', name, 'Administrator', '', 'Gaborone', '');
    localStorage.setItem('foromane_userId', 'admin');
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

  logout() {
    UserState.clear();
    location.reload();
  }

};

window.Auth = Auth;
window.ADMIN_PASSWORD = ADMIN_PASSWORD;
