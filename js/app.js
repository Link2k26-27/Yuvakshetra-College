/**
 * app.js - Main Application Coordinator for Yuvakshetra College
 * Handles Home Page dashboard, tab navigation, page lifecycle,
 * cloud sync modal, and global toast notifications.
 */

window.showToast = function(message, type = 'default') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'danger' ? 'toast-danger' : ''}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'danger') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
};

class App {
  constructor() {
    this.navBtns = document.querySelectorAll('.nav-tab-btn');
    this.pages = document.querySelectorAll('.page-section');
    this.init();
  }

  async init() {
    this.bindNavEvents();
    this.bindCloudModalEvents();

    // Default to 'home'
    const initialHash = window.location.hash.replace('#', '') || 'home';
    this.switchPage(initialHash);

    // Initialize all modules
    try {
      await window.appDB.ensureDb();
      if (window.contactsManager) await window.contactsManager.load();
      if (window.filesManager) await window.filesManager.load();
      if (window.hostelManager) await window.hostelManager.load();
      if (window.studentCounterManager) {
        window.studentCounterManager.loadPersistedCounts();
        window.studentCounterManager.loadHistory();
      }

      this.updateHomeStats();
      if (window.cloudManager) window.cloudManager.updateStatusBadge();
    } catch (err) {
      console.error('App init error:', err);
    }
  }

  bindNavEvents() {
    this.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const pageId = btn.dataset.page;
        this.switchPage(pageId);
      });
    });

    window.addEventListener('hashchange', () => {
      const pageId = window.location.hash.replace('#', '') || 'home';
      this.switchPage(pageId, false);
    });
  }

  switchPage(pageId, updateHash = true) {
    const validPages = ['home', 'contacts', 'files', 'hostel', 'counter'];
    if (!validPages.includes(pageId)) pageId = 'home';

    // Update buttons
    this.navBtns.forEach(btn => {
      if (btn.dataset.page === pageId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update page sections
    this.pages.forEach(page => {
      if (page.id === `page-${pageId}`) {
        page.classList.add('active');
      } else {
        page.classList.remove('active');
      }
    });

    if (updateHash && window.location.hash !== `#${pageId}`) {
      window.location.hash = pageId;
    }

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh Home Stats whenever landing on home
    if (pageId === 'home') {
      this.updateHomeStats();
    }

    // Refresh module state if needed
    if (pageId === 'counter' && window.studentCounterManager) {
      window.studentCounterManager.loadPersistedCounts();
      window.studentCounterManager.loadHistory();
    }
  }

  updateHomeStats() {
    const studentCountEl = document.getElementById('stat-students-count');
    const contactsCountEl = document.getElementById('stat-contacts-count');
    const filesCountEl = document.getElementById('stat-files-count');
    const headcountTotalEl = document.getElementById('stat-headcount-total');

    if (studentCountEl && window.hostelManager) {
      studentCountEl.textContent = window.hostelManager.students ? window.hostelManager.students.length : 0;
    }

    if (contactsCountEl && window.contactsManager) {
      contactsCountEl.textContent = window.contactsManager.contacts ? window.contactsManager.contacts.length : 0;
    }

    if (filesCountEl && window.filesManager) {
      filesCountEl.textContent = window.filesManager.files ? window.filesManager.files.length : 0;
    }

    if (headcountTotalEl && window.studentCounterManager) {
      const total = window.studentCounterManager.updateGrandTotal ? window.studentCounterManager.updateGrandTotal() : 0;
      headcountTotalEl.textContent = total;
    }
  }

  // ==========================================
  // Cloud Database Modal Setup
  // ==========================================
  bindCloudModalEvents() {
    const cloudBtn = document.getElementById('cloud-sync-btn');
    const modal = document.getElementById('cloud-modal');
    const modalClose = document.getElementById('cloud-modal-close');
    const modalCancel = document.getElementById('cloud-modal-cancel');
    const saveBtn = document.getElementById('cloud-save-btn');
    const disconnectBtn = document.getElementById('cloud-disconnect-btn');
    const syncNowBtn = document.getElementById('cloud-sync-now-btn');
    const textarea = document.getElementById('firebase-config-input');

    if (cloudBtn) {
      cloudBtn.addEventListener('click', () => this.openCloudModal());
    }

    if (modalClose) modalClose.addEventListener('click', () => this.closeCloudModal());
    if (modalCancel) modalCancel.addEventListener('click', () => this.closeCloudModal());
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeCloudModal();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const raw = textarea.value.trim();
        if (!raw) {
          window.showToast('Please paste your Firebase configuration', 'danger');
          return;
        }

        try {
          let parsed;
          // Support both pure JSON and JavaScript object syntax: { apiKey: "..." }
          if (raw.startsWith('{') && raw.endsWith('}')) {
            try {
              parsed = JSON.parse(raw);
            } catch (e) {
              // Convert JS object keys to JSON
              const jsonStr = raw
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
                .replace(/'/g, '"');
              parsed = JSON.parse(jsonStr);
            }
          } else {
            throw new Error('Invalid format');
          }

          if (!parsed.projectId || !parsed.apiKey) {
            window.showToast('Configuration must contain apiKey and projectId', 'danger');
            return;
          }

          window.cloudManager.saveConfig(parsed);
          window.showToast('Connected to Google Firebase Cloud! Reloading...', 'success');
          setTimeout(() => window.location.reload(), 1200);
        } catch (err) {
          window.showToast('Could not parse config. Please check format.', 'danger');
          console.error(err);
        }
      });
    }

    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => {
        if (confirm('Disconnect from Firebase Cloud? (Data remains safely stored locally)')) {
          window.cloudManager.clearConfig();
        }
      });
    }

    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', async () => {
        syncNowBtn.disabled = true;
        syncNowBtn.textContent = '⏳ Uploading...';
        const ok = await window.appDB.syncLocalToCloud();
        syncNowBtn.disabled = false;
        syncNowBtn.textContent = '🔄 Upload Local Data';
        if (ok) {
          window.showToast('Local students, contacts & files synced to Cloud!', 'success');
        } else {
          window.showToast('Sync error or cloud offline', 'danger');
        }
      });
    }
  }

  openCloudModal() {
    const modal = document.getElementById('cloud-modal');
    const textarea = document.getElementById('firebase-config-input');
    const disconnectBtn = document.getElementById('cloud-disconnect-btn');
    const syncNowBtn = document.getElementById('cloud-sync-now-btn');

    if (window.cloudManager && window.cloudManager.isConfigured) {
      textarea.value = JSON.stringify(window.cloudManager.config, null, 2);
      if (disconnectBtn) disconnectBtn.style.display = 'inline-flex';
      if (syncNowBtn) syncNowBtn.style.display = 'inline-flex';
    } else {
      if (disconnectBtn) disconnectBtn.style.display = 'none';
      if (syncNowBtn) syncNowBtn.style.display = 'none';
    }

    if (modal) modal.classList.add('open');
  }

  closeCloudModal() {
    const modal = document.getElementById('cloud-modal');
    if (modal) modal.classList.remove('open');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
