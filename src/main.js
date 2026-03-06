import { UrlValidator } from './urlValidator.js';

class MozBulkChecker {
  constructor() {
    this.urlInput = document.getElementById('urlInput');
    this.analyzeBtn = document.getElementById('analyzeBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.copyBtn = document.getElementById('copyBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.loadingState = document.getElementById('loadingState');
    this.errorState = document.getElementById('errorState');
    this.emptyState = document.getElementById('emptyState');
    this.resultsSection = document.getElementById('resultsSection');
    this.resultsBody = document.getElementById('resultsBody');
    this.resultsCount = document.getElementById('resultsCount');
    this.errorMessage = document.getElementById('errorMessage');

    this.results = [];

    this.initEventListeners();
    this.showEmptyState();
  }

  initEventListeners() {
    this.analyzeBtn.addEventListener('click', () => this.handleAnalyze());
    this.clearBtn.addEventListener('click', () => this.handleClear());
    this.copyBtn.addEventListener('click', () => this.handleCopy());
    this.exportBtn.addEventListener('click', () => this.handleExport());
  }

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
      const response = await fetch('/api/check-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          urls: validation.urls
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const data = await response.json();
      this.results = data.results;
      this.displayResults();

    } catch (error) {
      console.error('Error:', error);
      this.showErrorState(error.message || 'Failed to analyze URLs. Please check your Moz API configuration.');
    } finally {
      this.analyzeBtn.disabled = false;
    }
  }

  handleClear() {
    this.urlInput.value = '';
    this.results = [];
    this.showEmptyState();
  }

  displayResults() {
    this.resultsBody.innerHTML = '';

    this.results.forEach(result => {
      const row = document.createElement('tr');

      const statusClass =
        result.status === 'Success' ? 'status-success' :
        result.status === 'Error' ? 'status-error' : 'status-nodata';

      row.innerHTML = `
        <td>${this.escapeHtml(result.url)}</td>
        <td>${this.escapeHtml(result.rootDomain)}</td>
        <td>${result.da}</td>
        <td>${result.pa}</td>
        <td>${result.spamScore}</td>
        <td class="${statusClass}">${result.status}</td>
      `;

      this.resultsBody.appendChild(row);
    });

    const successCount = this.results.filter(r => r.status === 'Success').length;
    this.resultsCount.textContent = `Showing ${this.results.length} results (${successCount} successful)`;

    this.showResultsState();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  handleCopy() {
    const headers = ['URL', 'Root Domain', 'DA', 'PA', 'Spam Score', 'Status'];
    const rows = this.results.map(r => [
      r.url,
      r.rootDomain,
      r.da,
      r.pa,
      r.spamScore,
      r.status
    ]);

    const tableText = [headers, ...rows]
      .map(row => row.join('\t'))
      .join('\n');

    navigator.clipboard.writeText(tableText).then(() => {
      this.showToast('Table copied to clipboard!');
    }).catch(err => {
      console.error('Copy failed:', err);
      this.showToast('Failed to copy table', true);
    });
  }

  handleExport() {
    const headers = ['URL', 'Root Domain', 'DA', 'PA', 'Spam Score', 'Status'];
    const rows = this.results.map(r => [
      r.url,
      r.rootDomain,
      r.da,
      r.pa,
      r.spamScore,
      r.status
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.setAttribute('href', url);
    link.setAttribute('download', `moz-results-${timestamp}.csv`);
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

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
}

new MozBulkChecker();
