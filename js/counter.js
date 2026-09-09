/**
 * counter.js - Student Count Page (Page 4)
 * Faithfully implements the interactive counter model shown in the user's diagram:
 * - 1st Year: [-] [ count ] [+]
 * - 2nd Year: [-] [ count ] [+]
 * - 3rd Year: [-] [ count ] [+]
 * - Sports:   [-] [ count ] [+]
 * - Grand Total: [ automatically calculated sum ]
 */

class StudentCounterManager {
  constructor() {
    this.counts = {
      y1: 0,
      y2: 0,
      y3: 0,
      sports: 0
    };

    this.initElements();
    this.bindEvents();
    this.loadPersistedCounts();
    this.loadHistory();
  }

  initElements() {
    this.inputs = {
      y1: document.getElementById('count-input-y1'),
      y2: document.getElementById('count-input-y2'),
      y3: document.getElementById('count-input-y3'),
      sports: document.getElementById('count-input-sports')
    };

    this.grandTotalDisplay = document.getElementById('grand-total-display');
    this.syncBtn = document.getElementById('sync-counter-btn');
    this.resetBtn = document.getElementById('reset-counter-btn');
    this.saveBtn = document.getElementById('save-counter-btn');
    this.historyTableBody = document.getElementById('headcount-history-body');
  }

  bindEvents() {
    // Minus and Plus buttons
    document.querySelectorAll('[data-counter-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.counterAction;
        const target = btn.dataset.target;
        this.adjustCount(target, action === 'inc' ? 1 : -1);
      });
    });

    // Manual typing inside the middle boxes
    Object.keys(this.inputs).forEach(key => {
      const input = this.inputs[key];
      if (input) {
        input.addEventListener('input', (e) => {
          let val = parseInt(e.target.value, 10);
          if (isNaN(val) || val < 0) val = 0;
          this.counts[key] = val;
          e.target.value = val;
          this.updateGrandTotal();
          this.persistCounts();
        });

        input.addEventListener('blur', (e) => {
          if (e.target.value === '' || isNaN(parseInt(e.target.value, 10))) {
            e.target.value = this.counts[key] || 0;
          }
        });
      }
    });

    if (this.syncBtn) {
      this.syncBtn.addEventListener('click', () => this.syncFromHostelRecords());
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.resetCounts());
    }

    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.saveCurrentHeadcount());
    }
  }

  adjustCount(targetKey, delta) {
    if (this.counts[targetKey] === undefined) return;
    const current = this.counts[targetKey];
    const updated = Math.max(0, current + delta);
    this.counts[targetKey] = updated;

    if (this.inputs[targetKey]) {
      this.inputs[targetKey].value = updated;
    }

    this.updateGrandTotal();
    this.persistCounts();
  }

  updateGrandTotal() {
    const total = (this.counts.y1 || 0) +
                  (this.counts.y2 || 0) +
                  (this.counts.y3 || 0) +
                  (this.counts.sports || 0);

    if (this.grandTotalDisplay) {
      this.grandTotalDisplay.textContent = total;
    }

    return total;
  }

  persistCounts() {
    try {
      localStorage.setItem('hostel_student_counts', JSON.stringify(this.counts));
    } catch (e) {
      console.warn('Could not persist to localStorage:', e);
    }
  }

  loadPersistedCounts() {
    try {
      const saved = localStorage.getItem('hostel_student_counts');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.counts = {
          y1: Math.max(0, parseInt(parsed.y1, 10) || 0),
          y2: Math.max(0, parseInt(parsed.y2, 10) || 0),
          y3: Math.max(0, parseInt(parsed.y3, 10) || 0),
          sports: Math.max(0, parseInt(parsed.sports, 10) || 0)
        };
      }
    } catch (e) {
      console.warn('Error loading saved counts:', e);
    }

    // Set input values
    Object.keys(this.inputs).forEach(key => {
      if (this.inputs[key]) {
        this.inputs[key].value = this.counts[key];
      }
    });

    this.updateGrandTotal();
  }

  async syncFromHostelRecords() {
    const students = await window.appDB.getAll('students');
    const count1 = students.filter(s => s.batch === '1st Year').length;
    const count2 = students.filter(s => s.batch === '2nd Year').length;
    const count3 = students.filter(s => s.batch === '3rd Year').length;

    this.counts.y1 = count1;
    this.counts.y2 = count2;
    this.counts.y3 = count3;
    // Keep sports as is or prompt

    this.inputs.y1.value = count1;
    this.inputs.y2.value = count2;
    this.inputs.y3.value = count3;

    this.updateGrandTotal();
    this.persistCounts();
    window.showToast(`Synced! 1st: ${count1}, 2nd: ${count2}, 3rd: ${count3}`, 'success');
  }

  resetCounts() {
    if (!confirm('Reset all student counts to 0?')) return;
    this.counts = { y1: 0, y2: 0, y3: 0, sports: 0 };
    Object.keys(this.inputs).forEach(key => {
      if (this.inputs[key]) this.inputs[key].value = 0;
    });
    this.updateGrandTotal();
    this.persistCounts();
    window.showToast('All counts reset to 0', 'success');
  }

  async saveCurrentHeadcount() {
    const total = this.updateGrandTotal();
    const entry = {
      timestamp: new Date().toLocaleString(),
      y1: this.counts.y1,
      y2: this.counts.y2,
      y3: this.counts.y3,
      sports: this.counts.sports,
      total: total
    };

    await window.appDB.add('headcounts', entry);
    window.showToast(`Saved headcount record: Total ${total} students`, 'success');
    await this.loadHistory();
  }

  async loadHistory() {
    if (!this.historyTableBody) return;
    const list = await window.appDB.getAll('headcounts');

    if (!list || list.length === 0) {
      this.historyTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color:var(--text-muted); padding:1rem;">
            No saved headcount logs yet. Click "Save Record" to log today's count.
          </td>
        </tr>
      `;
      return;
    }

    // Sort newest first
    list.sort((a, b) => (b.id || 0) - (a.id || 0));

    this.historyTableBody.innerHTML = list.slice(0, 10).map(item => `
      <tr>
        <td><strong>${item.timestamp}</strong></td>
        <td>${item.y1}</td>
        <td>${item.y2}</td>
        <td>${item.y3}</td>
        <td>${item.sports}</td>
        <td><strong style="color:var(--primary);">${item.total}</strong></td>
        <td>
          <button class="btn btn-danger btn-icon btn-sm" onclick="studentCounterManager.deleteHistoryItem(${item.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  async deleteHistoryItem(id) {
    await window.appDB.delete('headcounts', id);
    window.showToast('Log entry removed', 'success');
    await this.loadHistory();
  }
}

window.studentCounterManager = new StudentCounterManager();
