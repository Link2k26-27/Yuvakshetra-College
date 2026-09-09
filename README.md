# Hostel & Campus Hub - Web Application

A modern, offline-first web application designed for hostel and campus administration, featuring:

1. **Important Contacts Directory**:
   - Categorized directory for Electricians, Drivers, Plumbers, Wardens, Doctors, Mess, and Security.
   - Quick one-click direct calling (`tel:`), WhatsApp messaging, and clipboard copying.
   - Instant search & category pill filtering.
   - Add, edit, and delete contacts.

2. **Documents & Files Repository**:
   - Manage PDF notices, Excel sheets (`.xlsx`, `.xls`, `.csv`), and Word documents (`.docx`, `.doc`).
   - Drag-and-drop file upload with offline persistence using browser IndexedDB.
   - Live in-app preview for PDFs and document metadata inspector.
   - Instant file downloading and file type filtering.

3. **Hostel Students Directory (3 Batches)**:
   - Batch tabs for **1ˢᵗ Year**, **2ⁿᵈ Year**, and **3ʳᵈ Year**, plus an **All Batches** view.
   - Student profiles with:
     - Full Name & Course/Department
     - Student Phone number (with quick dial)
     - Father's Phone number (with quick dial)
     - Mother's Phone number (with quick dial)
     - Photo upload with live preview and auto-compression
     - Room / Roll number
   - Toggle between **Card Grid View** and **Detailed Table View**.
   - One-click **Export to CSV** for records and reporting.

4. **Student Count (Interactive Headcount Counter)**:
   - Faithfully follows the user's wireframe model:
     - **1ˢᵗ Year**: `[-]` `[ count ]` `[+]`
     - **2ⁿᵈ Year**: `[-]` `[ count ]` `[+]`
     - **3ʳᵈ Year**: `[-]` `[ count ]` `[+]`
     - **Sports**:   `[-]` `[ count ]` `[+]`
     - **Grand Total**: `[ automatic live sum ]`
   - Real-time dynamic calculation of the Grand Total.
   - Directly editable number boxes.
   - **Sync from Hostel Batch**: Automatically counts enrolled students across 1st, 2nd, and 3rd year from Page 3 with one click.
   - **Daily Headcount Logging**: Save timestamped attendance logs and view past records.

---

## How to Run

1. Simply double-click `launch.bat` or open `index.html` directly in any web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, Opera).
2. No Node.js, Python, or npm installation is required.
3. All student photos, documents, contacts, and headcount history are securely stored in your browser's local **IndexedDB** database and remain saved even after closing the browser.
