/** Supabase-backed records with IndexedDB available when offline. */
const DB_NAME = 'YuvakshetraHubDatabase';
const DB_VERSION = 1;
const STORES = ['contacts', 'files', 'students', 'headcounts'];

class Database {
  constructor() { this.db = null; this.ready = this.init(); this.listeners = {}; }
  get isCloud() { return Boolean(window.cloudManager?.supabase && window.cloudManager?.session); }
  get supabase() { return window.cloudManager?.supabase || null; }
  async init() { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, DB_VERSION); request.onupgradeneeded = event => { const db = event.target.result; STORES.forEach(name => { if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id', autoIncrement: true }); }); }; request.onsuccess = event => { this.db = event.target.result; resolve(this.db); }; request.onerror = () => reject(request.error); }); }
  async ensureDb() { if (!this.db) await this.ready; return this.db; }
  async getAll(storeName) { if (this.isCloud) { const { data, error } = await this.supabase.from(storeName).select('*').order('created_at', { ascending: false }); if (!error) { this.cacheLocally(storeName, data || []); return data || []; } console.warn('Supabase read failed; using local data.', error.message); } return this.getAllLocal(storeName); }
  async getAllLocal(storeName) { const db = await this.ensureDb(); return new Promise((resolve, reject) => { const req = db.transaction(storeName).objectStore(storeName).getAll(); req.onsuccess = () => resolve(req.result || []); req.onerror = () => reject(req.error); }); }
  async getById(storeName, id) { if (this.isCloud) { const { data, error } = await this.supabase.from(storeName).select('*').eq('id', id).single(); if (!error) return data; } const db = await this.ensureDb(); return new Promise((resolve, reject) => { const req = db.transaction(storeName).objectStore(storeName).get(id); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
  async add(storeName, item) { if (this.isCloud) { const clean = { ...item }; delete clean.id; const { data, error } = await this.supabase.from(storeName).insert(clean).select().single(); if (!error) { this.putLocal(storeName, data); return data.id; } console.warn('Supabase add failed', error.message); } return this.addLocal(storeName, item); }
  async update(storeName, item) { if (this.isCloud && item.id) { const clean = { ...item }; delete clean.id; const { error } = await this.supabase.from(storeName).update(clean).eq('id', item.id); if (!error) { this.putLocal(storeName, item); return true; } } return this.putLocal(storeName, item); }
  async delete(storeName, id) { if (this.isCloud) { const { error } = await this.supabase.from(storeName).delete().eq('id', id); if (!error) { this.deleteLocal(storeName, id); return true; } } return this.deleteLocal(storeName, id); }
  async subscribe(storeName, callback) { if (!this.isCloud) return null; if (this.listeners[storeName]) this.supabase.removeChannel(this.listeners[storeName]); const channel = this.supabase.channel(`${storeName}-changes`).on('postgres_changes', { event: '*', schema: 'public', table: storeName }, async () => callback(await this.getAll(storeName))).subscribe(); this.listeners[storeName] = channel; return channel; }
  async addLocal(storeName, item) { const db = await this.ensureDb(); return new Promise((resolve, reject) => { const req = db.transaction(storeName, 'readwrite').objectStore(storeName).add(item); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
  async putLocal(storeName, item) { const db = await this.ensureDb(); return new Promise((resolve, reject) => { const req = db.transaction(storeName, 'readwrite').objectStore(storeName).put(item); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
  async deleteLocal(storeName, id) { const db = await this.ensureDb(); return new Promise((resolve, reject) => { const req = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id); req.onsuccess = () => resolve(true); req.onerror = () => reject(req.error); }); }
  async cacheLocally(storeName, items) { const db = await this.ensureDb(); const tx = db.transaction(storeName, 'readwrite'); tx.objectStore(storeName).clear(); items.forEach(item => tx.objectStore(storeName).put(item)); }
  async syncLocalToCloud() { if (!this.isCloud) return false; for (const store of STORES) for (const item of await this.getAllLocal(store)) await this.add(store, item); return true; }
}
window.appDB = new Database();
