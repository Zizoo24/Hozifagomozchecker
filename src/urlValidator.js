export class UrlValidator {
  static parseUrls(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const lines = text.split('\n');
    const urls = [];

    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        urls.push(trimmed);
      }
    }

    return urls;
  }

  static removeDuplicates(urls) {
    const normalized = urls.map(url => this.normalizeUrl(url));
    const uniqueUrls = [...new Set(normalized)];
    return uniqueUrls;
  }

  static normalizeUrl(url) {
    return url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }

  static validateUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const trimmed = url.trim();
    if (!trimmed) {
      return false;
    }

    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    return urlPattern.test(trimmed);
  }

  static validateUrls(urls) {
    const valid = [];
    const invalid = [];

    urls.forEach((url, index) => {
      if (this.validateUrl(url)) {
        valid.push(url);
      } else {
        invalid.push({ url, line: index + 1 });
      }
    });

    return { valid, invalid };
  }

  static processInput(text) {
    const urls = this.parseUrls(text);

    if (urls.length === 0) {
      return {
        success: false,
        error: 'No URLs found. Please enter at least one URL.'
      };
    }

    const { valid, invalid } = this.validateUrls(urls);

    if (valid.length === 0) {
      return {
        success: false,
        error: 'No valid URLs found. Please check your input.'
      };
    }

    const uniqueUrls = this.removeDuplicates(valid);

    return {
      success: true,
      urls: uniqueUrls,
      stats: {
        total: urls.length,
        valid: valid.length,
        invalid: invalid.length,
        duplicates: valid.length - uniqueUrls.length,
        unique: uniqueUrls.length
      },
      invalidUrls: invalid
    };
  }
}
