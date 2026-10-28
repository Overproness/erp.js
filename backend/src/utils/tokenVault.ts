import crypto from 'crypto';

export interface EncryptedPayload {
  encryptedData: string;
  iv: string;
  authTag: string;
}

/**
 * TokenVaultService
 * Provides AES-256-GCM envelope encryption and decryption for third-party OAuth tokens,
 * API keys, and client secrets across all marketing platform integrations.
 */
export class TokenVaultService {
  private static algorithm = 'aes-256-gcm';
  private static ivLength = 12; // 96 bits for GCM
  private static salt = 'erpjs-marketing-vault-salt-2026';

  /**
   * Retrieves or derives a 32-byte cryptographic key from the environment
   */
  private static getMasterKey(): Buffer {
    const rawKey =
      process.env.VAULT_ENCRYPTION_KEY ||
      process.env.JWT_SECRET ||
      process.env.SECRET ||
      'erpjs-default-fallback-master-key-must-be-replaced-in-prod';

    // If already a valid 32-byte hex string (64 chars), use directly
    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      return Buffer.from(rawKey, 'hex');
    }

    // Otherwise derive a deterministic 32-byte key using scrypt
    return crypto.scryptSync(rawKey, this.salt, 32);
  }

  /**
   * Encrypts plaintext string using AES-256-GCM
   */
  public static encrypt(plainText: string): EncryptedPayload {
    if (!plainText || typeof plainText !== 'string') {
      throw new Error('TokenVault: plainText must be a non-empty string');
    }

    const key = this.getMasterKey();
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypts an EncryptedPayload back into plaintext UTF-8
   */
  public static decrypt(payload: EncryptedPayload): string {
    if (!payload || !payload.encryptedData || !payload.iv || !payload.authTag) {
      throw new Error('TokenVault: payload must contain encryptedData, iv, and authTag');
    }

    const key = this.getMasterKey();
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Encrypts an arbitrary object (credentials record) into an EncryptedPayload
   */
  public static encryptObject(obj: Record<string, any>): EncryptedPayload {
    const jsonString = JSON.stringify(obj || {});
    return this.encrypt(jsonString);
  }

  /**
   * Decrypts an EncryptedPayload back into an object
   */
  public static decryptObject<T = Record<string, any>>(payload: EncryptedPayload): T {
    const jsonString = this.decrypt(payload);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Safely masks a sensitive token or key for display in UI/API responses
   * e.g., "EAAB...3F4D" or "sk_live_...9a12"
   */
  public static maskSecret(secret?: string): string {
    if (!secret || typeof secret !== 'string') return '';
    if (secret.length <= 8) return '••••••••';
    const start = secret.slice(0, 4);
    const end = secret.slice(-4);
    return `${start}••••••••${end}`;
  }
}

export default TokenVaultService;
