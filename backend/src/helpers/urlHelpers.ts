// @ts-nocheck
const crypto = require('crypto');
const { customAlphabet } = require('nanoid');

class URLHelpers {
  constructor() {
    // Custom alphabet excluding confusing characters
    this.alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
    this.nanoid = customAlphabet(this.alphabet, 7);
  }

  /**
   * Generate various types of short codes
   * @param {string} type - Type of generation (nanoid, random, hash, sequential)
   * @param {number} length - Length of short code
   * @param {string} seed - Seed for hash-based generation
   * @returns {string} Generated short code
   */
  generateShortCode(type = 'nanoid', length = 7, seed = null) {
    switch (type.toLowerCase()) {
      case 'nanoid':
        return this.nanoid(length);
      
      case 'random':
        return this._generateRandomCode(length);
      
      case 'hash':
        return this._generateHashCode(seed || Date.now().toString(), length);
      
      case 'sequential':
        return this._generateSequentialCode(length);
      
      case 'pronounceable':
        return this._generatePronounceableCode(length);
      
      default:
        return this.nanoid(length);
    }
  }

  /**
   * Generate random short code
   * @param {number} length - Length of code
   * @returns {string} Random short code
   */
  _generateRandomCode(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.alphabet.charAt(Math.floor(Math.random() * this.alphabet.length));
    }
    return result;
  }

  /**
   * Generate hash-based short code
   * @param {string} input - Input to hash
   * @param {number} length - Length of code
   * @returns {string} Hash-based short code
   */
  _generateHashCode(input, length) {
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    let result = '';
    for (let i = 0; i < length; i++) {
      const charIndex = parseInt(hash.substring(i * 2, i * 2 + 2), 16) % this.alphabet.length;
      result += this.alphabet.charAt(charIndex);
    }
    return result;
  }

  /**
   * Generate sequential short code (for testing/demo)
   * @param {number} length - Length of code
   * @returns {string} Sequential short code
   */
  _generateSequentialCode(length) {
    const timestamp = Date.now();
    const base36 = timestamp.toString(36).toUpperCase();
    return base36.padStart(length, '0').substring(0, length);
  }

  /**
   * Generate pronounceable short code
   * @param {number} length - Length of code
   * @returns {string} Pronounceable short code
   */
  _generatePronounceableCode(length) {
    const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
    const vowels = 'AEIOU';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      if (i % 2 === 0) {
        result += consonants.charAt(Math.floor(Math.random() * consonants.length));
      } else {
        result += vowels.charAt(Math.floor(Math.random() * vowels.length));
      }
    }
    return result;
  }

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {object} Validation result
   */
  validateUrlFormat(url) {
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'URL is required and must be a string'
      };
    }

    // Basic URL pattern
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    
    try {
      // Try to create URL object
      let urlObj;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        urlObj = new URL(url);
      } else {
        urlObj = new URL('https://' + url);
      }

      // Additional validations
      if (!urlPattern.test(url) && !url.startsWith('http')) {
        return {
          isValid: false,
          error: 'Invalid URL format'
        };
      }

      return {
        isValid: true,
        normalizedUrl: urlObj.toString(),
        domain: urlObj.hostname,
        protocol: urlObj.protocol
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid URL format: ' + error.message
      };
    }
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL to extract domain from
   * @returns {string} Extracted domain
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
      // Fallback for URLs without protocol
      try {
        const urlObj = new URL('https://' + url);
        return urlObj.hostname.replace(/^www\./, '');
      } catch (fallbackError) {
        return '';
      }
    }
  }

  /**
   * Build tracking URL with UTM parameters
   * @param {string} baseUrl - Base URL
   * @param {object} utmParams - UTM parameters
   * @returns {string} URL with UTM parameters
   */
  buildTrackingUrl(baseUrl, utmParams = {}) {
    try {
      const urlObj = new URL(baseUrl);
      
      // Add UTM parameters
      const utmMapping = {
        source: 'utm_source',
        medium: 'utm_medium',
        campaign: 'utm_campaign',
        term: 'utm_term',
        content: 'utm_content'
      };

      Object.entries(utmMapping).forEach(([key, param]) => {
        if (utmParams[key]) {
          urlObj.searchParams.set(param, utmParams[key]);
        }
      });

      return urlObj.toString();
    } catch (error) {
      console.error('Error building tracking URL:', error);
      return baseUrl;
    }
  }

  /**
   * Sanitize URL by removing tracking parameters
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL
   */
  sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Remove common tracking parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
        'fbclid', 'gclid', 'msclkid', 'twclid', 'li_fat_id',
        '_ga', '_gl', '_gac', 'mc_cid', 'mc_eid',
        'ref', 'referrer', 'source', 'campaign'
      ];
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });

      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  /**
   * Basic URL safety check
   * @param {string} url - URL to check
   * @returns {object} Safety check result
   */
  checkUrlSafety(url) {
    const maliciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.com$/i,
      /\.pif$/i
    ];

    // Check for malicious patterns
    for (const pattern of maliciousPatterns) {
      if (pattern.test(url)) {
        return {
          isSafe: false,
          reason: 'URL contains potentially malicious content',
          pattern: pattern.toString()
        };
      }
    }

    // Check for suspicious domains
    const suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
      'buff.ly', 'bitly.com', 'short.link', 'tiny.cc',
      'is.gd', 'v.gd', 'tr.im', 'url.ie', 'tiny.pl'
    ];

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      if (suspiciousDomains.includes(domain)) {
        return {
          isSafe: false,
          reason: 'URL uses a URL shortening service',
          domain: domain
        };
      }
    } catch (error) {
      return {
        isSafe: false,
        reason: 'Invalid URL format'
      };
    }

    return {
      isSafe: true,
      reason: 'URL appears to be safe'
    };
  }

  /**
   * Normalize URL for consistency
   * @param {string} url - URL to normalize
   * @returns {string} Normalized URL
   */
  normalizeUrl(url) {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      
      // Remove www prefix
      urlObj.hostname = urlObj.hostname.replace(/^www\./, '');
      
      // Remove trailing slash
      if (urlObj.pathname === '/') {
        urlObj.pathname = '';
      }
      
      // Sort query parameters for consistency
      urlObj.searchParams.sort();
      
      // Remove fragment identifier
      urlObj.hash = '';
      
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  /**
   * Extract metadata from URL
   * @param {string} url - URL to extract metadata from
   * @returns {object} Extracted metadata
   */
  extractMetadata(url) {
    try {
      const urlObj = new URL(url);
      
      return {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        port: urlObj.port,
        pathname: urlObj.pathname,
        search: urlObj.search,
        hash: urlObj.hash,
        origin: urlObj.origin,
        domain: this.extractDomain(url),
        subdomain: this.extractSubdomain(urlObj.hostname),
        tld: this.extractTLD(urlObj.hostname),
        pathSegments: urlObj.pathname.split('/').filter(segment => segment),
        queryParams: Object.fromEntries(urlObj.searchParams)
      };
    } catch (error) {
      return {
        error: 'Failed to extract metadata: ' + error.message
      };
    }
  }

  /**
   * Extract subdomain from hostname
   * @param {string} hostname - Hostname
   * @returns {string} Subdomain
   */
  extractSubdomain(hostname) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(0, -2).join('.');
    }
    return '';
  }

  /**
   * Extract top-level domain
   * @param {string} hostname - Hostname
   * @returns {string} TLD
   */
  extractTLD(hostname) {
    const parts = hostname.split('.');
    return parts[parts.length - 1];
  }

  /**
   * Generate URL variations for testing
   * @param {string} baseUrl - Base URL
   * @returns {array} Array of URL variations
   */
  generateUrlVariations(baseUrl) {
    const variations = [];
    
    try {
      const urlObj = new URL(baseUrl);
      
      // Protocol variations
      variations.push(baseUrl);
      if (urlObj.protocol === 'https:') {
        variations.push(baseUrl.replace('https:', 'http:'));
      } else {
        variations.push(baseUrl.replace('http:', 'https:'));
      }
      
      // WWW variations
      if (urlObj.hostname.startsWith('www.')) {
        const noWww = baseUrl.replace('www.', '');
        variations.push(noWww);
      } else {
        const withWww = baseUrl.replace('://', '://www.');
        variations.push(withWww);
      }
      
      // Trailing slash variations
      if (urlObj.pathname === '' || urlObj.pathname === '/') {
        const withSlash = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        const withoutSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        variations.push(withSlash, withoutSlash);
      }
      
    } catch (error) {
      console.error('Error generating URL variations:', error);
    }
    
    return [...new Set(variations)]; // Remove duplicates
  }

  /**
   * Validate short code format
   * @param {string} shortCode - Short code to validate
   * @returns {object} Validation result
   */
  validateShortCodeFormat(shortCode) {
    if (!shortCode || typeof shortCode !== 'string') {
      return {
        isValid: false,
        error: 'Short code is required and must be a string'
      };
    }

    // Length check
    if (shortCode.length < 3 || shortCode.length > 50) {
      return {
        isValid: false,
        error: 'Short code must be between 3 and 50 characters'
      };
    }

    // Character validation (alphanumeric, dash, underscore)
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(shortCode)) {
      return {
        isValid: false,
        error: 'Short code can only contain letters, numbers, hyphens, and underscores'
      };
    }

    // Reserved words check
    const reservedWords = [
      'api', 'admin', 'www', 'mail', 'ftp', 'localhost', 'test',
      'dev', 'staging', 'prod', 'app', 'help', 'support', 'blog',
      'news', 'about', 'contact', 'privacy', 'terms', 'legal'
    ];

    if (reservedWords.includes(shortCode.toLowerCase())) {
      return {
        isValid: false,
        error: 'Short code cannot use reserved words'
      };
    }

    return {
      isValid: true,
      normalizedCode: shortCode.toLowerCase()
    };
  }

  /**
   * Estimate short code collision probability
   * @param {number} length - Short code length
   * @param {number} existing - Number of existing codes
   * @returns {object} Collision probability data
   */
  estimateCollisionProbability(length, existing = 0) {
    const alphabetSize = this.alphabet.length;
    const totalPossible = Math.pow(alphabetSize, length);
    const probability = existing / totalPossible;
    
    return {
      totalPossible,
      existing,
      probability: probability * 100,
      safetyMargin: totalPossible * 0.1, // 10% safety margin
      recommendedLength: probability > 0.01 ? length + 1 : length
    };
  }
}

module.exports = new URLHelpers();
