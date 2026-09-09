/**
 * app.js - Main Application Coordinator
 * Handles tab navigation, page lifecycle, and global toast notifications.
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

    // Check hash or default to contacts
    const initialHash = window.location.hash.replace('#', '') || 'contacts';
    this.switchPage(initialHash);

    // Initialize all modules
    try {
      await window.appDB.ensureDb();
      if (window.contactsManager) await window.contactsManager.load();
      if (window.filesManager) await window.filesManager.load();
      if (window.hostelManager) await window.hostelManager.load();
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
      const pageId = window.location.hash.replace('#', '') || 'contacts';
      this.switchPage(pageId, false);
    });
  }

  switchPage(pageId, updateHash = true) {
    const validPages = ['contacts', 'files', 'hostel', 'counter'];
    if (!validPages.includes(pageId)) pageId = 'contacts';

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

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh module state if needed
    if (pageId === 'counter' && window.studentCounterManager) {
      window.studentCounterManager.loadPersistedCounts();
      window.studentCounterManager.loadHistory();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
