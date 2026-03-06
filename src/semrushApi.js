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
        results.push({
          url: this.cleanUrl(url),
          rootDomain: this.cleanUrl(url),
          authorityScore: 'N/A',
          referringDomains: 'N/A',
          backlinks: 'N/A',
          status: 'Error',
          provider: 'semrush'
        });
      }

      // Small delay to avoid rate limiting
      if (urls.length > 1) {
        await this.delay(200);
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

  async fetchDomainData(domain) {
    const rootDomain = this.extractRootDomain(domain);

    const params = new URLSearchParams({
      type: 'backlinks_overview',
      key: this.apiKey,
      target: rootDomain,
      target_type: 'root_domain',
      export_columns: 'ascore,total,domains_num'
    });

    const response = await fetch(`${SEMRUSH_API_URL}analytics/v1/?${params}`);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid Semrush API key');
      }
      if (response.status === 429) {
        throw new Error('Semrush API rate limit exceeded');
      }
      throw new Error(`Semrush API error: ${response.status}`);
    }

    const text = await response.text();
    return this.parseResponse(text, domain, rootDomain);
  }

  extractRootDomain(url) {
    const parts = url.replace(/\/.*$/, '').split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return url;
  }

  parseResponse(text, url, rootDomain) {
    const lines = text.trim().split('\n');

    // Semrush returns semicolon-separated data
    // First line is headers, second line is data
    if (lines.length < 2) {
      return {
        url,
        rootDomain,
        authorityScore: 'N/A',
        referringDomains: 'N/A',
        backlinks: 'N/A',
        status: 'No Data',
        provider: 'semrush'
      };
    }

    const values = lines[1].split(';');

    return {
      url,
      rootDomain,
      authorityScore: values[0] || 'N/A',
      referringDomains: values[2] || 'N/A',
      backlinks: values[1] || 'N/A',
      status: values[0] ? 'Success' : 'No Data',
      provider: 'semrush'
    };
  }
}
