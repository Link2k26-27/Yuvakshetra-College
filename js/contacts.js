/**
 * contacts.js - Important Contacts Directory (Page 1)
 * Manages categorized contacts such as Electricians, Drivers, Plumbers, Wardens, etc.
 */

const DEFAULT_CONTACTS = [
  {
    name: "Rajesh Kumar",
    category: "Electricians",
    phone: "+91 98765 43210",
    altPhone: "+91 98765 43211",
    notes: "Hostel Block A & B Maintenance, Available 8 AM - 8 PM"
  },
  {
    name: "Ramesh Sharma",
    category: "Drivers",
    phone: "+91 98234 56789",
    altPhone: "",
    notes: "Hostel Emergency & Campus Shuttle Van (Van No. 04)"
  },
  {
    name: "Manoj Singh",
    category: "Plumbers",
    phone: "+91 97123 45678",
    altPhone: "+91 97123 45679",
    notes: "Water supply, pipe leaks, bathroom fixtures"
  },
  {
    name: "Dr. Arvind Mehta",
    category: "Wardens",
    phone: "+91 99887 76655",
    altPhone: "+91 99887 76656",
    notes: "Chief Hostel Warden - Office Room 102, Admin Block"
  },
  {
    name: "Campus Health Center",
    category: "Doctors",
    phone: "+91 91234 56780",
    altPhone: "108",
    notes: "24/7 First Aid & Ambulance Desk, Resident Doctor"
  },
  {
    name: "Suresh Patil",
    category: "Mess & Catering",
    phone: "+91 98345 67891",
    altPhone: "",
    notes: "Mess Supervisor, Dining Hall & Special Meals"
  },
  {
    name: "Main Gate Security",
    category: "Security",
    phone: "+91 98901 23456",
    altPhone: "",
    notes: "24/7 Gate Guard & Night Patrolling Team"
  }
];

class ContactsManager {
  constructor() {
    this.contacts = [];
    this.activeCategory = 'All';
    this.searchQuery = '';
    this.editingContactId = null;

    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.grid = document.getElementById('contacts-grid');
    this.searchInput = document.getElementById('contact-search');
    this.categoryPills = document.getElementById('contact-pills');
    this.addBtn = document.getElementById('add-contact-btn');
    this.modal = document.getElementById('contact-modal');
    this.modalForm = document.getElementById('contact-form');
    this.modalClose = document.getElementById('contact-modal-close');
    this.modalCancel = document.getElementById('contact-modal-cancel');
    this.modalTitle = document.getElementById('contact-modal-title');
  }

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });
    }

    if (this.categoryPills) {
      this.categoryPills.addEventListener('click', (e) => {
        const btn = e.target.closest('.pill-btn');
        if (!btn) return;
        this.categoryPills.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeCategory = btn.dataset.category;
        this.render();
      });
    }

    if (this.addBtn) {
      this.addBtn.addEventListener('click', () => this.openAddModal());
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

    if (this.modalForm) {
      this.modalForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
  }

  async load() {
    let list = await window.appDB.getAll('contacts');
    if (!list || list.length === 0) {
      for (const item of DEFAULT_CONTACTS) {
        await window.appDB.add('contacts', item);
      }
      list = await window.appDB.getAll('contacts');
    }
    this.contacts = list;
    this.render();
    this.updateTabBadge();
  }

  updateTabBadge() {
    const badge = document.getElementById('contacts-badge');
    if (badge) badge.textContent = this.contacts.length;
  }

  getFilteredContacts() {
    return this.contacts.filter(c => {
      const matchesCategory = this.activeCategory === 'All' || 
        c.category.toLowerCase() === this.activeCategory.toLowerCase();
      
      const query = this.searchQuery;
      const matchesSearch = !query || 
        c.name.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        (c.phone && c.phone.toLowerCase().includes(query)) ||
        (c.notes && c.notes.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }

  getTagClass(category) {
    const cat = category.toLowerCase();
    if (cat.includes('electric')) return 'tag-electrician';
    if (cat.includes('driver')) return 'tag-driver';
    if (cat.includes('plumb')) return 'tag-plumber';
    if (cat.includes('warden')) return 'tag-warden';
    if (cat.includes('doc') || cat.includes('medic') || cat.includes('health')) return 'tag-doctor';
    if (cat.includes('secur')) return 'tag-security';
    if (cat.includes('mess') || cat.includes('canteen')) return 'tag-canteen';
    return 'tag-general';
  }

  render() {
    if (!this.grid) return;
    const filtered = this.getFilteredContacts();

    if (filtered.length === 0) {
      this.grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📞</div>
          <h3>No contacts found</h3>
          <p>Try clearing your search or category filter, or add a new contact.</p>
        </div>
      `;
      return;
    }

    this.grid.innerHTML = filtered.map(c => {
      const tagClass = this.getTagClass(c.category);
      const cleanPhone = c.phone.replace(/[^0-9+]/g, '');
      const waPhone = c.phone.replace(/[^0-9]/g, '');

      return `
        <div class="contact-card" data-id="${c.id}">
          <div>
            <div class="contact-header">
              <div>
                <h3 class="contact-name">${this.escapeHtml(c.name)}</h3>
                <span class="category-tag ${tagClass}">${this.escapeHtml(c.category)}</span>
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-secondary btn-icon btn-sm" title="Edit Contact" onclick="contactsManager.openEditModal(${c.id})">✏️</button>
                <button class="btn btn-danger btn-icon btn-sm" title="Delete Contact" onclick="contactsManager.deleteContact(${c.id})">🗑️</button>
              </div>
            </div>

            <div class="contact-body">
              <div class="contact-info-row">
                <span>📱</span>
                <span class="contact-phone-primary">${this.escapeHtml(c.phone)}</span>
              </div>
              ${c.altPhone ? `
                <div class="contact-info-row">
                  <span>☎️</span>
                  <span>Alt: ${this.escapeHtml(c.altPhone)}</span>
                </div>
              ` : ''}
              ${c.notes ? `
                <div class="contact-info-row" style="margin-top: 6px; font-style: italic; color: var(--text-muted);">
                  <span>📍</span>
                  <span>${this.escapeHtml(c.notes)}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="contact-actions">
            <a href="tel:${cleanPhone}" class="btn btn-success btn-sm">📞 Call</a>
            ${waPhone ? `<a href="https://wa.me/${waPhone}" target="_blank" class="btn btn-secondary btn-sm" title="WhatsApp">💬 Chat</a>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="contactsManager.copyPhone('${this.escapeHtml(c.phone)}')">📋 Copy</button>
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

  copyPhone(phone) {
    navigator.clipboard.writeText(phone).then(() => {
      window.showToast(`Copied ${phone} to clipboard!`, 'success');
    }).catch(() => {
      window.showToast('Failed to copy', 'danger');
    });
  }

  openAddModal() {
    this.editingContactId = null;
    this.modalTitle.textContent = 'Add Important Contact';
    this.modalForm.reset();
    document.getElementById('contact-category-select').value = 'Electricians';
    this.modal.classList.add('open');
  }

  async openEditModal(id) {
    const contact = await window.appDB.getById('contacts', id);
    if (!contact) return;

    this.editingContactId = id;
    this.modalTitle.textContent = 'Edit Contact';
    document.getElementById('contact-name-input').value = contact.name || '';
    document.getElementById('contact-category-select').value = contact.category || 'Electricians';
    document.getElementById('contact-phone-input').value = contact.phone || '';
    document.getElementById('contact-altphone-input').value = contact.altPhone || '';
    document.getElementById('contact-notes-input').value = contact.notes || '';
    this.modal.classList.add('open');
  }

  closeModal() {
    this.modal.classList.remove('open');
    this.modalForm.reset();
    this.editingContactId = null;
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('contact-name-input').value.trim();
    const category = document.getElementById('contact-category-select').value;
    const phone = document.getElementById('contact-phone-input').value.trim();
    const altPhone = document.getElementById('contact-altphone-input').value.trim();
    const notes = document.getElementById('contact-notes-input').value.trim();

    if (!name || !phone) {
      window.showToast('Please enter Name and Phone Number', 'danger');
      return;
    }

    const contactData = { name, category, phone, altPhone, notes };

    if (this.editingContactId) {
      contactData.id = this.editingContactId;
      await window.appDB.update('contacts', contactData);
      window.showToast('Contact updated successfully!', 'success');
    } else {
      await window.appDB.add('contacts', contactData);
      window.showToast('New contact added!', 'success');
    }

    this.closeModal();
    await this.load();
  }

  async deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    await window.appDB.delete('contacts', id);
    window.showToast('Contact deleted', 'success');
    await this.load();
  }
}

window.contactsManager = new ContactsManager();
