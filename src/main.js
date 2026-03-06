import { UrlValidator } from './urlValidator.js';

const COLUMNS = {
  moz: {
    headers: ['URL', 'Root Domain', 'DA', 'PA', 'Spam Score', 'Status', 'Provider'],
    row: r => [r.url, r.rootDomain, r.da ?? '', r.pa ?? '', r.spamScore ?? '', r.status, r.provider || 'moz'],
    cells: r => `
      <td>${esc(r.url)}</td>
      <td>${esc(r.rootDomain)}</td>
      <td>${r.da ?? ''}</td>
      <td>${r.pa ?? ''}</td>
      <td>${r.spamScore ?? ''}</td>
      <td class="${statusClass(r)}">${r.status}</td>
      <td>Moz</td>`
  },
  semrush: {
    headers: ['URL', 'Root Domain', 'Authority Score', 'Backlinks', 'Referring Domains', 'Status', 'Provider'],
    row: r => [r.url, r.rootDomain, r.authorityScore ?? '', r.backlinks ?? '', r.referringDomains ?? '', r.status, r.provider || 'semrush'],
    cells: r => `
      <td>${esc(r.url)}</td>
      <td>${esc(r.rootDomain)}</td>
      <td>${r.authorityScore ?? ''}</td>
      <td>${r.backlinks ?? ''}</td>
      <td>${r.referringDomains ?? ''}</td>
      <td class="${statusClass(r)}">${r.status}</td>
      <td>Semrush</td>`
  }
};

function esc(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function statusClass(r) {
  return r.status === 'Success' ? 'status-success' :
    r.status === 'Error' ? 'status-error' : 'status-nodata';
}

class BulkUrlChecker {
  constructor() {
    this.urlInput = document.getElementById('urlInput');
    this.analyzeBtn = document.getElementById('analyzeBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.copyBtn = document.getElementById('copyBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.configureApiBtn = document.getElementById('configureApiBtn');
    this.providerSelect = document.getElementById('providerSelect');
    this.providerStatus = document.getElementById('providerStatus');
    this.loadingState = document.getElementById('loadingState');
    this.errorState = document.getElementById('errorState');
    this.emptyState = document.getElementById('emptyState');
    this.resultsSection = document.getElementById('resultsSection');
    this.resultsHead = document.getElementById('resultsHead');
    this.resultsBody = document.getElementById('resultsBody');
    this.resultsCount = document.getElementById('resultsCount');
    this.errorMessage = document.getElementById('errorMessage');

    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsModal = document.getElementById('settingsModal');
    this.closeModal = document.getElementById('closeModal');

    this.results = [];
    this.lastProvider = 'moz';
    this.availableProviders = [];

    this.initEventListeners();
    this.checkConfiguration();
    this.showEmptyState();
  }

  initEventListeners() {
    this.analyzeBtn.addEventListener('click', () => this.handleAnalyze());
    this.clearBtn.addEventListener('click', () => this.handleClear());
    this.copyBtn.addEventListener('click', () => this.handleCopy());
    this.exportBtn.addEventListener('click', () => this.handleExport());
    this.configureApiBtn.addEventListener('click', () => this.openSettings());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.closeModal.addEventListener('click', () => this.closeSettings());

    // Settings tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Moz form
    document.getElementById('mozForm').addEventListener('submit', (e) => this.handleSaveMoz(e));
    document.getElementById('toggleSecret').addEventListener('click', () => {
      this.toggleField('secretKey', 'toggleSecret');
    });

    // Semrush form
    document.getElementById('semrushForm').addEventListener('submit', (e) => this.handleSaveSemrush(e));
    document.getElementById('toggleSemrushKey').addEventListener('click', () => {
      this.toggleField('semrushApiKey', 'toggleSemrushKey');
    });

    // Cancel buttons
    document.getElementById('cancelBtn').addEventListener('click', () => this.closeSettings());
    document.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => this.closeSettings());
    });

    // Click outside modal
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettings();
    });
  }

  // --- Configuration ---

  async checkConfiguration() {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      this.availableProviders = data.providers || [];
      this.updateProviderUI(data);

      if (!data.configured) {
        setTimeout(() => {
          this.showToast('Please configure API credentials in Settings');
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to check configuration:', error);
    }
  }

  updateProviderUI(config) {
    const labels = [];
    if (config.moz?.configured) labels.push('Moz');
    if (config.semrush?.configured) labels.push('Semrush');

    if (labels.length > 0) {
      this.providerStatus.textContent = `Active: ${labels.join(', ')}`;
      this.providerStatus.className = 'provider-status active';
    } else {
      this.providerStatus.textContent = 'No provider configured';
      this.providerStatus.className = 'provider-status inactive';
    }

    // Update config badges in modal
    const mozBadge = document.getElementById('mozConfigStatus');
    if (config.moz?.configured) {
      mozBadge.textContent = 'Configured';
      mozBadge.className = 'config-badge configured';
    } else {
      mozBadge.textContent = 'Not configured';
      mozBadge.className = 'config-badge not-configured';
    }

    const semrushBadge = document.getElementById('semrushConfigStatus');
    if (config.semrush?.configured) {
      semrushBadge.textContent = 'Configured';
      semrushBadge.className = 'config-badge configured';
    } else {
      semrushBadge.textContent = 'Not configured';
      semrushBadge.className = 'config-badge not-configured';
    }
  }

  // --- Settings modal ---

  openSettings() {
    this.settingsModal.classList.remove('hidden');
    document.querySelectorAll('.settings-status').forEach(el => el.classList.add('hidden'));
  }

  closeSettings() {
    this.settingsModal.classList.add('hidden');
    document.getElementById('mozForm').reset();
    document.getElementById('semrushForm').reset();
  }

  switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === tab + 'Tab');
    });
  }

  toggleField(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = 'Hide';
    } else {
      input.type = 'password';
      btn.textContent = 'Show';
    }
  }

  async handleSaveMoz(e) {
    e.preventDefault();
    const accessId = document.getElementById('accessId').value.trim();
    const secretKey = document.getElementById('secretKey').value.trim();
    const statusEl = document.getElementById('mozStatus');

    if (!accessId || !secretKey) {
      this.showStatus(statusEl, 'Please fill in both fields', true);
      return;
    }

    try {
      const response = await fetch('/api/config/moz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessId, secretKey })
      });
      const data = await response.json();

      if (response.ok) {
        this.showStatus(statusEl, 'Moz credentials saved!', false);
        await this.checkConfiguration();
        setTimeout(() => {
          this.closeSettings();
          this.showToast('Moz API credentials configured!');
        }, 1000);
      } else {
        this.showStatus(statusEl, data.error || 'Failed to save', true);
      }
    } catch {
      this.showStatus(statusEl, 'Failed to save credentials', true);
    }
  }

  async handleSaveSemrush(e) {
    e.preventDefault();
    const apiKey = document.getElementById('semrushApiKey').value.trim();
    const statusEl = document.getElementById('semrushStatus');

    if (!apiKey) {
      this.showStatus(statusEl, 'Please enter your API key', true);
      return;
    }

    try {
      const response = await fetch('/api/config/semrush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      });
      const data = await response.json();

      if (response.ok) {
        this.showStatus(statusEl, 'Semrush key saved!', false);
        await this.checkConfiguration();
        setTimeout(() => {
          this.closeSettings();
          this.showToast('Semrush API key configured!');
        }, 1000);
      } else {
        this.showStatus(statusEl, data.error || 'Failed to save', true);
      }
    } catch {
      this.showStatus(statusEl, 'Failed to save API key', true);
    }
  }

  showStatus(el, message, isError) {
    el.textContent = message;
    el.className = `settings-status ${isError ? 'error' : 'success'}`;
    el.classList.remove('hidden');
  }

  // --- UI states ---

  showEmptyState() {
    this.hideAllStates();
    this.emptyState.classList.remove('hidden');
  }

  showLoadingState() {
    this.hideAllStates();
    this.loadingState.classList.remove('hidden');
  }

  showErrorState(message) {
    this.hideAllStates();
    this.errorMessage.textContent = message;
    this.errorState.classList.remove('hidden');
  }

  showResultsState() {
    this.hideAllStates();
    this.resultsSection.classList.remove('hidden');
  }

  hideAllStates() {
    this.loadingState.classList.add('hidden');
    this.errorState.classList.add('hidden');
    this.emptyState.classList.add('hidden');
    this.resultsSection.classList.add('hidden');
  }

  // --- Analysis ---

  getSelectedProvider() {
    const val = this.providerSelect.value;
    if (val === 'auto') return undefined; // let server decide
    return val;
  }

  async handleAnalyze() {
    const inputText = this.urlInput.value;
    const validation = UrlValidator.processInput(inputText);

    if (!validation.success) {
      this.showErrorState(validation.error);
      return;
    }
    if (validation.urls.length > 1000) {
      this.showErrorState('Maximum 1000 URLs allowed. Please reduce the number of URLs.');
      return;
    }

    this.showLoadingState();
    this.analyzeBtn.disabled = true;

    try {
      const body = { urls: validation.urls };
      const provider = this.getSelectedProvider();
      if (provider) body.provider = provider;

      const response = await fetch('/api/check-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const data = await response.json();
      this.results = data.results;
      this.lastProvider = data.provider || 'moz';
      this.displayResults();

    } catch (error) {
      console.error('Error:', error);
      this.showErrorState(error.message || 'Failed to analyze URLs. Check your API configuration.');
    } finally {
      this.analyzeBtn.disabled = false;
    }
  }

  handleClear() {
    this.urlInput.value = '';
    this.results = [];
    this.showEmptyState();
  }

  // --- Results display ---

  getColumns() {
    return COLUMNS[this.lastProvider] || COLUMNS.moz;
  }

  displayResults() {
    const cols = this.getColumns();

    // Build header
    this.resultsHead.innerHTML = cols.headers.map(h => `<th>${h}</th>`).join('');

    // Build body
    this.resultsBody.innerHTML = '';
    this.results.forEach(result => {
      const row = document.createElement('tr');
      row.innerHTML = cols.cells(result);
      this.resultsBody.appendChild(row);
    });

    const successCount = this.results.filter(r => r.status === 'Success').length;
    this.resultsCount.textContent = `Showing ${this.results.length} results (${successCount} successful) via ${this.lastProvider === 'semrush' ? 'Semrush' : 'Moz'}`;

    this.showResultsState();
  }

  // --- Copy & Export ---

  handleCopy() {
    const cols = this.getColumns();
    const rows = this.results.map(r => cols.row(r));
    const tableText = [cols.headers, ...rows].map(row => row.join('\t')).join('\n');

    navigator.clipboard.writeText(tableText).then(() => {
      this.showToast('Table copied to clipboard!');
    }).catch(() => {
      this.showToast('Failed to copy table', true);
    });
  }

  handleExport() {
    const cols = this.getColumns();
    const rows = this.results.map(r => cols.row(r));
    const csvContent = [cols.headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    link.setAttribute('href', url);
    link.setAttribute('download', `${this.lastProvider}-results-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast('CSV file downloaded!');
  }

  showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ef4444' : '#1e293b';
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }
}

new BulkUrlChecker();
