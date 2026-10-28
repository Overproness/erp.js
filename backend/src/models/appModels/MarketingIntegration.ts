import mongoose from 'mongoose';
import { TokenVaultService, EncryptedPayload } from '@/utils/tokenVault';

export interface IMarketingIntegrationDocument extends mongoose.Document {
  owner: mongoose.Types.ObjectId;
  platform: 'facebook' | 'instagram' | 'google' | 'linkedin' | 'tiktok' | 'twitter' | 'trustpilot' | 'yelp';
  status: 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'ERROR' | 'SANDBOX_MOCK';
  mode: 'LIVE' | 'SANDBOX_MOCK';
  accountName?: string;
  encryptedCredentials?: EncryptedPayload;
  maskedConfig: Record<string, string>;
  lastTestedAt?: Date;
  lastSyncAt?: Date;
  lastErrorMessage?: string;
  metadata?: Record<string, any>;
  setCredentials(credentials: Record<string, any>): void;
  getDecryptedCredentials<T = Record<string, any>>(): T | null;
}

const marketingIntegrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyOwner',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['facebook', 'instagram', 'google', 'linkedin', 'tiktok', 'twitter', 'trustpilot', 'yelp'],
      index: true,
    },
    status: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED', 'EXPIRED', 'ERROR', 'SANDBOX_MOCK'],
      default: 'DISCONNECTED',
    },
    mode: {
      type: String,
      enum: ['LIVE', 'SANDBOX_MOCK'],
      default: 'SANDBOX_MOCK',
    },
    accountName: {
      type: String,
      default: '',
    },
    encryptedCredentials: {
      encryptedData: String,
      iv: String,
      authTag: String,
    },
    maskedConfig: {
      type: Map,
      of: String,
      default: {},
    },
    lastTestedAt: Date,
    lastSyncAt: Date,
    lastErrorMessage: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    removed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique platform per owner
marketingIntegrationSchema.index({ owner: 1, platform: 1, removed: 1 }, { unique: true });

// Instance method to encrypt and store credentials while auto-extracting masked identifiers
marketingIntegrationSchema.methods.setCredentials = function (credentials: Record<string, any>) {
  if (!credentials || typeof credentials !== 'object') return;

  // Encrypt the full credentials payload
  this.encryptedCredentials = TokenVaultService.encryptObject(credentials);

  // Extract public or masked identifiers into maskedConfig
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(credentials)) {
    if (typeof value === 'string') {
      if (
        key.toLowerCase().includes('id') ||
        key.toLowerCase().includes('buid') ||
        key.toLowerCase().includes('account') ||
        key.toLowerCase().includes('pixel')
      ) {
        // IDs are public identifiers
        masked[key] = value;
      } else {
        // Secrets, tokens, and keys are masked
        masked[key] = TokenVaultService.maskSecret(value);
      }
    }
  }

  this.maskedConfig = masked;
};

// Instance method to decrypt credentials for authorized provider calls
marketingIntegrationSchema.methods.getDecryptedCredentials = function <T = Record<string, any>>(): T | null {
  if (!this.encryptedCredentials || !this.encryptedCredentials.encryptedData) {
    return null;
  }
  return TokenVaultService.decryptObject<T>(this.encryptedCredentials);
};

const MarketingIntegration =
  mongoose.models.MarketingIntegration ||
  mongoose.model<IMarketingIntegrationDocument>('MarketingIntegration', marketingIntegrationSchema);

export { MarketingIntegration };
export default MarketingIntegration;
