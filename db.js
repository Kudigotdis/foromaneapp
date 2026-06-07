/* ════════════════════════════════════════════════════════
   FOROMANE DB - IndexedDB Wrapper
   ════════════════════════════════════════════════════════ */

const ForomaneDB = {
  db: null,
  DB_NAME: 'foromane-supply-solutions',
  DB_VERSION: 4,

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('businesses')) {
          db.createObjectStore('businesses', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('items')) {
          const itemStore = db.createObjectStore('items', { keyPath: 'id' });
          itemStore.createIndex('businessId', 'businessId', { unique: false });
          itemStore.createIndex('category', 'category', { unique: false });
          itemStore.createIndex('inPromos', 'inPromos', { unique: false });
        }
        if (!db.objectStoreNames.contains('promos')) {
          const promoStore = db.createObjectStore('promos', { keyPath: 'id' });
          promoStore.createIndex('businessId', 'businessId', { unique: false });
          promoStore.createIndex('category', 'category', { unique: false });
          promoStore.createIndex('liked', 'liked', { unique: false });
        }
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('userId', 'userId', { unique: false });
        }
        if (!db.objectStoreNames.contains('kpi')) {
          db.createObjectStore('kpi', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('filters')) {
          db.createObjectStore('filters', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('profiles')) {
          const profileStore = db.createObjectStore('profiles', { keyPath: 'id' });
          profileStore.createIndex('email', 'email', { unique: true });
          profileStore.createIndex('phone', 'phone', { unique: false });
        }
        if (!db.objectStoreNames.contains('credentials')) {
          const credStore = db.createObjectStore('credentials', { keyPath: 'id' });
          credStore.createIndex('credential', 'credential', { unique: true });
        }
        if (!db.objectStoreNames.contains('mediaCache')) {
          db.createObjectStore('mediaCache', { keyPath: 'url' });
        }
        if (!db.objectStoreNames.contains('packages')) {
          db.createObjectStore('packages', { keyPath: 'id' });
        }
      };
    });
  },

  async getAll(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      let request;

      if (indexName && value !== undefined) {
        const index = store.index(indexName);
        request = index.getAll(value);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

window.ForomaneDB = ForomaneDB;
