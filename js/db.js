/**
 * db.js - Hybrid Cloud & Offline Storage Manager for Yuvakshetra College
 * Supports:
 * 1. Google Firebase Firestore for instant real-time sync across multiple devices (phones, tablets, PCs).
 * 2. IndexedDB for offline-first local fallback.
 */

const DB_NAME = 'YuvakshetraHubDatabase';
const DB_VERSION = 1;

class Database {
  constructor() {
    this.db = null;
    this.ready = this.init();
    this.listeners = {};
  }

  get isCloud() {
    return window.cloudManager && window.cloudManager.isConfigured && window.cloudManager.firestore;
  }

  get firestore() {
    return window.cloudManager ? window.cloudManager.firestore : null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id', autoIncrement: true });
          contactStore.createIndex('category', 'category', { unique: false });
          contactStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
          fileStore.createIndex('typeCategory', 'typeCategory', { unique: false });
          fileStore.createIndex('name', 'name', { unique: false });
          fileStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('students')) {
          const studentStore = db.createObjectStore('students', { keyPath: 'id', autoIncrement: true });
          studentStore.createIndex('batch', 'batch', { unique: false });
          studentStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('headcounts')) {
          const countStore = db.createObjectStore('headcounts', { keyPath: 'id', autoIncrement: true });
          countStore.createIndex('date', 'date', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async ensureDb() {
    if (!this.db) {
      await this.ready;
    }
    return this.db;
  }

  // ==========================================
  // Real-Time Listener Registration
  // ==========================================
  subscribe(storeName, callback) {
    if (this.isCloud) {
      try {
        const unsubscribe = this.firestore.collection(storeName).onSnapshot((snapshot) => {
          const items = [];
          snapshot.forEach((doc) => {
            items.push({ ...doc.data(), id: doc.id });
          });
          callback(items);
        }, (err) => {
          console.warn(`Firestore subscription error on ${storeName}:`, err);
        });
        this.listeners[storeName] = unsubscribe;
        return unsubscribe;
      } catch (e) {
        console.warn('Could not set up Firestore listener:', e);
      }
    }
    return null;
  }

  // ==========================================
  // Universal CRUD Operations (Cloud + Local)
  // ==========================================
  async getAll(storeName) {
    if (this.isCloud) {
      try {
        const snapshot = await this.firestore.collection(storeName).get();
        const items = [];
        snapshot.forEach((doc) => {
          items.push({ ...doc.data(), id: doc.id });
        });
        // Also update local cache for offline backup
        this.cacheLocally(storeName, items);
        return items;
      } catch (err) {
        console.warn('Firestore fetch failed, falling back to local DB:', err);
      }
    }

    // Local IndexedDB fallback
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getById(storeName, id) {
    if (this.isCloud) {
      try {
        const doc = await this.firestore.collection(storeName).doc(String(id)).get();
        if (doc.exists) {
          return { ...doc.data(), id: doc.id };
        }
      } catch (err) {
        console.warn('Firestore getById failed:', err);
      }
    }

    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(isNaN(Number(id)) ? id : Number(id));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, item) {
    if (this.isCloud) {
      try {
        const cleanItem = { ...item };
        delete cleanItem.id; // Let Firestore generate unique ID
        cleanItem.updatedAt = new Date().toISOString();
        const docRef = await this.firestore.collection(storeName).add(cleanItem);
        const resultItem = { ...cleanItem, id: docRef.id };
        // Mirror locally
        this.addLocal(storeName, resultItem);
        return docRef.id;
      } catch (err) {
        console.warn('Firestore add failed, saving locally:', err);
      }
    }

    return this.addLocal(storeName, item);
  }

  async addLocal(storeName, item) {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, item) {
    if (this.isCloud && item.id) {
      try {
        const docId = String(item.id);
        const updateData = { ...item, updatedAt: new Date().toISOString() };
        delete updateData.id;
        await this.firestore.collection(storeName).doc(docId).set(updateData, { merge: true });
        this.updateLocal(storeName, item);
        return true;
      } catch (err) {
        console.warn('Firestore update failed:', err);
      }
    }

    return this.updateLocal(storeName, item);
  }

  async updateLocal(storeName, item) {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    if (this.isCloud) {
      try {
        await this.firestore.collection(storeName).doc(String(id)).delete();
        this.deleteLocal(storeName, id);
        return true;
      } catch (err) {
        console.warn('Firestore delete failed:', err);
      }
    }

    return this.deleteLocal(storeName, id);
  }

  async deleteLocal(storeName, id) {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(isNaN(Number(id)) ? id : Number(id));
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheLocally(storeName, items) {
    try {
      const db = await this.ensureDb();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();
      items.forEach(it => store.put(it));
    } catch (e) {
      console.warn('Local cache error:', e);
    }
  }

  async clear(storeName) {
    if (this.isCloud) {
      try {
        const snapshot = await this.firestore.collection(storeName).get();
        const batch = this.firestore.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      } catch (err) {
        console.warn('Firestore clear error:', err);
      }
    }

    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Migrate all local IndexedDB records up to Firebase
  async syncLocalToCloud() {
    if (!this.isCloud) return false;

    const stores = ['contacts', 'students', 'files', 'headcounts'];
    for (const storeName of stores) {
      const localItems = await this.getAll(storeName);
      for (const item of localItems) {
        const cloudItem = { ...item };
        const id = cloudItem.id ? String(cloudItem.id) : undefined;
        delete cloudItem.id;
        cloudItem.syncedAt = new Date().toISOString();
        if (id) {
          await this.firestore.collection(storeName).doc(id).set(cloudItem, { merge: true });
        } else {
          await this.firestore.collection(storeName).add(cloudItem);
        }
      }
    }
    return true;
  }
}

window.appDB = new Database();
