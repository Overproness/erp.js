// @ts-nocheck
const mongoose = require('mongoose');

class URLTablesMigration {
  constructor() {
    this.migrationName = '001_create_url_tables';
    this.version = '1.0.0';
    this.description = 'Create URL management tables and indexes';
  }

  /**
   * Run the migration
   */
  async up() {
    try {
      console.log(`Running migration: ${this.migrationName}`);
      
      // Create URL Categories collection
      await this.createURLCategoriesCollection();
      
      // Create URLs collection
      await this.createURLsCollection();
      
      // Create URL Clicks collection
      await this.createURLClicksCollection();
      
      // Create AB Tests collection
      await this.createABTestsCollection();
      
      // Create indexes for all collections
      await this.createIndexes();
      
      // Create initial data
      await this.seedInitialData();
      
      console.log(`✅ Migration ${this.migrationName} completed successfully`);
      
      return {
        success: true,
        migrationName: this.migrationName,
        version: this.version,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`❌ Migration ${this.migrationName} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback the migration
   */
  async down() {
    try {
      console.log(`Rolling back migration: ${this.migrationName}`);
      
      // Drop collections in reverse order
      const collections = ['ab_tests', 'url_clicks', 'urls', 'url_categories'];
      
      for (const collectionName of collections) {
        try {
          await mongoose.connection.db.dropCollection(collectionName);
          console.log(`✅ Dropped collection: ${collectionName}`);
        } catch (error) {
          if (error.code === 26) { // NamespaceNotFound
            console.log(`⏭️  Collection ${collectionName} doesn't exist`);
          } else {
            throw error;
          }
        }
      }
      
      console.log(`✅ Migration ${this.migrationName} rolled back successfully`);
      
      return {
        success: true,
        migrationName: this.migrationName,
        action: 'rollback',
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`❌ Rollback ${this.migrationName} failed:`, error);
      throw error;
    }
  }

  /**
   * Create URL Categories collection
   */
  async createURLCategoriesCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('url_categories', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name', 'isActive'],
            properties: {
              name: {
                bsonType: 'string',
                description: 'Category name is required'
              },
              description: {
                bsonType: 'string'
              },
              color: {
                bsonType: 'string',
                pattern: '^#[0-9A-Fa-f]{6}$'
              },
              icon: {
                bsonType: 'string'
              },
              parentCategory: {
                bsonType: 'objectId'
              },
              sortOrder: {
                bsonType: 'int',
                minimum: 0
              },
              isActive: {
                bsonType: 'bool'
              },
              isDefault: {
                bsonType: 'bool'
              },
              createdAt: {
                bsonType: 'date'
              },
              updatedAt: {
                bsonType: 'date'
              }
            }
          }
        }
      });
      
      console.log('✅ Created url_categories collection');
    } catch (error) {
      if (error.code === 48) { // NamespaceExists
        console.log('⏭️  url_categories collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Create URLs collection
   */
  async createURLsCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('urls', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['originalUrl', 'shortCode', 'isActive', 'isPublic'],
            properties: {
              originalUrl: {
                bsonType: 'string',
                description: 'Original URL is required'
              },
              shortCode: {
                bsonType: 'string',
                description: 'Short code is required and must be unique'
              },
              title: {
                bsonType: 'string'
              },
              description: {
                bsonType: 'string'
              },
              customDomain: {
                bsonType: 'string'
              },
              isActive: {
                bsonType: 'bool'
              },
              isPublic: {
                bsonType: 'bool'
              },
              requiresAuth: {
                bsonType: 'bool'
              },
              passwordProtected: {
                bsonType: 'bool'
              },
              password: {
                bsonType: 'string'
              },
              expiresAt: {
                bsonType: 'date'
              },
              maxClicks: {
                bsonType: 'int',
                minimum: 0
              },
              totalClicks: {
                bsonType: 'int',
                minimum: 0
              },
              uniqueClicks: {
                bsonType: 'int',
                minimum: 0
              },
              lastClickedAt: {
                bsonType: 'date'
              },
              linkedModule: {
                bsonType: 'string'
              },
              linkedEntityId: {
                bsonType: 'string'
              },
              owner: {
                bsonType: 'objectId'
              },
              createdBy: {
                bsonType: 'objectId'
              },
              category: {
                bsonType: 'objectId'
              },
              tags: {
                bsonType: 'array',
                items: {
                  bsonType: 'string'
                }
              },
              // UTM Parameters
              utmSource: {
                bsonType: 'string'
              },
              utmMedium: {
                bsonType: 'string'
              },
              utmCampaign: {
                bsonType: 'string'
              },
              utmContent: {
                bsonType: 'string'
              },
              utmTerm: {
                bsonType: 'string'
              },
              // Security
              allowedUsers: {
                bsonType: 'array',
                items: {
                  bsonType: 'objectId'
                }
              },
              ipRestrictions: {
                bsonType: 'array',
                items: {
                  bsonType: 'string'
                }
              },
              countryRestrictions: {
                bsonType: 'array',
                items: {
                  bsonType: 'string'
                }
              },
              // A/B Testing
              abTestGroup: {
                bsonType: 'string'
              },
              abTestName: {
                bsonType: 'string'
              },
              createdAt: {
                bsonType: 'date'
              },
              updatedAt: {
                bsonType: 'date'
              },
              deletedAt: {
                bsonType: 'date'
              }
            }
          }
        }
      });
      
      console.log('✅ Created urls collection');
    } catch (error) {
      if (error.code === 48) { // NamespaceExists
        console.log('⏭️  urls collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Create URL Clicks collection
   */
  async createURLClicksCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('url_clicks', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['url', 'clickedAt', 'ipAddress'],
            properties: {
              url: {
                bsonType: 'objectId',
                description: 'URL reference is required'
              },
              clickedAt: {
                bsonType: 'date',
                description: 'Click timestamp is required'
              },
              user: {
                bsonType: 'objectId'
              },
              isAuthenticated: {
                bsonType: 'bool'
              },
              sessionId: {
                bsonType: 'string'
              },
              isUniqueClick: {
                bsonType: 'bool'
              },
              // Device Information
              userAgent: {
                bsonType: 'string'
              },
              device: {
                bsonType: 'string'
              },
              browser: {
                bsonType: 'string'
              },
              browserVersion: {
                bsonType: 'string'
              },
              os: {
                bsonType: 'string'
              },
              osVersion: {
                bsonType: 'string'
              },
              deviceType: {
                bsonType: 'string',
                enum: ['desktop', 'mobile', 'tablet', 'bot', 'unknown']
              },
              // Location Information
              ipAddress: {
                bsonType: 'string',
                description: 'IP address is required'
              },
              country: {
                bsonType: 'string'
              },
              countryCode: {
                bsonType: 'string'
              },
              region: {
                bsonType: 'string'
              },
              city: {
                bsonType: 'string'
              },
              latitude: {
                bsonType: 'double'
              },
              longitude: {
                bsonType: 'double'
              },
              timezone: {
                bsonType: 'string'
              },
              // Referrer Information
              referrer: {
                bsonType: 'string'
              },
              referrerDomain: {
                bsonType: 'string'
              },
              referrerType: {
                bsonType: 'string',
                enum: ['direct', 'search', 'social', 'referral', 'email', 'unknown']
              },
              // UTM Tracking
              utmSource: {
                bsonType: 'string'
              },
              utmMedium: {
                bsonType: 'string'
              },
              utmCampaign: {
                bsonType: 'string'
              },
              utmContent: {
                bsonType: 'string'
              },
              utmTerm: {
                bsonType: 'string'
              },
              // Additional Metadata
              language: {
                bsonType: 'string'
              },
              screenResolution: {
                bsonType: 'string'
              },
              botDetected: {
                bsonType: 'bool'
              },
              botType: {
                bsonType: 'string'
              }
            }
          }
        }
      });
      
      console.log('✅ Created url_clicks collection');
    } catch (error) {
      if (error.code === 48) { // NamespaceExists
        console.log('⏭️  url_clicks collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Create AB Tests collection
   */
  async createABTestsCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('ab_tests', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['testName', 'status', 'trafficDistribution'],
            properties: {
              testName: {
                bsonType: 'string',
                description: 'Test name is required'
              },
              description: {
                bsonType: 'string'
              },
              status: {
                bsonType: 'string',
                enum: ['draft', 'active', 'paused', 'completed', 'archived']
              },
              controlUrl: {
                bsonType: 'objectId'
              },
              variantUrls: {
                bsonType: 'array',
                items: {
                  bsonType: 'objectId'
                }
              },
              trafficDistribution: {
                bsonType: 'object',
                properties: {
                  control: {
                    bsonType: 'int',
                    minimum: 0,
                    maximum: 100
                  },
                  variants: {
                    bsonType: 'array',
                    items: {
                      bsonType: 'int',
                      minimum: 0,
                      maximum: 100
                    }
                  }
                }
              },
              successMetrics: {
                bsonType: 'array',
                items: {
                  bsonType: 'string'
                }
              },
              conversionGoal: {
                bsonType: 'string'
              },
              startedAt: {
                bsonType: 'date'
              },
              endedAt: {
                bsonType: 'date'
              },
              completedAt: {
                bsonType: 'date'
              },
              minSampleSize: {
                bsonType: 'int',
                minimum: 1
              },
              confidenceLevel: {
                bsonType: 'double',
                minimum: 0.8,
                maximum: 0.99
              },
              statisticalSignificance: {
                bsonType: 'double',
                minimum: 0,
                maximum: 1
              },
              winner: {
                bsonType: 'string',
                enum: ['control', 'variant_1', 'variant_2', 'variant_3', 'inconclusive']
              },
              results: {
                bsonType: 'object'
              },
              linkedModule: {
                bsonType: 'string'
              },
              linkedEntityId: {
                bsonType: 'string'
              },
              createdBy: {
                bsonType: 'objectId'
              },
              createdAt: {
                bsonType: 'date'
              },
              updatedAt: {
                bsonType: 'date'
              }
            }
          }
        }
      });
      
      console.log('✅ Created ab_tests collection');
    } catch (error) {
      if (error.code === 48) { // NamespaceExists
        console.log('⏭️  ab_tests collection already exists');
      } else {
        throw error;
      }
    }
  }

  /**
   * Create indexes for optimal performance
   */
  async createIndexes() {
    const db = mongoose.connection.db;
    
    console.log('📊 Creating database indexes...');
    
    // URL Categories indexes
    const categoryIndexes = [
      { name: 1 },
      { sortOrder: 1 },
      { isActive: 1 },
      { parentCategory: 1 },
      { isDefault: 1 }
    ];
    
    for (const index of categoryIndexes) {
      try {
        await db.collection('url_categories').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create category index ${JSON.stringify(index)}:`, error.message);
      }
    }
    
    // URLs indexes
    const urlIndexes = [
      { shortCode: 1 }, // Unique index
      { originalUrl: 1 },
      { owner: 1, createdAt: -1 },
      { createdAt: -1 },
      { expiresAt: 1 },
      { isActive: 1, isPublic: 1 },
      { linkedModule: 1, linkedEntityId: 1 },
      { tags: 1 },
      { totalClicks: -1 },
      { lastClickedAt: -1 },
      { category: 1 },
      { abTestGroup: 1, abTestName: 1 },
      { 'utmSource': 1, 'utmMedium': 1, 'utmCampaign': 1 },
      { deletedAt: 1 }, // For soft deletes
      // Compound indexes for common queries
      { owner: 1, isActive: 1, createdAt: -1 },
      { isPublic: 1, isActive: 1, totalClicks: -1 },
      { linkedModule: 1, linkedEntityId: 1, isActive: 1 }
    ];
    
    // Create unique index for shortCode
    try {
      await db.collection('urls').createIndex({ shortCode: 1 }, { unique: true, background: true });
      console.log('✅ Created unique index for shortCode');
    } catch (error) {
      console.warn('Warning: Could not create unique shortCode index:', error.message);
    }
    
    // Create other URL indexes
    for (const index of urlIndexes.slice(1)) {
      try {
        await db.collection('urls').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create URL index ${JSON.stringify(index)}:`, error.message);
      }
    }
    
    // URL Clicks indexes
    const clickIndexes = [
      { url: 1, clickedAt: -1 },
      { clickedAt: -1 },
      { ipAddress: 1 },
      { country: 1 },
      { device: 1 },
      { sessionId: 1 },
      { isUniqueClick: 1 },
      { user: 1, clickedAt: -1 },
      { referrerDomain: 1 },
      { deviceType: 1 },
      { botDetected: 1 },
      { 'utmSource': 1, 'utmMedium': 1, 'utmCampaign': 1 },
      // Compound indexes for analytics queries
      { url: 1, clickedAt: -1, isUniqueClick: 1 },
      { url: 1, country: 1, clickedAt: -1 },
      { url: 1, deviceType: 1, clickedAt: -1 },
      { clickedAt: -1, botDetected: 1 }
    ];
    
    for (const index of clickIndexes) {
      try {
        await db.collection('url_clicks').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create click index ${JSON.stringify(index)}:`, error.message);
      }
    }
    
    // AB Tests indexes
    const abTestIndexes = [
      { testName: 1 },
      { status: 1 },
      { startedAt: -1 },
      { completedAt: -1 },
      { createdBy: 1, createdAt: -1 },
      { linkedModule: 1, linkedEntityId: 1 },
      { winner: 1 },
      // Compound indexes
      { status: 1, startedAt: -1 },
      { createdBy: 1, status: 1, createdAt: -1 }
    ];
    
    for (const index of abTestIndexes) {
      try {
        await db.collection('ab_tests').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create AB test index ${JSON.stringify(index)}:`, error.message);
      }
    }
    
    console.log('✅ Database indexes created successfully');
  }

  /**
   * Seed initial data
   */
  async seedInitialData() {
    console.log('🌱 Seeding initial data...');
    
    // Create default categories
    const defaultCategories = [
      {
        name: 'General',
        description: 'General purpose URLs',
        color: '#6366f1',
        icon: 'link',
        sortOrder: 1,
        isActive: true,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Marketing',
        description: 'Marketing campaign URLs',
        color: '#f59e0b',
        icon: 'megaphone',
        sortOrder: 2,
        isActive: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Social Media',
        description: 'Social media sharing URLs',
        color: '#3b82f6',
        icon: 'share',
        sortOrder: 3,
        isActive: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Email Campaigns',
        description: 'Email marketing URLs',
        color: '#10b981',
        icon: 'mail',
        sortOrder: 4,
        isActive: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Documents',
        description: 'Document sharing URLs',
        color: '#8b5cf6',
        icon: 'document',
        sortOrder: 5,
        isActive: true,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    try {
      const db = mongoose.connection.db;
      const existingCategories = await db.collection('url_categories').countDocuments();
      
      if (existingCategories === 0) {
        await db.collection('url_categories').insertMany(defaultCategories);
        console.log('✅ Default categories created');
      } else {
        console.log('⏭️  Categories already exist, skipping seed');
      }
    } catch (error) {
      console.warn('Warning: Could not seed initial categories:', error.message);
    }
    
    console.log('✅ Initial data seeding completed');
  }

  /**
   * Verify migration was successful
   */
  async verify() {
    try {
      const db = mongoose.connection.db;
      const collections = ['url_categories', 'urls', 'url_clicks', 'ab_tests'];
      const verificationResults = [];
      
      for (const collectionName of collections) {
        try {
          const stats = await db.collection(collectionName).stats();
          const indexes = await db.collection(collectionName).listIndexes().toArray();
          
          verificationResults.push({
            collection: collectionName,
            exists: true,
            documentCount: stats.count,
            indexCount: indexes.length,
            indexes: indexes.map(idx => idx.name)
          });
        } catch (error) {
          verificationResults.push({
            collection: collectionName,
            exists: false,
            error: error.message
          });
        }
      }
      
      console.log('📊 Migration Verification Results:');
      verificationResults.forEach(result => {
        if (result.exists) {
          console.log(`✅ ${result.collection}: ${result.documentCount} docs, ${result.indexCount} indexes`);
        } else {
          console.log(`❌ ${result.collection}: ${result.error}`);
        }
      });
      
      return verificationResults;
    } catch (error) {
      console.error('❌ Migration verification failed:', error);
      throw error;
    }
  }
}

module.exports = URLTablesMigration;
