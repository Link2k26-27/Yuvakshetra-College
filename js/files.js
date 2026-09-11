/**
 * files.js - Documents & Files Repository (Page 2)
 * Manages PDF, Excel (.xls/.xlsx/.csv), and Word (.doc/.docx) files with upload, preview, and download.
 */

const DEFAULT_FILES = [
  {
    name: "Hostel_Rules_and_Code_of_Conduct_2026.pdf",
    typeCategory: "PDF",
    fileType: "application/pdf",
    size: 245800,
    date: new Date().toLocaleDateString(),
    dataUrl: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFsgNSAwIFIgXQovQ291bnQgMQo+PgplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDQgMCBSCi9NZWRpYUJveCBbIDAgMCA2MTIgNzkyIF0KL0NvbnRlbnRzIDYgMCBSCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9MZW5ndGggNTIKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRECltdIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMTE1MCAwMDAwMCBuIAowMDAwMDAwMTkzIDAwMDAwIG4gCjAwMDAwMDAyNTUgMDAwMDAgbiAKMDAwMDAwMDM1OCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDcKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1OQolJUVPRg=="
  },
  {
    name: "Hostel_Room_Allotment_Sheet.xlsx",
    typeCategory: "Excel",
    fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 118400,
    date: new Date().toLocaleDateString(),
    dataUrl: "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQAAAAIAA=="
  },
  {
    name: "Mess_Weekly_Menu_and_Timings.docx",
    typeCategory: "Word",
    fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 84300,
    date: new Date().toLocaleDateString(),
    dataUrl: "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAAAAIAA=="
  }
];

class FilesManager {
  constructor() {
    this.files = [];
    this.activeFilter = 'All';
    this.searchQuery = '';

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.grid = document.getElementById('files-grid');
    this.dropzone = document.getElementById('file-dropzone');
    this.fileInput = document.getElementById('file-input');
    this.filterPills = document.getElementById('file-pills');
    this.searchInput = document.getElementById('file-search');

    // Modal elements
    this.modal = document.getElementById('file-modal');
    this.modalClose = document.getElementById('file-modal-close');
    this.modalCancel = document.getElementById('file-modal-cancel');
    this.modalDownload = document.getElementById('file-modal-download');
    this.currentPreviewFile = null;
  }

  bindEvents() {
    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.closeModal());
    }

    if (this.modalCancel) {
      this.modalCancel.addEventListener('click', () => this.closeModal());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    if (this.modalDownload) {
      this.modalDownload.addEventListener('click', () => {
        if (this.currentPreviewFile) {
          this.downloadFile(this.currentPreviewFile.id);
        }
      });
    }
    if (this.dropzone && this.fileInput) {
      this.dropzone.addEventListener('click', () => this.fileInput.click());

      this.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropzone.classList.add('dragover');
      });

      this.dropzone.addEventListener('dragleave', () => {
        this.dropzone.classList.remove('dragover');
      });

      this.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          this.handleFileUpload(e.dataTransfer.files);
        }
      });

      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleFileUpload(e.target.files);
        }
      });
    }

    if (this.filterPills) {
      this.filterPills.addEventListener('click', (e) => {
        const btn = e.target.closest('.pill-btn');
        if (!btn) return;
        this.filterPills.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.render();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }
  }

  async load() {
    if (window.appDB && window.appDB.isCloud) {
      window.appDB.subscribe('files', (cloudItems) => {
        if (cloudItems) {
          this.files = cloudItems;
          this.render();
          this.updateTabBadge();
          if (window.app && window.app.updateHomeStats) window.app.updateHomeStats();
        }
      });
    }

    let list = await window.appDB.getAll('files');
    if (!list || list.length === 0) {
      for (const item of DEFAULT_FILES) {
        await window.appDB.add('files', item);
      }
      list = await window.appDB.getAll('files');
    }
    this.files = list;
    this.render();
    this.updateTabBadge();
    if (window.app && window.app.updateHomeStats) window.app.updateHomeStats();
  }

  updateTabBadge() {
    const badge = document.getElementById('files-badge');
    if (badge) badge.textContent = this.files.length;
  }

  categorizeFile(name, mimeType) {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pdf') || mimeType === 'application/pdf') return 'PDF';
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv') || mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'Excel';
    if (lower.endsWith('.doc') || lower.endsWith('.docx') || mimeType.includes('word') || mimeType.includes('document')) return 'Word';
    return 'Other';
  }

  formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async handleFileUpload(fileList) {
    for (const file of fileList) {
      const category = this.categorizeFile(file.name, file.type);
      const reader = new FileReader();

      reader.onload = async (event) => {
        const fileRecord = {
          name: file.name,
          typeCategory: category,
          fileType: file.type || 'application/octet-stream',
          size: file.size,
          date: new Date().toLocaleDateString(),
          dataUrl: event.target.result
        };

        await window.appDB.add('files', fileRecord);
        window.showToast(`Uploaded "${file.name}"`, 'success');
        await this.load();
      };

      reader.readAsDataURL(file);
    }
    this.fileInput.value = '';
  }

  getFilteredFiles() {
    return this.files.filter(f => {
      const matchesCategory = this.activeFilter === 'All' || 
        f.typeCategory.toLowerCase() === this.activeFilter.toLowerCase();
      
      const query = this.searchQuery;
      const matchesSearch = !query || f.name.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }

  render() {
    if (!this.grid) return;
    const filtered = this.getFilteredFiles();

    if (filtered.length === 0) {
      this.grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>No files found</h3>
          <p>Drag and drop or upload PDF, Excel, and Word files above.</p>
        </div>
      `;
      return;
    }

    this.grid.innerHTML = filtered.map(f => {
      let iconClass = 'icon-other';
      let iconText = 'FILE';
      if (f.typeCategory === 'PDF') {
        iconClass = 'icon-pdf';
        iconText = 'PDF';
      } else if (f.typeCategory === 'Excel') {
        iconClass = 'icon-excel';
        iconText = 'XLS';
      } else if (f.typeCategory === 'Word') {
        iconClass = 'icon-word';
        iconText = 'DOC';
      }

      return `
        <div class="file-card" data-id="${f.id}">
          <div class="file-header">
            <div class="file-icon-box ${iconClass}">
              ${iconText}
            </div>
            <div class="file-details">
              <h4 class="file-name" title="${this.escapeHtml(f.name)}">${this.escapeHtml(f.name)}</h4>
              <p class="file-meta">${this.formatSize(f.size)} • ${f.date || 'Recent'}</p>
            </div>
          </div>

          <div class="file-actions">
            <button class="btn btn-secondary btn-sm" onclick='filesManager.downloadFile(${JSON.stringify(f.id)})'>⬇️ Download</button>
            <button class="btn btn-secondary btn-sm" onclick='filesManager.previewFile(${JSON.stringify(f.id)})'>👁️ Preview</button>
            <button class="btn btn-danger btn-icon btn-sm" title="Delete File" onclick='filesManager.deleteFile(${JSON.stringify(f.id)})'>🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async downloadFile(id) {
    const file = await window.appDB.getById('files', id);
    if (!file || !file.dataUrl) {
      window.showToast('File data unavailable', 'danger');
      return;
    }

    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.showToast(`Downloading ${file.name}`, 'success');
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove('open');
      const container = document.getElementById('file-modal-preview-container');
      if (container) {
        container.innerHTML = '';
        container.style.display = 'none';
      }
    }
    this.currentPreviewFile = null;
  }

  async previewFile(id) {
    const file = await window.appDB.getById('files', id);
    if (!file) return;

    this.currentPreviewFile = file;

    const modalTitle = document.getElementById('file-modal-title');
    const modalName = document.getElementById('file-modal-name');
    const modalBadge = document.getElementById('file-modal-badge');
    const modalIcon = document.getElementById('file-modal-icon');
    const modalSize = document.getElementById('file-modal-size');
    const modalMime = document.getElementById('file-modal-mime');
    const modalDate = document.getElementById('file-modal-date');
    const previewContainer = document.getElementById('file-modal-preview-container');

    if (modalTitle) modalTitle.textContent = `${file.typeCategory} Document`;
    if (modalName) modalName.textContent = file.name;
    if (modalSize) modalSize.textContent = this.formatSize(file.size);
    if (modalMime) modalMime.textContent = file.fileType || 'application/octet-stream';
    if (modalDate) modalDate.textContent = file.date || 'Today';

    let iconClass = 'icon-other';
    let iconText = 'FILE';
    if (file.typeCategory === 'PDF') {
      iconClass = 'icon-pdf';
      iconText = 'PDF';
    } else if (file.typeCategory === 'Excel') {
      iconClass = 'icon-excel';
      iconText = 'XLS';
    } else if (file.typeCategory === 'Word') {
      iconClass = 'icon-word';
      iconText = 'DOC';
    }

    if (modalIcon) {
      modalIcon.className = `file-icon-box ${iconClass}`;
      modalIcon.textContent = iconText;
    }

    if (modalBadge) {
      modalBadge.textContent = file.typeCategory;
      modalBadge.className = `category-tag tag-${file.typeCategory.toLowerCase()}`;
    }

    if (previewContainer) {
      if (file.typeCategory === 'PDF' && file.dataUrl) {
        previewContainer.style.display = 'block';
        previewContainer.innerHTML = `<iframe src="${file.dataUrl}" style="width: 100%; height: 320px; border: none; border-radius: 6px;"></iframe>`;
      } else {
        previewContainer.style.display = 'block';
        previewContainer.innerHTML = `
          <div style="padding: 1.5rem; color: var(--text-muted);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📄</div>
            <p><strong>Ready for offline use</strong></p>
            <p style="font-size: 0.8rem; margin-top: 0.25rem;">Click "Download File" to open in Microsoft Excel or Microsoft Word.</p>
          </div>
        `;
      }
    }

    if (this.modal) {
      this.modal.classList.add('open');
    }
  }

  async deleteFile(id) {
    if (!confirm('Are you sure you want to delete this file?')) return;
    await window.appDB.delete('files', id);
    window.showToast('File deleted', 'success');
    await this.load();
  }
}

window.filesManager = new FilesManager();
