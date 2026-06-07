/* ════════════════════════════════════════════════════════
   FOROMANE APP - Core initialization & boot sequence
   ════════════════════════════════════════════════════════ */

/* ─── Legacy data migration (wirog_/formane_ → foromane_) ─── */

function migrateLegacyLocalStorage() {
  const prefixes = ['wirog_', 'formane_'];
  const newPrefix = 'foromane_';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    for (const legacyPrefix of prefixes) {
      if (key.startsWith(legacyPrefix)) {
        const newKey = newPrefix + key.slice(legacyPrefix.length);
        if (!localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, localStorage.getItem(key));
        }
        localStorage.removeItem(key);
        i--;
        break;
      }
    }
  }
}

async function migrateLegacyIndexedDB() {
  const dbMap = {
    'wirog-supply-solutions': { name: 'foromane-supply-solutions', version: 3 },
    'formane-supply-solutions': { name: 'foromane-supply-solutions', version: 3 },
    'wirog-sync': { name: 'foromane-sync', version: 1 },
    'formane-sync': { name: 'foromane-sync', version: 1 },
    'wirog-admin-queue': { name: 'foromane-admin-queue', version: 1 },
    'formane-admin-queue': { name: 'foromane-admin-queue', version: 1 }
  };
  for (const [oldName, info] of Object.entries(dbMap)) {
    try {
      const exists = await new Promise(resolve => {
        const req = indexedDB.open(oldName);
        req.onsuccess = () => { resolve(true); req.result.close(); };
        req.onerror = () => resolve(false);
        req.onupgradeneeded = () => { resolve(false); req.transaction.abort(); };
      });
      if (!exists) continue;

      const openReq = indexedDB.open(oldName);
      const oldData = {};
      openReq.onsuccess = () => {
        const db = openReq.result;
        const storeNames = Array.from(db.objectStoreNames);
        let pending = storeNames.length;
        if (pending === 0) { db.close(); return; }
        storeNames.forEach(s => {
          const tx = db.transaction(s, 'readonly');
          const store = tx.objectStore(s);
          const all = store.getAll();
          all.onsuccess = () => {
            oldData[s] = all.result || [];
            if (--pending === 0) {
              db.close();
              importOldData(oldData);
            }
          };
        });
      };
    } catch(e) {
      console.warn('Skipping legacy DB migration for ' + oldName + ':', e);
    }
  }
}

async function importOldData(data) {
  const DB_NAME = 'foromane-supply-solutions';
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 3);
    req.onupgradeneeded = () => {
      const stores = ['credentials','profiles','promos','items','notes','kpi','notifications','categories','orders','syncQueue'];
      stores.forEach(s => { if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s, { keyPath: 'id' }); });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  for (const [store, records] of Object.entries(data)) {
    if (!db.objectStoreNames.contains(store)) continue;
    for (const record of records) {
      try { db.transaction(store, 'readwrite').objectStore(store).put(record); } catch(e) {}
    }
  }
  db.close();
}

async function loadSavedData() {
  // Restore saved session basics from localStorage if not already set
  if (window.UserState && !window.UserState.id) {
    var savedId = localStorage.getItem('foromane_userId');
    var savedUsername = localStorage.getItem('foromane_username');
    var savedRole = localStorage.getItem('foromane_role');
    if (savedId) {
      window.UserState.set(savedId, savedUsername || '', savedRole || '', '', '', '');
    }
  }
}

async function init() {
  console.log('Initializing Foromane (Construction Hub) v2.0.0...');
  var _isReturning = false;
  try { _isReturning = !!localStorage.getItem('foromane_onboard_done'); } catch(e) {}
  if (_isReturning && typeof window.showAppShell === 'function') {
    window.showAppShell();
  }
  migrateLegacyLocalStorage();
  migrateLegacyIndexedDB();

  try {
    await ForomaneDB.init();
  } catch(err) {
    console.error('IndexedDB unavailable, running in offline mode:', err);
  }

  try {
    if (window.FOROMANE_MEDIA_READY) {
      await window.FOROMANE_MEDIA_READY;
    }
  } catch(err) {
    console.warn('Media cache module failed to load (non-fatal):', err);
  }

  // Init DriveAPI (silent — checks for saved OAuth token, no popup)
  try {
    if (typeof DriveAPI !== 'undefined' && DriveAPI.init) {
      await DriveAPI.init();
    }
  } catch(e) {
    console.warn('DriveAPI init failed (non-fatal):', e);
  }

  await loadProductCategories();

  try {
    await loadSavedData();
  } catch(err) {
    console.error('Failed to load saved data:', err);
  }

  let firebaseSessionProfile = null;
  if (typeof window.loadFirebaseUserSession === 'function') {
    try {
      firebaseSessionProfile = await window.loadFirebaseUserSession();
    } catch (e) {
      console.warn('Firebase session load failed:', e);
    }
  }

  if (firebaseSessionProfile) {
    try {
      await Auth.switchToProfile(firebaseSessionProfile);
    } catch (e) {
      console.warn('Failed to restore Firebase session into app state:', e);
    }
  } else {
    const savedId = localStorage.getItem('foromane_userId');
    let localProfileRestored = false;
    if (savedId) {
      const account = window.DEMO_ACCOUNTS.find(a => a.id === savedId);
      if (account) {
        UserState.set(account.id, account.name, account.role, '', account.town, '');
        var assoc = window.BUSINESS_ASSOCIATIONS ? window.BUSINESS_ASSOCIATIONS[savedId] : null;
        if (assoc) {
          var biz = window.SAMPLE_BUSINESSES.find(function(b) { return b.id === assoc.businessId; });
          if (biz) {
            UserState.business = {
              id: biz.id, name: biz.name, category: biz.category,
              town: biz.location.split(',').pop().trim(),
              phone: biz.phone || '', subscription: biz.subscription || 'free',
              logo: biz.logo || '',
              description: biz.description || '',
              logoLandscape: biz.logoLandscape || '',
              categories: biz.categories || [biz.category].filter(Boolean),
              contacts: { calls: [], facebook: [], gps: [], whatsapp: [] }
            };
            UserState.businessRole = assoc.role;
          }
          UserState.kpi = { ads: 0, views: 0, likes: 0, noteAdds: 0, interactions: 0 };
          UserState.interests = biz ? [biz.category] : [];
        } else if (savedId === 'user-gerald') {
          UserState.interests = ['Building Materials', 'Cement & Aggregates', 'Steel & Metal Products'];
        } else if (savedId === 'trade') {
          UserState.interests = ['Paint', 'Plumbing', 'Electrical'];
        } else if (savedId === 'general') {
          UserState.interests = ['Tiles & Flooring', 'Lighting', 'Paint'];
        }
      } else {
        try {
          var localProfile = await ForomaneDB.get('profiles', savedId);
          if (localProfile) {
            await Auth.switchToProfile(localProfile);
            localProfileRestored = true;
          }
        } catch (e) {
          console.warn('Failed to restore local profile from IndexedDB:', e);
        }
      }
    }

    try {
      if (!firebaseSessionProfile && !localProfileRestored) {
        await loadProfileFromDB();
      }
    } catch(err) {
      console.error('Failed to load profile:', err);
    }
  }

  try {
    await loadBusinessFromDB();
  } catch(err) {
    console.error('Failed to load business:', err);
  }

  try {
    await loadKpiFromDB();
  } catch(err) {
    console.error('Failed to load KPI:', err);
  }

  try {
    await loadCategoriesFromDB();
  } catch(err) {
    console.error('Failed to load categories:', err);
  }

  try {
    await ForomaneMediaCache.init();
  } catch(err) {
    console.warn('ForomaneMediaCache init failed (non-fatal):', err);
  }

  if (!firebaseSessionProfile && !_isReturning) {
    document.getElementById('view-welcome')?.classList.add('active');
  }
  if (_isReturning && !_appEntered && typeof window.enterApp === 'function') {
    window.enterApp();
  }
  window._catalogueItems = window.DEMO_CATALOGUE_ITEMS || [];

  try {
    const savedNotes = await ForomaneDB.getAll('notes');
    if (savedNotes.length > 0) {
      window._notes = savedNotes;
    }
  } catch(e) { console.error('Failed to load notes:', e); }

  reloadNotesForUser();

  setTimeout(function() {
    (async function() {
      try {
        const promoCount = await ForomaneDB.getAll('promos');
        if (promoCount.length !== window.SAMPLE_PROMOS.length) {
          if (promoCount.length > 0) {
            for (const p of promoCount) {
              await ForomaneDB.delete('promos', p.id);
            }
          }
          for (const promo of window.SAMPLE_PROMOS) {
            await ForomaneDB.put('promos', promo);
          }
        }
      } catch(e) { console.warn('Background promo seed:', e); }
    })();
  }, 2000);
}

async function loadProfileFromDB() {
  if (!ForomaneDB.db) return;
  var id = UserState && UserState.id;
  if (!id || id === 'guest') return;
  try {
    const saved = await ForomaneDB.get('profiles', id);
    if (saved) {
      UserState.set(saved.id || UserState.id, saved.name || UserState.name, saved.role || UserState.role, '', saved.town || UserState.town, saved.mobile || '');
      if (saved.interests && saved.interests.length > 0) {
        UserState.interests = saved.interests;
      }
    }
  } catch(e) { console.error('Failed to load profile:', e); }
}

async function loadBusinessFromDB() {
  if (!ForomaneDB.db) return;
  if (UserState.business) return; // Already set from BUSINESS_ASSOCIATIONS
  try {
    const saved = await ForomaneDB.get('businesses', 'biz_user');
    if (saved) {
      UserState.business = { id: saved.id, name: saved.name, category: saved.category, town: saved.town, phone: saved.phone, subscription: saved.subscription || 'free', logo: saved.logo || '', description: saved.description || '', logoLandscape: saved.logoLandscape || '', categories: saved.categories || [], contacts: saved.contacts || { calls: [], facebook: [], gps: [], whatsapp: [] } };
    }
  } catch(e) { console.error('Failed to load business:', e); }
}

async function loadKpiFromDB() {
  if (!ForomaneDB.db) return;
  try {
    const saved = await ForomaneDB.get('kpi', UserState.id);
    if (saved) {
      UserState.kpi = { ads: saved.ads || 0, views: saved.views || 0, likes: saved.likes || 0, noteAdds: saved.noteAdds || 0, interactions: saved.interactions || 0 };
    }
  } catch(e) { console.error('Failed to load KPI:', e); }
}

async function loadProductCategories() {
  if (!window.FOROMANE_PRODUCT_CATEGORIES) {
    console.warn('FOROMANE_PRODUCT_CATEGORIES not loaded from script tag');
  }
}

function updateHeaderLogo(isOnline) {
  const logo = document.querySelector('#app-header .logo img');
  if (!logo) return;
  logo.src = isOnline
    ? 'assets/images/company_logos_dummy/foromane_logo_icon_online.png'
    : 'assets/images/company_logos_dummy/foromane_logo_icon_offline.png';
}

window.addEventListener('online', async () => {
  showToast('Back online');
  updateHeaderLogo(true);
  if (typeof window.syncPendingOfflineProfiles === 'function') {
    try {
      var syncResult = await window.syncPendingOfflineProfiles();
      console.log('Pending offline profiles sync result:', syncResult);
      if (syncResult && syncResult.synced > 0) {
        showToast(syncResult.synced + ' offline profile(s) synced to the cloud');
      }
      if (syncResult && syncResult.conflicts > 0) {
        showToast(syncResult.conflicts + ' offline profile(s) have credential conflicts and require review');
      }
      if (syncResult && syncResult.failed.length > 0 && syncResult.conflicts === 0) {
        showToast('Some offline profile syncs failed. Check console for details.');
      }
      if (typeof window.updateAccountUI === 'function') {
        window.updateAccountUI();
      }
    } catch (syncError) {
      console.warn('Pending offline profile sync failed:', syncError);
    }
  }
});
window.addEventListener('offline', () => {
  showToast('Offline - data saved locally');
  updateHeaderLogo(false);
});

updateHeaderLogo(navigator.onLine);

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  window._installPrompt = e;
});

document.addEventListener('click', function(e) {
  // Vibrate on button press
  if (e.target.closest('.btn') && navigator.vibrate) {
    navigator.vibrate(20);
  }
  // Refresh online activity timer
  refreshActivityTimer();
});

document.addEventListener('touchstart', function() {
  refreshActivityTimer();
});

var _activityTimerRefresh = null;
function refreshActivityTimer() {
  if (_activityTimerRefresh) clearTimeout(_activityTimerRefresh);
  _activityTimerRefresh = setTimeout(function() {
    var pid = typeof getClaimedProId === 'function' ? getClaimedProId(UserState && UserState.id) : null;
    if (pid && typeof refreshOnlineExpiry === 'function') refreshOnlineExpiry(pid);
  }, 300);
}

window.addEventListener('focus', function() {
  var pid = typeof getClaimedProId === 'function' ? getClaimedProId(UserState && UserState.id) : null;
  if (pid && typeof refreshOnlineExpiry === 'function') refreshOnlineExpiry(pid);
});

document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    var pid = typeof getClaimedProId === 'function' ? getClaimedProId(UserState && UserState.id) : null;
    if (pid && typeof refreshOnlineExpiry === 'function') refreshOnlineExpiry(pid);
  }
});

init();
