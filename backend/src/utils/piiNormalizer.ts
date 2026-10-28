import crypto from 'crypto';

/**
 * PIINormalizer
 *
 * Normalizes and hashes Personally Identifiable Information (PII) according to
 * Meta CAPI, Google Enhanced Conversions, TikTok Events API, and LinkedIn DMP standards.
 * Standard requirement: lowercase, stripped of whitespace, E.164 phone formats, SHA-256 hashed.
 */
export class PIINormalizer {
  /**
   * Generates a SHA-256 hash in lowercase hex
   */
  public static sha256(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return crypto.createHash('sha256').update(input.trim().toLowerCase(), 'utf8').digest('hex');
  }

  /**
   * Normalizes an email address: trimmed, lowercase
   */
  public static normalizeEmail(email?: string): string {
    if (!email || typeof email !== 'string') return '';
    return email.trim().toLowerCase();
  }

  /**
   * Hashes an email address with SHA-256 after normalization
   */
  public static hashEmail(email?: string): string {
    const normalized = this.normalizeEmail(email);
    if (!normalized) return '';
    return this.sha256(normalized);
  }

  /**
   * Normalizes a phone number to digits only, with optional international code
   * Removes parentheses, dashes, spaces, and leading plus sign for hashing
   */
  public static normalizePhone(phone?: string, defaultCountryCode = '1'): string {
    if (!phone || typeof phone !== 'string') return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (!cleaned) return '';

    // If national 10-digit number (e.g. US/Canada), prepend defaultCountryCode
    if (cleaned.length === 10) {
      cleaned = `${defaultCountryCode}${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Hashes a phone number with SHA-256 after normalization
   */
  public static hashPhone(phone?: string, defaultCountryCode = '1'): string {
    const normalized = this.normalizePhone(phone, defaultCountryCode);
    if (!normalized) return '';
    return this.sha256(normalized);
  }

  /**
   * Hashes names, cities, or zip codes
   */
  public static hashField(val?: string): string {
    if (!val || typeof val !== 'string') return '';
    const cleaned = val.trim().toLowerCase();
    return this.sha256(cleaned);
  }

  /**
   * Generates a deterministic or unique conversion deduplication event ID
   */
  public static generateEventId(prefix = 'evt', uniqueKey?: string): string {
    if (uniqueKey) {
      return `${prefix}_${this.sha256(uniqueKey).slice(0, 16)}`;
    }
    const rand = Math.random().toString(36).substring(2, 10);
    return `${prefix}_${Date.now()}_${rand}`;
  }
}

export default PIINormalizer;
