/* ════════════════════════════════════════════════════════
   FOROMANE BACKEND LOGIC - Firebase cloud sync (optional)
   Falls back gracefully when Firebase is unavailable.
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
    await au.signInAnonymously(auth).catch(function(){});
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

  var q = fb.firestore.query(
    fb.firestore.collection(fb.db, 'businesses'),
    fb.firestore.where('ownerId', '==', uid)
  );
  var querySnapshot = await fb.firestore.getDocs(q);
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
