const crypto = require('crypto');
const QRCode = require('qrcode');
const axios = require('axios');
const cheerio = require('cheerio');

class URLUtils {
  constructor() {
    this.shortCodeChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    this.safeChars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  }

  /**
   * Generate different types of short codes
   * @param {string} type - Type of short code algorithm
   * @param {number} length - Length of short code
   * @param {string} seed - Optional seed for generation
   * @returns {string} Generated short code
   */
  shortCodeGenerator(type = 'random', length = 7, seed = null) {
    switch (type.toLowerCase()) {
      case 'random':
        return this._generateRandomCode(length);
      case 'sequential':
        return this._generateSequentialCode(length);
      case 'hash':
        return this._generateHashCode(seed || Date.now().toString(), length);
      case 'pronounceable':
        return this._generatePronounceableCode(length);
      case 'timestamp':
        return this._generateTimestampCode(length);
      case 'safe':
        return this._generateSafeCode(length);
      default:
        return this._generateRandomCode(length);
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
      result += this.shortCodeChars.charAt(Math.floor(Math.random() * this.shortCodeChars.length));
    }
    return result;
  }

  /**
   * Generate sequential short code based on timestamp
   * @param {number} length - Length of code
   * @returns {string} Sequential short code
   */
  _generateSequentialCode(length) {
    const timestamp = Date.now();
    const base36 = timestamp.toString(36).toUpperCase();
    return base36.padStart(length, '0').substring(0, length);
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
      const charIndex = parseInt(hash.substring(i * 2, i * 2 + 2), 16) % this.shortCodeChars.length;
      result += this.shortCodeChars.charAt(charIndex);
    }
    return result;
  }

  /**
   * Generate pronounceable short code
   * @param {number} length - Length of code
   * @returns {string} Pronounceable short code
   */
  _generatePronounceableCode(length) {
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const vowels = 'aeiou';
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
   * Generate timestamp-based short code
   * @param {number} length - Length of code
   * @returns {string} Timestamp-based short code
   */
  _generateTimestampCode(length) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const combined = timestamp.toString(36) + random;
    return combined.substring(0, length).toUpperCase();
  }

  /**
   * Generate safe short code (avoiding confusing characters)
   * @param {number} length - Length of code
   * @returns {string} Safe short code
   */
  _generateSafeCode(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += this.safeChars.charAt(Math.floor(Math.random() * this.safeChars.length));
    }
    return result;
  }

  /**
   * Generate QR code for URL
   * @param {string} url - URL to encode
   * @param {object} options - QR code options
   * @returns {Promise<string>} Base64 encoded QR code
   */
  async qrCodeGenerator(url, options = {}) {
    const defaultOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: options.size || 200,
      errorCorrectionLevel: options.errorCorrectionLevel || 'M'
    };

    try {
      const qrOptions = { ...defaultOptions, ...options };
      
      if (options.format === 'svg') {
        return await QRCode.toString(url, { ...qrOptions, type: 'svg' });
      } else if (options.format === 'pdf') {
        // For PDF generation, you would need additional library like jsPDF
        const dataUrl = await QRCode.toDataURL(url, qrOptions);
        return dataUrl;
      } else {
        return await QRCode.toDataURL(url, qrOptions);
      }
    } catch (error) {
      throw new Error(`QR code generation failed: ${error.message}`);
    }
  }

  /**
   * Generate URL preview/metadata
   * @param {string} url - URL to preview
   * @returns {Promise<object>} URL preview data
   */
  async urlPreview(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxContentLength: 1024 * 1024, // 1MB limit
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; URLPreviewBot/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      
      const preview = {
        url: url,
        title: this._extractTitle($),
        description: this._extractDescription($),
        image: this._extractImage($, url),
        siteName: this._extractSiteName($),
        favicon: this._extractFavicon($, url),
        type: this._extractType($),
        publishedTime: this._extractPublishedTime($),
        author: this._extractAuthor($),
        keywords: this._extractKeywords($),
        language: this._extractLanguage($),
        contentLength: response.data.length,
        contentType: response.headers['content-type'],
        statusCode: response.status,
        extractedAt: new Date()
      };

      return preview;
    } catch (error) {
      return {
        url: url,
        title: this._extractDomainFromUrl(url),
        description: 'Unable to fetch URL preview',
        error: error.message,
        extractedAt: new Date()
      };
    }
  }

  /**
   * Extract title from HTML
   * @param {object} $ - Cheerio instance
   * @returns {string} Extracted title
   */
  _extractTitle($) {
    return $('meta[property="og:title"]').attr('content') ||
           $('meta[name="twitter:title"]').attr('content') ||
           $('title').text() ||
           $('h1').first().text() ||
           'Untitled';
  }

  /**
   * Extract description from HTML
   * @param {object} $ - Cheerio instance
   * @returns {string} Extracted description
   */
  _extractDescription($) {
    return $('meta[property="og:description"]').attr('content') ||
           $('meta[name="twitter:description"]').attr('content') ||
           $('meta[name="description"]').attr('content') ||
           $('p').first().text().substring(0, 200) ||
           '';
  }

  /**
   * Extract image from HTML
   * @param {object} $ - Cheerio instance
   * @param {string} baseUrl - Base URL for relative images
   * @returns {string} Extracted image URL
   */
  _extractImage($, baseUrl) {
    let imageUrl = $('meta[property="og:image"]').attr('content') ||
                   $('meta[name="twitter:image"]').attr('content') ||
                   $('img').first().attr('src');

    if (imageUrl && !imageUrl.startsWith('http')) {
      // Convert relative URL to absolute
      try {
        imageUrl = new URL(imageUrl, baseUrl).href;
      } catch (error) {
        imageUrl = null;
      }
    }

    return imageUrl;
  }

  /**
   * Extract site name from HTML
   * @param {object} $ - Cheerio instance
   * @returns {string} Extracted site name
   */
  _extractSiteName($) {
    return $('meta[property="og:site_name"]').attr('content') ||
           $('meta[name="application-name"]').attr('content') ||
           '';
  }

  /**
   * Extract favicon from HTML
   * @param {object} $ - Cheerio instance
   * @param {string} baseUrl - Base URL for relative favicon
   * @returns {string} Extracted favicon URL
   */
  _extractFavicon($, baseUrl) {
    let faviconUrl = $('link[rel="icon"]').attr('href') ||
                     $('link[rel="shortcut icon"]').attr('href') ||
                     $('link[rel="apple-touch-icon"]').attr('href');

    if (faviconUrl && !faviconUrl.startsWith('http')) {
      try {
        faviconUrl = new URL(faviconUrl, baseUrl).href;
      } catch (error) {
        // Fallback to default favicon location
        try {
          faviconUrl = new URL('/favicon.ico', baseUrl).href;
        } catch (fallbackError) {
          faviconUrl = null;
        }
      }
    }

    return faviconUrl;
  }

  /**
   * Extract content type from HTML
   * @param {object} $ - Cheerio instance
   * @returns {string} Extracted content type
   */
  _extractType($) {
    return $('meta[property="og:type"]').attr('content') ||
           $('meta[name="twitter:card"]').attr('content') ||
           'website';
  }

  /**
   * Extract published time from HTML
   * @param {object} $ - Cheerio instance
   * @returns {string} Extracted published time
   */
  _extractPublishedTime($) {
    return $('meta[property="article:published_time"]').attr('content') ||
           $('meta[name="pubdate"]').attr('content') ||
           $('time').attr('datetime') ||
           '';
  }

  /**
   * Extract author from HTML
   * @param {object} $ - Cheerio instance
   * @returns {string} Extracted author
   */
  _extractAuthor($) {
    return $('meta[property="article:author"]').attr('content') ||
           $('meta[name="author"]').attr('content') ||
           $('meta[name="twitter:creator"]').attr('content') ||
           '';
  }

  /**
   * Extract keywords from HTML
   * @param {object} $ - Cheerio instance
   * @returns {array} Extracted keywords
   */
  _extractKeywords($) {
    const keywords = $('meta[name="keywords"]').attr('content');
    return keywords ? keywords.split(',').map(k => k.trim()) : [];
  }

  /**
   * Extract language from HTML
   * @param {object} $ - Cheerio instance
   * @returns {string} Extracted language
   */
  _extractLanguage($) {
    return $('html').attr('lang') ||
           $('meta[http-equiv="content-language"]').attr('content') ||
           'en';
  }

  /**
   * Extract domain from URL
   * @param {string} url - URL
   * @returns {string} Domain name
   */
  _extractDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
      return 'Unknown Domain';
    }
  }

  /**
   * Extract metadata from URLs in bulk
   * @param {array} urls - Array of URLs
   * @param {object} options - Processing options
   * @returns {Promise<array>} Array of metadata objects
   */
  async metaDataExtractor(urls, options = {}) {
    const { concurrency = 5, timeout = 10000 } = options;
    const results = [];
    
    // Process URLs in batches to avoid overwhelming the target servers
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(url => 
        this.urlPreview(url).catch(error => ({
          url,
          error: error.message,
          extractedAt: new Date()
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + concurrency < urls.length) {
        await this._delay(1000);
      }
    }
    
    return results;
  }

  /**
   * Generate link preview card data
   * @param {string} url - URL to generate preview for
   * @param {object} options - Preview options
   * @returns {Promise<object>} Link preview card data
   */
  async linkPreview(url, options = {}) {
    const metadata = await this.urlPreview(url);
    
    return {
      url: metadata.url,
      title: metadata.title,
      description: this._truncateText(metadata.description, options.descriptionLength || 150),
      image: metadata.image,
      siteName: metadata.siteName,
      favicon: metadata.favicon,
      domain: this._extractDomainFromUrl(url),
      publishedTime: metadata.publishedTime,
      author: metadata.author,
      readingTime: this._estimateReadingTime(metadata.description),
      cardType: this._determineCardType(metadata),
      accessibility: {
        altText: metadata.title,
        ariaLabel: `Link to ${metadata.siteName || this._extractDomainFromUrl(url)}`
      }
    };
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @returns {string} Truncated text
   */
  _truncateText(text, length) {
    if (!text || text.length <= length) return text;
    return text.substring(0, length).replace(/\s+\S*$/, '') + '...';
  }

  /**
   * Estimate reading time for text
   * @param {string} text - Text to analyze
   * @returns {number} Estimated reading time in minutes
   */
  _estimateReadingTime(text) {
    if (!text) return 0;
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Determine card type based on metadata
   * @param {object} metadata - URL metadata
   * @returns {string} Card type
   */
  _determineCardType(metadata) {
    if (metadata.image) {
      return 'summary_large_image';
    } else if (metadata.description && metadata.description.length > 100) {
      return 'summary';
    } else {
      return 'simple';
    }
  }

  /**
   * Delay execution for specified time
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate URL accessibility
   * @param {string} url - URL to validate
   * @returns {Promise<object>} Accessibility validation result
   */
  async validateUrlAccessibility(url) {
    try {
      const startTime = Date.now();
      const response = await axios.head(url, {
        timeout: 10000,
        validateStatus: status => status < 500
      });
      const responseTime = Date.now() - startTime;

      return {
        url,
        accessible: response.status >= 200 && response.status < 400,
        statusCode: response.status,
        responseTime,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        lastModified: response.headers['last-modified'],
        redirected: response.request._redirectable._redirectCount > 0,
        finalUrl: response.request.res.responseUrl || url,
        checkedAt: new Date()
      };
    } catch (error) {
      return {
        url,
        accessible: false,
        error: error.message,
        responseTime: null,
        statusCode: error.response?.status || null,
        checkedAt: new Date()
      };
    }
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
        const noWww = baseUrl.replace('://www.', '://');
        variations.push(noWww);
      } else {
        const withWww = baseUrl.replace('://', '://www.');
        variations.push(withWww);
      }
      
      // Trailing slash variations
      if (urlObj.pathname === '/' || urlObj.pathname === '') {
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
      
      // Remove default ports
      if ((urlObj.protocol === 'https:' && urlObj.port === '443') ||
          (urlObj.protocol === 'http:' && urlObj.port === '80')) {
        urlObj.port = '';
      }
      
      // Remove trailing slash for root path
      if (urlObj.pathname === '/') {
        urlObj.pathname = '';
      }
      
      // Sort query parameters for consistency
      urlObj.searchParams.sort();
      
      // Remove fragment identifier
      urlObj.hash = '';
      
      // Convert to lowercase (except path)
      urlObj.hostname = urlObj.hostname.toLowerCase();
      urlObj.protocol = urlObj.protocol.toLowerCase();
      
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }
}

module.exports = new URLUtils();
