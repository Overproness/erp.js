// @ts-nocheck
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const validator = require('validator');

class SecurityUtils {
  constructor() {
    // Malicious URL patterns
    this.maliciousPatterns = [
      // Protocol-based attacks
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
      
      // Executable file extensions
      /\.(exe|bat|cmd|com|scr|vbs|js|jar|app|dmg|pkg)$/i,
      
      // Suspicious domains
      /bit\.ly/i,
      /tinyurl\.com/i,
      /t\.co/i,
      
      // Phishing indicators
      /paypal.*verification/i,
      /bank.*security/i,
      /account.*suspended/i,
      /click.*here.*now/i,
      /urgent.*action.*required/i,
      
      // Malware indicators
      /download.*codec/i,
      /flash.*player.*update/i,
      /antivirus.*scan/i,
      
      // Social engineering
      /you.*won/i,
      /congratulations.*winner/i,
      /claim.*prize/i,
      /limited.*time.*offer/i
    ];

    // Suspicious domains list
    this.suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
      'buff.ly', 'bitly.com', 'short.link', 'tiny.cc',
      'is.gd', 'v.gd', 'tr.im', 'url.ie', 'tiny.pl',
      '0x0.st', 'git.io', 'rebrand.ly', 'cutt.ly'
    ];

    // Known malicious IP ranges (simplified)
    this.maliciousIPRanges = [
      '127.0.0.0/8',
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16'
    ];

    // Rate limiting storage (use Redis in production)
    this.rateLimitStore = new Map();

    // Password strength requirements
    this.passwordRequirements = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      forbiddenPatterns: ['password', '123456', 'qwerty']
    };
  }

  /**
   * Check if URL is malicious
   * @param {string} url - URL to check
   * @returns {object} Security check result
   */
  checkMaliciousUrl(url) {
    if (!url || typeof url !== 'string') {
      return {
        isSafe: false,
        risk: 'high',
        reason: 'Invalid URL format',
        details: 'URL is empty or not a string'
      };
    }

    try {
      // Basic URL validation
      if (!validator.isURL(url, { 
        protocols: ['http', 'https'],
        require_protocol: true
      })) {
        return {
          isSafe: false,
          risk: 'high',
          reason: 'Invalid URL format',
          details: 'URL does not match valid format'
        };
      }

      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const fullUrl = url.toLowerCase();

      // Check for malicious patterns
      for (const pattern of this.maliciousPatterns) {
        if (pattern.test(fullUrl)) {
          return {
            isSafe: false,
            risk: 'high',
            reason: 'Malicious pattern detected',
            details: `Pattern matched: ${pattern.toString()}`,
            pattern: pattern.toString()
          };
        }
      }

      // Check suspicious domains
      if (this.suspiciousDomains.includes(domain)) {
        return {
          isSafe: false,
          risk: 'medium',
          reason: 'Suspicious domain',
          details: `Domain ${domain} is known for URL shortening`,
          domain
        };
      }

      // Check for homograph attacks (simplified)
      if (this._detectHomographAttack(domain)) {
        return {
          isSafe: false,
          risk: 'high',
          reason: 'Possible homograph attack',
          details: 'Domain contains suspicious Unicode characters',
          domain
        };
      }

      // Check for excessive redirects or suspicious paths
      const pathCheck = this._checkSuspiciousPath(urlObj.pathname);
      if (!pathCheck.isSafe) {
        return {
          isSafe: false,
          risk: pathCheck.risk,
          reason: pathCheck.reason,
          details: pathCheck.details
        };
      }

      // Check for data exfiltration patterns
      const queryCheck = this._checkSuspiciousQuery(urlObj.search);
      if (!queryCheck.isSafe) {
        return {
          isSafe: false,
          risk: queryCheck.risk,
          reason: queryCheck.reason,
          details: queryCheck.details
        };
      }

      return {
        isSafe: true,
        risk: 'low',
        reason: 'URL appears safe',
        details: 'Passed all security checks'
      };

    } catch (error) {
      return {
        isSafe: false,
        risk: 'high',
        reason: 'URL parsing error',
        details: error.message
      };
    }
  }

  /**
   * Detect homograph attacks
   * @param {string} domain - Domain to check
   * @returns {boolean} True if suspicious
   */
  _detectHomographAttack(domain) {
    // Check for mixed scripts
    const scripts = [];
    for (const char of domain) {
      const code = char.charCodeAt(0);
      
      if (code >= 0x0000 && code <= 0x007F) scripts.push('latin');
      else if (code >= 0x0400 && code <= 0x04FF) scripts.push('cyrillic');
      else if (code >= 0x0370 && code <= 0x03FF) scripts.push('greek');
      else if (code >= 0x0590 && code <= 0x05FF) scripts.push('hebrew');
      else if (code >= 0x0600 && code <= 0x06FF) scripts.push('arabic');
    }

    // More than one script type is suspicious
    return new Set(scripts).size > 1;
  }

  /**
   * Check for suspicious URL paths
   * @param {string} pathname - URL pathname
   * @returns {object} Check result
   */
  _checkSuspiciousPath(pathname) {
    const suspiciousPaths = [
      /\/admin/i,
      /\/login/i,
      /\/wp-admin/i,
      /\/phpmyadmin/i,
      /\/\.env/i,
      /\/config/i,
      /\/backup/i,
      /\/download\.php/i,
      /\/shell/i,
      /\/cmd/i
    ];

    for (const pattern of suspiciousPaths) {
      if (pattern.test(pathname)) {
        return {
          isSafe: false,
          risk: 'medium',
          reason: 'Suspicious path detected',
          details: `Path matches suspicious pattern: ${pattern.toString()}`
        };
      }
    }

    // Check for extremely long paths (possible buffer overflow)
    if (pathname.length > 1000) {
      return {
        isSafe: false,
        risk: 'medium',
        reason: 'Suspiciously long path',
        details: `Path length: ${pathname.length} characters`
      };
    }

    return { isSafe: true };
  }

  /**
   * Check for suspicious query parameters
   * @param {string} search - URL search string
   * @returns {object} Check result
   */
  _checkSuspiciousQuery(search) {
    if (!search) return { isSafe: true };

    const suspiciousParams = [
      /cmd=/i,
      /exec=/i,
      /eval=/i,
      /system=/i,
      /shell=/i,
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i
    ];

    for (const pattern of suspiciousParams) {
      if (pattern.test(search)) {
        return {
          isSafe: false,
          risk: 'high',
          reason: 'Malicious query parameters',
          details: `Query contains suspicious pattern: ${pattern.toString()}`
        };
      }
    }

    return { isSafe: true };
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @param {object} options - Validation options
   * @returns {object} Validation result
   */
  validatePassword(password, options = {}) {
    const requirements = { ...this.passwordRequirements, ...options };
    const issues = [];
    let score = 0;

    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        score: 0,
        strength: 'invalid',
        issues: ['Password is required and must be a string']
      };
    }

    // Length checks
    if (password.length < requirements.minLength) {
      issues.push(`Password must be at least ${requirements.minLength} characters`);
    } else if (password.length >= requirements.minLength) {
      score += 10;
    }

    if (password.length > requirements.maxLength) {
      issues.push(`Password must not exceed ${requirements.maxLength} characters`);
    }

    // Character type checks
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 10;
    }

    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 10;
    }

    if (requirements.requireNumbers && !/\d/.test(password)) {
      issues.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 10;
    }

    if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 15;
    }

    // Check for forbidden patterns
    const lowerPassword = password.toLowerCase();
    for (const pattern of requirements.forbiddenPatterns) {
      if (lowerPassword.includes(pattern)) {
        issues.push(`Password cannot contain common pattern: ${pattern}`);
        score -= 20;
      }
    }

    // Additional complexity checks
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 5;
    
    // Check for character variety
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.6) score += 10;

    // Check for patterns
    if (!/(.)\1{2,}/.test(password)) score += 5; // No three consecutive same chars
    if (!/012|123|234|345|456|567|678|789|890|abc|bcd|cde/.test(lowerPassword)) score += 5;

    // Determine strength
    let strength = 'weak';
    if (score >= 60) strength = 'strong';
    else if (score >= 40) strength = 'medium';

    return {
      isValid: issues.length === 0,
      score: Math.max(0, Math.min(100, score)),
      strength,
      issues
    };
  }

  /**
   * Encrypt password for URL protection
   * @param {string} password - Password to encrypt
   * @returns {Promise<string>} Encrypted password
   */
  async encryptPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify encrypted password
   * @param {string} password - Plain password
   * @param {string} hash - Encrypted password
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Check rate limit for IP/user
   * @param {string} identifier - IP address or user ID
   * @param {object} options - Rate limit options
   * @returns {object} Rate limit check result
   */
  rateLimitCheck(identifier, options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100,
      type = 'general'
    } = options;

    const key = `${type}:${identifier}`;
    const now = Date.now();
    
    if (!this.rateLimitStore.has(key)) {
      this.rateLimitStore.set(key, []);
    }

    const requests = this.rateLimitStore.get(key);
    
    // Remove old requests
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.min(...recentRequests) + windowMs,
        retryAfter: Math.min(...recentRequests) + windowMs - now
      };
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimitStore.set(key, recentRequests);

    return {
      allowed: true,
      remaining: maxRequests - recentRequests.length,
      resetTime: Math.min(...recentRequests) + windowMs,
      retryAfter: 0
    };
  }

  /**
   * Check if IP is in whitelist
   * @param {string} ipAddress - IP address to check
   * @param {array} whitelist - Array of allowed IPs/CIDR ranges
   * @returns {boolean} True if IP is allowed
   */
  ipWhitelist(ipAddress, whitelist = []) {
    if (!ipAddress || whitelist.length === 0) {
      return false;
    }

    for (const allowedIP of whitelist) {
      if (allowedIP.includes('/')) {
        // CIDR notation
        if (this._isIPInCIDR(ipAddress, allowedIP)) {
          return true;
        }
      } else {
        // Direct IP match
        if (ipAddress === allowedIP) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if IP is in CIDR range
   * @param {string} ip - IP address
   * @param {string} cidr - CIDR notation
   * @returns {boolean} True if IP is in range
   */
  _isIPInCIDR(ip, cidr) {
    // Simplified implementation - use ip-range-check library in production
    try {
      const [network, prefixLength] = cidr.split('/');
      const prefixLen = parseInt(prefixLength);
      
      // Convert IPs to integers for comparison
      const ipInt = this._ipToInt(ip);
      const networkInt = this._ipToInt(network);
      
      // Create subnet mask
      const mask = (-1 << (32 - prefixLen)) >>> 0;
      
      return (ipInt & mask) === (networkInt & mask);
    } catch (error) {
      console.error('Error checking CIDR:', error);
      return false;
    }
  }

  /**
   * Convert IP address to integer
   * @param {string} ip - IP address
   * @returns {number} IP as integer
   */
  _ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length
   * @returns {string} Random token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate CSRF token
   * @param {string} secret - Secret key
   * @param {string} sessionId - Session ID
   * @returns {string} CSRF token
   */
  generateCSRFToken(secret, sessionId) {
    const data = sessionId + Date.now();
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify CSRF token
   * @param {string} token - Token to verify
   * @param {string} secret - Secret key
   * @param {string} sessionId - Session ID
   * @param {number} maxAge - Maximum token age in ms
   * @returns {boolean} True if valid
   */
  verifyCSRFToken(token, secret, sessionId, maxAge = 3600000) {
    try {
      // Extract timestamp from token (simplified)
      const timestamp = parseInt(token.slice(-13), 16);
      const now = Date.now();
      
      if (now - timestamp > maxAge) {
        return false;
      }

      const expectedToken = this.generateCSRFToken(secret, sessionId);
      return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
    } catch (error) {
      return false;
    }
  }

  /**
   * Sanitize input to prevent XSS
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }

    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate and sanitize URL
   * @param {string} url - URL to validate
   * @param {object} options - Validation options
   * @returns {object} Validation result
   */
  validateAndSanitizeURL(url, options = {}) {
    const {
      allowedProtocols = ['http', 'https'],
      allowedDomains = [],
      blockPrivateIPs = true,
      maxLength = 2048
    } = options;

    // Basic validation
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        sanitized: null,
        errors: ['URL is required and must be a string']
      };
    }

    if (url.length > maxLength) {
      return {
        isValid: false,
        sanitized: null,
        errors: [`URL exceeds maximum length of ${maxLength} characters`]
      };
    }

    try {
      const urlObj = new URL(url);
      const errors = [];

      // Protocol validation
      if (!allowedProtocols.includes(urlObj.protocol.slice(0, -1))) {
        errors.push(`Protocol ${urlObj.protocol} is not allowed`);
      }

      // Domain validation
      if (allowedDomains.length > 0 && !allowedDomains.includes(urlObj.hostname)) {
        errors.push(`Domain ${urlObj.hostname} is not allowed`);
      }

      // Private IP validation
      if (blockPrivateIPs && this._isPrivateIP(urlObj.hostname)) {
        errors.push('Private IP addresses are not allowed');
      }

      // Security check
      const securityCheck = this.checkMaliciousUrl(url);
      if (!securityCheck.isSafe) {
        errors.push(`Security check failed: ${securityCheck.reason}`);
      }

      if (errors.length > 0) {
        return {
          isValid: false,
          sanitized: null,
          errors
        };
      }

      // Sanitize URL
      const sanitized = urlObj.toString();

      return {
        isValid: true,
        sanitized,
        errors: []
      };

    } catch (error) {
      return {
        isValid: false,
        sanitized: null,
        errors: ['Invalid URL format: ' + error.message]
      };
    }
  }

  /**
   * Check if hostname is a private IP
   * @param {string} hostname - Hostname to check
   * @returns {boolean} True if private IP
   */
  _isPrivateIP(hostname) {
    const privateRanges = [
      /^127\./,           // Loopback
      /^10\./,            // Private A
      /^172\.(1[6-9]|2[0-9]|3[01])\./,  // Private B
      /^192\.168\./,      // Private C
      /^169\.254\./,      // Link-local
      /^::1$/,            // IPv6 loopback
      /^fc00:/,           // IPv6 unique local
      /^fe80:/            // IPv6 link-local
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Generate security headers
   * @param {object} options - Header options
   * @returns {object} Security headers
   */
  generateSecurityHeaders(options = {}) {
    const {
      csp = "default-src 'self'",
      hsts = true,
      nosniff = true,
      frameOptions = 'DENY',
      xssProtection = true
    } = options;

    const headers = {};

    if (csp) {
      headers['Content-Security-Policy'] = csp;
    }

    if (hsts) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    if (nosniff) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    if (frameOptions) {
      headers['X-Frame-Options'] = frameOptions;
    }

    if (xssProtection) {
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

    return headers;
  }
}

module.exports = new SecurityUtils();
