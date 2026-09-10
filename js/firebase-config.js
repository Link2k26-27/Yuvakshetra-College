/**
 * firebase-config.js - Firebase Firestore Cloud Backend Configuration
 * Enables free real-time cross-device data synchronization for Yuvakshetra College.
 * 
 * You can paste your Firebase credentials below OR paste them directly in the 
 * "Cloud Database" modal inside the web app on any device!
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

class CloudManager {
  constructor() {
    this.isConfigured = false;
    this.firestore = null;
    this.app = null;
    this.config = this.loadConfig();
    this.initFirebase();
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem('yuvakshetra_firebase_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read stored Firebase config:', e);
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  saveConfig(newConfig) {
    try {
      localStorage.setItem('yuvakshetra_firebase_config', JSON.stringify(newConfig));
      this.config = newConfig;
      this.initFirebase();
      return true;
    } catch (e) {
      console.error('Error saving Firebase config:', e);
      return false;
    }
  }

  clearConfig() {
    try {
      localStorage.removeItem('yuvakshetra_firebase_config');
      this.config = DEFAULT_FIREBASE_CONFIG;
      this.isConfigured = false;
      this.firestore = null;
      window.location.reload();
    } catch (e) {
      console.error('Error clearing config:', e);
    }
  }

  initFirebase() {
    if (!this.config || !this.config.apiKey || !this.config.projectId) {
      this.isConfigured = false;
      this.firestore = null;
      this.updateStatusBadge();
      return;
    }

    try {
      if (window.firebase) {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(this.config);
        } else {
          this.app = firebase.app();
        }
        this.firestore = firebase.firestore();
        this.isConfigured = true;
        console.log('Firebase Firestore Cloud Sync active! Project:', this.config.projectId);
      }
    } catch (err) {
      console.error('Failed to initialize Firebase:', err);
      this.isConfigured = false;
      this.firestore = null;
    }

    this.updateStatusBadge();
  }

  updateStatusBadge() {
    const badge = document.getElementById('cloud-sync-btn');
    const text = document.getElementById('cloud-status-text');
    const homeBadge = document.getElementById('home-cloud-badge');
    
    if (this.isConfigured) {
      if (badge) {
        badge.className = 'cloud-status-btn connected';
        badge.title = `Connected to Cloud (Project: ${this.config.projectId})`;
      }
      if (text) text.textContent = '🟢 Cloud Synced';
      if (homeBadge) {
        homeBadge.className = 'status-pill-glass connected';
        homeBadge.innerHTML = '🟢 Real-Time Cloud Sync Active';
      }
    } else {
      if (badge) {
        badge.className = 'cloud-status-btn disconnected';
        badge.title = 'Click to connect free Firebase Cloud Sync';
      }
      if (text) text.textContent = '☁️ Connect Cloud Sync';
      if (homeBadge) {
        homeBadge.className = 'status-pill-glass';
        homeBadge.innerHTML = '🟡 Local Mode (Click to enable free Cloud Sync across devices)';
      }
    }
  }
}

window.cloudManager = new CloudManager();
