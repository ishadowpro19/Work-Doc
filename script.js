(function () {
  const STORAGE_KEY = 'procredit-loan-entries-v2';

  const DEFAULT_ENTRIES = [
    { id: '09174920581', type: 'Personal loan', applicant: 'Maria Santos Reyes', amount: 150000, terms: 18, status: 'approved' },
    { id: '76221459', type: 'Emergency loan', applicant: 'Juan Carlo Bautista', amount: 120000, terms: 12, status: 'declined' },
    { id: '09298317642', type: 'Business loan', applicant: 'Angelica Mae Fernandez', amount: 250000, terms: 30, status: 'approved' },
    { id: '48930215', type: 'Personal loan', applicant: 'Ramon Dela Cruz Jr.', amount: 100000, terms: 12, status: 'declined' }
  ];

  const tableBody = document.getElementById('tableBody');
  const emptyState = document.getElementById('emptyState');
  const pageRange = document.getElementById('pageRange');
  const pillGroup = document.getElementById('pillGroup');
  const searchInput = document.getElementById('searchInput');
  const loanForm = document.getElementById('loanForm');
  const exportBtn = document.getElementById('exportBtn');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const loanCard = document.getElementById('loanCard');

  let entries = loadEntries();
  let activeFilter = 'all';
  let searchTerm = '';

  function loadEntries() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore corrupt storage */ }
    return DEFAULT_ENTRIES.slice();
  }

  function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  function formatAmount(n) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function matchesFilter(entry) {
    if (activeFilter === 'reject') return entry.status === 'declined';
    return true;
  }

  function matchesSearch(entry) {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return entry.id.toLowerCase().includes(q) || entry.applicant.toLowerCase().includes(q);
  }

  function render() {
    const visible = entries.filter((e) => matchesFilter(e) && matchesSearch(e));

    tableBody.innerHTML = '';
    emptyState.hidden = visible.length > 0;

    visible.forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'grid-row loan-row';
      row.innerHTML = `
        <div class="col-status">
          <span class="status-icon ${entry.status}">${entry.status === 'approved' ? '&#10003;' : '&#10005;'}</span>
        </div>
        <div class="col-id">${escapeHtml(entry.id)}</div>
        <div class="col-type">${escapeHtml(entry.type)}</div>
        <div class="col-applicant">${escapeHtml(entry.applicant)}</div>
        <div class="col-amount">${formatAmount(entry.amount)}</div>
        <div class="col-terms">${entry.terms} months</div>
        <div class="col-statuslabel">
          <span class="status-pill ${entry.status}">${entry.status === 'approved' ? 'APPROVED' : 'DECLINED'}</span>
        </div>`;
      tableBody.appendChild(row);
    });

    pageRange.textContent = visible.length ? `1-${visible.length} of ${visible.length}` : '0 of 0';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  pillGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn) return;
    pillGroup.querySelectorAll('.pill').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    render();
  });

  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    render();
  });

  loanForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('inputId').value.trim();
    const type = document.getElementById('inputType').value;
    const applicant = document.getElementById('inputApplicant').value.trim();
    const amount = parseFloat(document.getElementById('inputAmount').value);
    const terms = parseInt(document.getElementById('inputTerms').value, 10);
    const status = document.getElementById('inputStatus').value;

    if (!id || !applicant || Number.isNaN(amount) || Number.isNaN(terms)) return;

    entries.unshift({ id, type, applicant, amount, terms, status });
    saveEntries();
    render();
    loanForm.reset();
    showToast('Loan entry added to the table.');
  });

  resetDefaultsBtn.addEventListener('click', () => {
    entries = DEFAULT_ENTRIES.slice();
    saveEntries();
    render();
    showToast('Table reset to default entries.');
  });

  exportBtn.addEventListener('click', () => {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting…';
    html2canvas(loanCard, { backgroundColor: '#86d3d9', scale: 2 }).then((canvas) => {
      const link = document.createElement('a');
      link.download = `procredit-loan-list-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export table as PNG';
    }).catch(() => {
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export table as PNG';
      showToast('Export failed. Please try again.');
    });
  });

  render();
})();
