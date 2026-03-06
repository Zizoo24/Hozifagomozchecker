const SEMRUSH_API_URL = 'https://api.semrush.com/';

export class SemrushApiService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async checkUrls(urls) {
    if (!this.apiKey) {
      throw new Error('Semrush API key not configured');
    }

    const results = [];

    for (const url of urls) {
      try {
        const cleanedUrl = this.cleanUrl(url);
        const data = await this.fetchDomainData(cleanedUrl);
        results.push(data);
      } catch (error) {
        console.error(`Semrush error for ${url}:`, error.message);
        results.push(this.errorResult(this.cleanUrl(url)));
      }

      if (urls.length > 1) {
        await this.delay(250);
      }
    }

    return results;
  }

  cleanUrl(url) {
    return url
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  extractRootDomain(url) {
    const parts = url.replace(/\/.*$/, '').split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return url;
  }

  errorResult(url) {
    return {
      url,
      rootDomain: this.extractRootDomain(url),
      authorityScore: '',
      organicTraffic: '',
      organicKeywords: '',
      referringDomains: '',
      backlinks: '',
      status: 'Error',
      provider: 'semrush'
    };
  }

  noDataResult(url, rootDomain) {
    return {
      url,
      rootDomain,
      authorityScore: '',
      organicTraffic: '',
      organicKeywords: '',
      referringDomains: '',
      backlinks: '',
      status: 'No Data',
      provider: 'semrush'
    };
  }

  async fetchDomainData(domain) {
    const rootDomain = this.extractRootDomain(domain);

    // Fetch backlinks overview (Authority Score, Backlinks, Referring Domains)
    // and domain ranks (Organic Traffic, Organic Keywords) in parallel
    const [backlinksData, organicData] = await Promise.all([
      this.fetchBacklinksOverview(rootDomain).catch(err => {
        console.error(`Backlinks API error for ${rootDomain}:`, err.message);
        return null;
      }),
      this.fetchDomainRanks(rootDomain).catch(err => {
        console.error(`Domain ranks API error for ${rootDomain}:`, err.message);
        return null;
      })
    ]);

    if (!backlinksData && !organicData) {
      return this.noDataResult(domain, rootDomain);
    }

    return {
      url: domain,
      rootDomain,
      authorityScore: backlinksData?.authorityScore ?? '',
      organicTraffic: organicData?.organicTraffic ?? '',
      organicKeywords: organicData?.organicKeywords ?? '',
      referringDomains: backlinksData?.referringDomains ?? '',
      backlinks: backlinksData?.backlinks ?? '',
      status: (backlinksData || organicData) ? 'Success' : 'No Data',
      provider: 'semrush'
    };
  }

  async fetchBacklinksOverview(rootDomain) {
    const params = new URLSearchParams({
      type: 'backlinks_overview',
      key: this.apiKey,
      target: rootDomain,
      target_type: 'root_domain',
      export_columns: 'ascore,total,domains_num'
    });

    const response = await fetch(`${SEMRUSH_API_URL}analytics/v1/?${params}`);
    this.checkResponseStatus(response);

    const text = await response.text();
    const lines = text.trim().split('\n');

    if (lines.length < 2) return null;

    const values = lines[1].split(';');
    return {
      authorityScore: values[0] || '',
      backlinks: values[1] || '',
      referringDomains: values[2] || ''
    };
  }

  async fetchDomainRanks(rootDomain) {
    const params = new URLSearchParams({
      type: 'domain_ranks',
      key: this.apiKey,
      domain: rootDomain,
      export_columns: 'Or,Ot'
    });

    const response = await fetch(`${SEMRUSH_API_URL}?${params}`);
    this.checkResponseStatus(response);

    const text = await response.text();
    const lines = text.trim().split('\n');

    if (lines.length < 2) return null;

    // domain_ranks may return multiple rows (one per database/country)
    // First data row is typically the largest / global result
    const values = lines[1].split(';');
    return {
      organicKeywords: values[0] || '',
      organicTraffic: values[1] || ''
    };
  }

  checkResponseStatus(response) {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid Semrush API key');
      }
      if (response.status === 429) {
        throw new Error('Semrush API rate limit exceeded');
      }
      throw new Error(`Semrush API error: ${response.status}`);
    }
  }
}
