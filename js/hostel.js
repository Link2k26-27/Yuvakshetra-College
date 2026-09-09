/**
 * hostel.js - Hostel Students Page (Page 3)
 * Manages 3 batches (1st Year, 2nd Year, 3rd Year) with student records:
 * Name, Course, Student Phone, Father's Phone, Mother's Phone, and Photo.
 */

const DEFAULT_STUDENTS = [
  {
    name: "Aarav Sharma",
    batch: "1st Year",
    course: "B.Tech Computer Science",
    phone: "+91 98111 22334",
    fatherPhone: "+91 98111 55667",
    motherPhone: "+91 98111 88990",
    roomNo: "Room A-102",
    photoUrl: ""
  },
  {
    name: "Priya Nair",
    batch: "1st Year",
    course: "B.Tech Electronics & Comm.",
    phone: "+91 98222 33445",
    fatherPhone: "+91 98222 66778",
    motherPhone: "+91 98222 99001",
    roomNo: "Room B-105",
    photoUrl: ""
  },
  {
    name: "Rohan Patel",
    batch: "2nd Year",
    course: "B.Tech Mechanical Engg.",
    phone: "+91 98333 44556",
    fatherPhone: "+91 98333 77889",
    motherPhone: "+91 98333 11223",
    roomNo: "Room A-204",
    photoUrl: ""
  },
  {
    name: "Sneha Reddy",
    batch: "2nd Year",
    course: "B.Tech Civil Engg.",
    phone: "+91 98444 55667",
    fatherPhone: "+91 98444 88990",
    motherPhone: "+91 98444 22334",
    roomNo: "Room B-208",
    photoUrl: ""
  },
  {
    name: "Vikram Malhotra",
    batch: "3rd Year",
    course: "B.Tech Information Tech.",
    phone: "+91 98555 66778",
    fatherPhone: "+91 98555 99001",
    motherPhone: "+91 98555 33445",
    roomNo: "Room A-301",
    photoUrl: ""
  },
  {
    name: "Ananya Iyer",
    batch: "3rd Year",
    course: "B.Tech Biotechnology",
    phone: "+91 98666 77889",
    fatherPhone: "+91 98666 11223",
    motherPhone: "+91 98666 44556",
    roomNo: "Room B-302",
    photoUrl: ""
  }
];

class HostelManager {
  constructor() {
    this.students = [];
    this.activeBatch = 'All';
    this.searchQuery = '';
    this.viewMode = 'grid'; // 'grid' or 'table'
    this.editingStudentId = null;
    this.currentPhotoBase64 = '';

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.grid = document.getElementById('students-grid');
    this.tableContainer = document.getElementById('students-table-container');
    this.tableBody = document.getElementById('students-table-body');
    this.batchTabs = document.getElementById('hostel-batch-tabs');
    this.searchInput = document.getElementById('student-search');
    this.addBtn = document.getElementById('add-student-btn');
    this.viewToggleBtn = document.getElementById('toggle-view-btn');
    this.exportBtn = document.getElementById('export-students-btn');

    // Modal elements
    this.modal = document.getElementById('student-modal');
    this.modalTitle = document.getElementById('student-modal-title');
    this.modalForm = document.getElementById('student-form');
    this.modalClose = document.getElementById('student-modal-close');
    this.modalCancel = document.getElementById('student-modal-cancel');
    this.photoInput = document.getElementById('student-photo-input');
    this.photoPreview = document.getElementById('student-photo-preview');
  }

  bindEvents() {
    if (this.batchTabs) {
      this.batchTabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.batch-btn');
        if (!btn) return;
        this.batchTabs.querySelectorAll('.batch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeBatch = btn.dataset.batch;
        this.render();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.openAddModal());
    }

    if (this.viewToggleBtn) {
      this.viewToggleBtn.addEventListener('click', () => {
        this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
        this.viewToggleBtn.innerHTML = this.viewMode === 'grid' ? '📋 Table View' : '🔲 Card View';
        this.render();
      });
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportToCSV());
    }

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

    if (this.photoInput) {
      this.photoInput.addEventListener('change', (e) => this.handlePhotoSelect(e));
    }

    if (this.modalForm) {
      this.modalForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
  }

  async load() {
    let list = await window.appDB.getAll('students');
    if (!list || list.length === 0) {
      for (const item of DEFAULT_STUDENTS) {
        await window.appDB.add('students', item);
      }
      list = await window.appDB.getAll('students');
    }
    this.students = list;
    this.render();
    this.updateTabBadge();
    this.updateBatchCounts();
  }

  updateTabBadge() {
    const badge = document.getElementById('hostel-badge');
    if (badge) badge.textContent = this.students.length;
  }

  updateBatchCounts() {
    const c1 = this.students.filter(s => s.batch === '1st Year').length;
    const c2 = this.students.filter(s => s.batch === '2nd Year').length;
    const c3 = this.students.filter(s => s.batch === '3rd Year').length;

    const b1 = document.getElementById('batch-count-1');
    const b2 = document.getElementById('batch-count-2');
    const b3 = document.getElementById('batch-count-3');
    const bAll = document.getElementById('batch-count-all');

    if (b1) b1.textContent = c1;
    if (b2) b2.textContent = c2;
    if (b3) b3.textContent = c3;
    if (bAll) bAll.textContent = this.students.length;
  }

  getFilteredStudents() {
    return this.students.filter(s => {
      const matchesBatch = this.activeBatch === 'All' || s.batch === this.activeBatch;
      const query = this.searchQuery;
      const matchesSearch = !query ||
        s.name.toLowerCase().includes(query) ||
        (s.course && s.course.toLowerCase().includes(query)) ||
        (s.roomNo && s.roomNo.toLowerCase().includes(query)) ||
        (s.phone && s.phone.includes(query)) ||
        (s.fatherPhone && s.fatherPhone.includes(query)) ||
        (s.motherPhone && s.motherPhone.includes(query));

      return matchesBatch && matchesSearch;
    });
  }

  getInitials(name) {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Resize image to max 400x400 for snappy IndexedDB storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        this.currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.85);
        this.photoPreview.innerHTML = `<img src="${this.currentPhotoBase64}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" alt="Preview" />`;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  render() {
    const filtered = this.getFilteredStudents();

    if (this.viewMode === 'table') {
      if (this.grid) this.grid.style.display = 'none';
      if (this.tableContainer) this.tableContainer.style.display = 'block';
      this.renderTable(filtered);
    } else {
      if (this.tableContainer) this.tableContainer.style.display = 'none';
      if (this.grid) this.grid.style.display = 'grid';
      this.renderGrid(filtered);
    }
  }

  renderGrid(filtered) {
    if (!this.grid) return;

    if (filtered.length === 0) {
      this.grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎓</div>
          <h3>No students found</h3>
          <p>Try switching batches, clearing search filters, or adding a new student.</p>
        </div>
      `;
      return;
    }

    this.grid.innerHTML = filtered.map(s => {
      const initials = this.getInitials(s.name);
      const avatarHtml = s.photoUrl
        ? `<img src="${s.photoUrl}" class="student-avatar" alt="${this.escapeHtml(s.name)}" />`
        : `<div class="student-avatar">${initials}</div>`;

      const cleanStudentPhone = s.phone ? s.phone.replace(/[^0-9+]/g, '') : '';
      const cleanFatherPhone = s.fatherPhone ? s.fatherPhone.replace(/[^0-9+]/g, '') : '';
      const cleanMotherPhone = s.motherPhone ? s.motherPhone.replace(/[^0-9+]/g, '') : '';

      return `
        <div class="student-card" data-id="${s.id}">
          <div class="student-profile-header">
            ${avatarHtml}
            <div class="student-info-main">
              <h3 class="student-name" title="${this.escapeHtml(s.name)}">${this.escapeHtml(s.name)}</h3>
              <p class="student-course">${this.escapeHtml(s.course || 'Course Not Specified')}</p>
              <div class="student-badge-row">
                <span class="batch-badge">${this.escapeHtml(s.batch)}</span>
                ${s.roomNo ? `<span class="room-badge">${this.escapeHtml(s.roomNo)}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="contact-section-box">
            <div class="phone-entry">
              <span class="phone-label">👤 Student:</span>
              <span class="phone-num">${this.escapeHtml(s.phone || 'N/A')}</span>
              ${cleanStudentPhone ? `
                <a href="tel:${cleanStudentPhone}" class="phone-call-btn" title="Call Student">📞</a>
              ` : ''}
            </div>

            <div class="phone-entry">
              <span class="phone-label">👨 Father:</span>
              <span class="phone-num">${this.escapeHtml(s.fatherPhone || 'N/A')}</span>
              ${cleanFatherPhone ? `
                <a href="tel:${cleanFatherPhone}" class="phone-call-btn" title="Call Father">📞</a>
              ` : ''}
            </div>

            <div class="phone-entry">
              <span class="phone-label">👩 Mother:</span>
              <span class="phone-num">${this.escapeHtml(s.motherPhone || 'N/A')}</span>
              ${cleanMotherPhone ? `
                <a href="tel:${cleanMotherPhone}" class="phone-call-btn" title="Call Mother">📞</a>
              ` : ''}
            </div>
          </div>

          <div class="student-footer-actions">
            <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="hostelManager.openEditModal(${s.id})">✏️ Edit</button>
            <button class="btn btn-danger btn-sm" style="flex:1;" onclick="hostelManager.deleteStudent(${s.id})">🗑️ Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  renderTable(filtered) {
    if (!this.tableBody) return;

    if (filtered.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No students found matching your criteria.
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = filtered.map(s => {
      const initials = this.getInitials(s.name);
      const avatarHtml = s.photoUrl
        ? `<img src="${s.photoUrl}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;" alt="" />`
        : `<div style="width:36px; height:36px; border-radius:50%; background:#e0e7ff; color:#3730a3; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.75rem;">${initials}</div>`;

      return `
        <tr>
          <td>${avatarHtml}</td>
          <td>
            <strong>${this.escapeHtml(s.name)}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(s.roomNo || '')}</div>
          </td>
          <td><span class="batch-badge">${this.escapeHtml(s.batch)}</span></td>
          <td>${this.escapeHtml(s.course)}</td>
          <td>
            <a href="tel:${s.phone}" style="color:var(--primary); text-decoration:none;">${this.escapeHtml(s.phone)}</a>
          </td>
          <td>
            <div>👨 ${this.escapeHtml(s.fatherPhone || 'N/A')}</div>
            <div>👩 ${this.escapeHtml(s.motherPhone || 'N/A')}</div>
          </td>
          <td>
            <button class="btn btn-secondary btn-icon btn-sm" onclick="hostelManager.openEditModal(${s.id})">✏️</button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="hostelManager.deleteStudent(${s.id})">🗑️</button>
          </td>
        </tr>
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

  openAddModal() {
    this.editingStudentId = null;
    this.currentPhotoBase64 = '';
    this.modalTitle.textContent = 'Add Hostel Student';
    this.modalForm.reset();
    this.photoPreview.innerHTML = '<span>No Photo</span>';
    if (this.activeBatch !== 'All') {
      document.getElementById('student-batch-select').value = this.activeBatch;
    } else {
      document.getElementById('student-batch-select').value = '1st Year';
    }
    this.modal.classList.add('open');
  }

  async openEditModal(id) {
    const student = await window.appDB.getById('students', id);
    if (!student) return;

    this.editingStudentId = id;
    this.currentPhotoBase64 = student.photoUrl || '';
    this.modalTitle.textContent = 'Edit Student Details';

    document.getElementById('student-name-input').value = student.name || '';
    document.getElementById('student-batch-select').value = student.batch || '1st Year';
    document.getElementById('student-course-input').value = student.course || '';
    document.getElementById('student-room-input').value = student.roomNo || '';
    document.getElementById('student-phone-input').value = student.phone || '';
    document.getElementById('student-father-phone').value = student.fatherPhone || '';
    document.getElementById('student-mother-phone').value = student.motherPhone || '';

    if (this.currentPhotoBase64) {
      this.photoPreview.innerHTML = `<img src="${this.currentPhotoBase64}" style="width:100%; height:100%; object-fit:cover; border-radius:inherit;" alt="Photo" />`;
    } else {
      this.photoPreview.innerHTML = '<span>No Photo</span>';
    }

    this.modal.classList.add('open');
  }

  closeModal() {
    this.modal.classList.remove('open');
    this.modalForm.reset();
    this.currentPhotoBase64 = '';
    this.editingStudentId = null;
  }

  async handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('student-name-input').value.trim();
    const batch = document.getElementById('student-batch-select').value;
    const course = document.getElementById('student-course-input').value.trim();
    const roomNo = document.getElementById('student-room-input').value.trim();
    const phone = document.getElementById('student-phone-input').value.trim();
    const fatherPhone = document.getElementById('student-father-phone').value.trim();
    const motherPhone = document.getElementById('student-mother-phone').value.trim();

    if (!name || !batch) {
      window.showToast('Please provide student Name and Batch', 'danger');
      return;
    }

    const studentRecord = {
      name,
      batch,
      course,
      roomNo,
      phone,
      fatherPhone,
      motherPhone,
      photoUrl: this.currentPhotoBase64
    };

    if (this.editingStudentId) {
      studentRecord.id = this.editingStudentId;
      await window.appDB.update('students', studentRecord);
      window.showToast('Student updated successfully!', 'success');
    } else {
      await window.appDB.add('students', studentRecord);
      window.showToast('New student added to hostel!', 'success');
    }

    this.closeModal();
    await this.load();
  }

  async deleteStudent(id) {
    if (!confirm('Are you sure you want to remove this student record?')) return;
    await window.appDB.delete('students', id);
    window.showToast('Student removed', 'success');
    await this.load();
  }

  exportToCSV() {
    const filtered = this.getFilteredStudents();
    if (filtered.length === 0) {
      window.showToast('No students to export', 'danger');
      return;
    }

    let csv = 'ID,Name,Batch,Course,Room No,Student Phone,Father Phone,Mother Phone\n';
    filtered.forEach(s => {
      const row = [
        s.id,
        `"${(s.name || '').replace(/"/g, '""')}"`,
        `"${s.batch}"`,
        `"${(s.course || '').replace(/"/g, '""')}"`,
        `"${(s.roomNo || '').replace(/"/g, '""')}"`,
        `"${s.phone || ''}"`,
        `"${s.fatherPhone || ''}"`,
        `"${s.motherPhone || ''}"`
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Hostel_Students_${this.activeBatch.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    window.showToast('Exported student list to CSV', 'success');
  }
}

window.hostelManager = new HostelManager();
