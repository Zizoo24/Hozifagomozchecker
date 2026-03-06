const MOZ_API_URL = 'https://lsapi.seomoz.com/v2/url_metrics';

export class MozApiService {
  constructor(accessId, secretKey) {
    this.accessId = accessId;
    this.secretKey = secretKey;
  }

  getAuthHeader() {
    const credentials = `${this.accessId}:${this.secretKey}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    return `Basic ${base64Credentials}`;
  }

  async checkUrls(urls) {
    if (!this.accessId || !this.secretKey) {
      throw new Error('Moz API credentials not configured');
    }

    const cleanUrls = urls.map(url => this.cleanUrl(url));
    const batches = this.createBatches(cleanUrls, 50);
    const results = [];

    for (const batch of batches) {
      try {
        const batchResults = await this.processBatch(batch);
        results.push(...batchResults);
      } catch (error) {
        console.error('Batch processing error:', error);
        batch.forEach(url => {
          results.push({
            url,
            rootDomain: url,
            da: 'N/A',
            pa: 'N/A',
            spamScore: 'N/A',
            status: 'Error'
          });
        });
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

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  async processBatch(urls) {
    const headers = {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json'
    };

    const data = {
      targets: urls
    };

    try {
      const response = await fetch(MOZ_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Moz API credentials');
        }
        if (response.status === 429) {
          throw new Error('API rate limit exceeded');
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return this.parseResults(result, urls);
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  parseResults(apiResponse, requestedUrls) {
    const results = [];

    if (!apiResponse.results || !Array.isArray(apiResponse.results)) {
      requestedUrls.forEach(url => {
        results.push({
          url,
          rootDomain: url,
          da: 'N/A',
          pa: 'N/A',
          spamScore: 'N/A',
          status: 'Error'
        });
      });
      return results;
    }

    apiResponse.results.forEach((result, index) => {
      const url = requestedUrls[index] || 'Unknown';

      results.push({
        url,
        rootDomain: result.root_domain || url,
        da: result.domain_authority ?? 'N/A',
        pa: result.page_authority ?? 'N/A',
        spamScore: result.spam_score ?? 'N/A',
        status: result.domain_authority !== undefined ? 'Success' : 'No Data'
      });
    });

    return results;
  }
}
