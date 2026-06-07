/* SyncQueue — lightweight IndexedDB queue for offline->online sync
   Uses a dedicated IndexedDB database `foromane-sync` with store `queue`.
   Supports both server (POST) and Drive (DriveAPI) flush targets.
*/

class SyncQueue {
  constructor(dbName = 'foromane-sync', storeName = 'queue') {
    this.dbName = dbName;
    this.storeName = storeName;
    this._db = null;
    this.syncEndpoint = '/sync/commit'; // configurable by caller
    this.flushInProgress = false;
    this.retryDelayBase = 2000; // ms
  }

  async _open() {
    if (this._db) return this._db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = evt => {
        const db = evt.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => { this._db = req.result; resolve(this._db); };
    });
  }

  async enqueue(type, payload, meta = {}) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const item = {
        id: (meta.id || ('sq_' + Date.now() + '_' + Math.random().toString(36).slice(2,8))),
        type,
        payload,
        meta,
        attempts: 0,
        createdAt: new Date().toISOString()
      };
      const req = store.add(item);
      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll() {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async remove(id) {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clear() {
    const db = await this._open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async flush(options = {}) {
    if (this.flushInProgress) return;
    const endpoint = options.endpoint || this.syncEndpoint;
    const all = await this.getAll();
    if (!all || all.length === 0) return { ok:true, processed:0 };

    this.flushInProgress = true;
    let processed = 0;

    for (const item of all) {
      try {
        item.attempts = (item.attempts || 0) + 1;
        console.log('SyncQueue: flushing item', item.id, 'to', endpoint);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type':'application/json',
            'Idempotency-Key': item.id
          },
          body: JSON.stringify({type: item.type, payload: item.payload, meta: item.meta})
        });

        if (res.ok) {
          await this.remove(item.id);
          processed++;
        } else {
          // Not OK — maybe auth or server error; decide whether to drop or retry later
          const text = await res.text().catch(()=>'');
          console.warn('Sync item failed', item.id, res.status, text);
          if (item.attempts > 5) {
            // give up and remove (or move to dead-letter in future)
            await this.remove(item.id);
          }
        }
      } catch (err) {
        console.warn('Network error flushing sync item', item.id, err);
        // schedule retry with exponential backoff
        const delay = this.retryDelayBase * Math.pow(2, Math.min((item.attempts||1)-1, 6));
        setTimeout(() => { this.flush({endpoint}); }, delay);
        break; // network down — stop iterating
      }
    }

    this.flushInProgress = false;
    return { ok:true, processed };
  }

  /* ─── Drive flush ─── */
  async flushToDrive(options = {}) {
    if (this.flushInProgress) return;
    if (!window.DriveAPI || typeof window.DriveAPI.isSignedIn !== 'function' || !window.DriveAPI.isSignedIn()) {
      console.warn('SyncQueue: Drive not signed in, skipping Drive flush');
      return { ok: false, reason: 'not_signed_in' };
    }
    var all = await this.getAll();
    if (!all || all.length === 0) return { ok: true, processed: 0 };

    this.flushInProgress = true;
    var processed = 0;

    for (var i = 0; i < all.length; i++) {
      var item = all[i];
      try {
        item.attempts = (item.attempts || 0) + 1;

        var userId = item.meta && item.meta.clientId;
        var folderId = null;

        if (item.type === 'profiles' || item.type === 'credentials' ||
            item.type === 'notes' || item.type === 'kpi' || item.type === 'filters') {
          if (!userId && item.payload && item.payload.id) userId = item.payload.id;
          if (userId) {
            var userFolder = await window.DriveAPI.ensureUserFolder(userId);
            folderId = userFolder.id;
          }
        } else if (item.type === 'businesses' || item.type === 'promos') {
          var bizId = item.meta && item.meta.bizId;
          if (!bizId && item.payload && item.payload.businessId) bizId = item.payload.businessId;
          if (bizId) {
            var bizFolder = await window.DriveAPI.ensureBusinessFolder(bizId);
            folderId = bizFolder.id;
          }
        }

        if (item.type === 'delete') {
          var store = item.payload && item.payload.store;
          var targetId = item.payload && item.payload.id;
          if (store && targetId && userId) {
            var dfolder = await window.DriveAPI.ensureUserFolder(userId);
            var dfileName = store + '.json';
            var existing = await window.DriveAPI.readJSON(dfolder.id, dfileName);
            if (existing) {
              if (Array.isArray(existing)) {
                var filtered = existing.filter(function(e) { return e.id !== targetId; });
                await window.DriveAPI.upsertJSON(dfolder.id, dfileName, filtered);
              } else if (existing.id === targetId) {
                await window.DriveAPI.deleteFile(dfolder.id, dfileName);
              }
            }
          }
          await this.remove(item.id);
          processed++;
          continue;
        }

        if (!folderId) {
          console.warn('SyncQueue: cannot determine folder for item', item.id);
          continue;
        }

        var fileName = item.type + '.json';
        await window.DriveAPI.upsertJSON(folderId, fileName, item.payload);
        await this.remove(item.id);
        processed++;
      } catch (err) {
        console.warn('SyncQueue: Drive flush error on item', item.id, err);
        var delay = this.retryDelayBase * Math.pow(2, Math.min((item.attempts || 1) - 1, 6));
        setTimeout(function() { this.flushToDrive(options); }.bind(this), delay);
        break;
      }
    }

    this.flushInProgress = false;
    return { ok: true, processed: processed };
  }

  /* ─── Hybrid: try Drive first, fall back to POST ─── */
  async flushAll(options) {
    if (window.DriveAPI && typeof window.DriveAPI.isSignedIn === 'function' && window.DriveAPI.isSignedIn()) {
      var driveResult = await this.flushToDrive(options);
      if (driveResult && driveResult.ok && driveResult.reason !== 'not_signed_in') return driveResult;
    }
    return await this.flush(options);
  }
}

// Instantiate and expose
window.SyncQueue = new SyncQueue();

// If running on localhost, default the sync endpoint to the mock server for easier local testing
try {
  if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.SyncQueue.syncEndpoint = '/sync/commit';
    console.log('SyncQueue.syncEndpoint auto-set to /sync/commit for localhost (proxied to mock server)');
  }
} catch(e) {}

// Listen to SW messages to trigger flush
if (navigator.serviceWorker && navigator.serviceWorker.controller) {
  navigator.serviceWorker.addEventListener('message', msg => {
    try {
      const d = msg.data || {};
      if (d && d.type === 'run-sync') {
        // Attempt to flush (Drive first if available, then POST)
        window.SyncQueue.flushAll().then(res => console.log('Sync flush result', res)).catch(e=>console.error('Flush error', e));
      }
    } catch(e) {}
  });
}

// Helper: register background sync request if available
async function requestBackgroundSync() {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg.sync) {
      await reg.sync.register('foromane-sync');
      return true;
    }
  } catch (e) { console.warn('Background Sync not available', e); }
  return false;
}

window.requestBackgroundSync = requestBackgroundSync;

// Flush when browser regains connectivity
window.addEventListener('online', function() {
  try {
    if (window.SyncQueue && typeof window.SyncQueue.flushAll === 'function') {
      window.SyncQueue.flushAll().then(r => console.log('Online: sync flush result', r)).catch(e => console.warn('Online flush failed', e));
    }
  } catch(e) {}
});
