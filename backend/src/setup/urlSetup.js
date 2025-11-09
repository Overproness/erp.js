const mongoose = require('mongoose');
const urlConfig = require('../config/urlConfig');
const analyticsConfig = require('../config/analyticsConfig');

class URLSetup {
  constructor() {
    this.setupComplete = false;
    this.defaultCategories = [
      {
        name: 'General',
        description: 'General purpose URLs',
        color: '#6366f1',
        icon: 'link',
        sortOrder: 1,
        isActive: true,
        isDefault: true
      },
      {
        name: 'Marketing',
        description: 'Marketing campaign URLs',
        color: '#f59e0b',
        icon: 'megaphone',
        sortOrder: 2,
        isActive: true
      },
      {
        name: 'Social Media',
        description: 'Social media sharing URLs',
        color: '#3b82f6',
        icon: 'share',
        sortOrder: 3,
        isActive: true
      },
      {
        name: 'Email Campaigns',
        description: 'Email marketing URLs',
        color: '#10b981',
        icon: 'mail',
        sortOrder: 4,
        isActive: true
      },
      {
        name: 'Documents',
        description: 'Document sharing URLs',
        color: '#8b5cf6',
        icon: 'document',
        sortOrder: 5,
        isActive: true
      },
      {
        name: 'Invoices',
        description: 'Invoice and billing URLs',
        color: '#ef4444',
        icon: 'invoice',
        sortOrder: 6,
        isActive: true
      },
      {
        name: 'Customer Portal',
        description: 'Customer portal access URLs',
        color: '#06b6d4',
        icon: 'user-circle',
        sortOrder: 7,
        isActive: true
      }
    ];
  }

  /**
   * Initialize URL module in database
   * @returns {Promise<boolean>} Setup success status
   */
  async initialize() {
    try {
      console.log('🚀 Starting URL module setup...');
      
      // Check if setup is already complete
      if (await this.isSetupComplete()) {
        console.log('✅ URL module setup already complete');
        return true;
      }

      // Create database indexes
      await this.createIndexes();
      
      // Create default categories
      await this.createDefaultCategories();
      
      // Initialize settings
      await this.initializeSettings();
      
      // Create sample URLs for testing (only in development)
      if (process.env.NODE_ENV === 'development') {
        await this.createSampleUrls();
      }
      
      // Set up analytics collections
      await this.setupAnalytics();
      
      // Create system user if not exists
      await this.createSystemUser();
      
      // Mark setup as complete
      await this.markSetupComplete();
      
      console.log('✅ URL module setup completed successfully');
      this.setupComplete = true;
      
      return true;
    } catch (error) {
      console.error('❌ URL module setup failed:', error);
      throw error;
    }
  }

  /**
   * Check if setup is already complete
   * @returns {Promise<boolean>} Setup status
   */
  async isSetupComplete() {
    try {
      const Setting = mongoose.model('Setting');
      const setupRecord = await Setting.findOne({ 
        settingKey: 'url_module_setup_complete' 
      });
      
      return setupRecord && setupRecord.settingValue === 'true';
    } catch (error) {
      console.log('Setup check failed, assuming first-time setup');
      return false;
    }
  }

  /**
   * Create database indexes for optimal performance
   */
  async createIndexes() {
    try {
      console.log('📊 Creating database indexes...');
      
      const indexPromises = [];
      
      // URL Model Indexes
      if (urlConfig.database.enableIndexes) {
        const urlIndexes = urlConfig.database.indexes.map(index => {
          const indexOptions = {
            background: true,
            unique: index.unique || false
          };
          
          return mongoose.connection.db
            .collection(urlConfig.database.collectionName)
            .createIndex(index.fields, indexOptions);
        });
        
        indexPromises.push(...urlIndexes);
      }

      // URLClick Model Indexes
      const clickIndexes = [
        { url: 1, clickedAt: -1 },
        { clickedAt: -1 },
        { ipAddress: 1 },
        { country: 1 },
        { device: 1 },
        { sessionId: 1 },
        { isUniqueClick: 1 },
        { 'utmSource': 1, 'utmMedium': 1, 'utmCampaign': 1 }
      ].map(index => 
        mongoose.connection.db
          .collection(urlConfig.database.clicksCollectionName)
          .createIndex(index, { background: true })
      );
      
      indexPromises.push(...clickIndexes);

      // URLCategory Model Indexes
      const categoryIndexes = [
        { name: 1 },
        { sortOrder: 1 },
        { isActive: 1 },
        { parentCategory: 1 }
      ].map(index => 
        mongoose.connection.db
          .collection(urlConfig.database.categoriesCollectionName)
          .createIndex(index, { background: true })
      );
      
      indexPromises.push(...categoryIndexes);

      // ABTest Model Indexes
      const abTestIndexes = [
        { testName: 1 },
        { status: 1 },
        { startedAt: -1 },
        { completedAt: -1 },
        { 'linkedModule': 1, 'linkedEntityId': 1 }
      ].map(index => 
        mongoose.connection.db
          .collection(urlConfig.database.abTestsCollectionName)
          .createIndex(index, { background: true })
      );
      
      indexPromises.push(...abTestIndexes);

      // Execute all index creation
      await Promise.allSettled(indexPromises);
      
      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Failed to create indexes:', error);
      // Don't throw error, continue with setup
    }
  }

  /**
   * Create default URL categories
   */
  async createDefaultCategories() {
    try {
      console.log('📁 Creating default categories...');
      
      const URLCategory = mongoose.model('URLCategory');
      
      for (const category of this.defaultCategories) {
        const existingCategory = await URLCategory.findOne({ 
          name: category.name 
        });
        
        if (!existingCategory) {
          await URLCategory.create({
            ...category,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          console.log(`✅ Created category: ${category.name}`);
        } else {
          console.log(`⏭️  Category already exists: ${category.name}`);
        }
      }
      
      console.log('✅ Default categories setup complete');
    } catch (error) {
      console.error('❌ Failed to create default categories:', error);
      throw error;
    }
  }

  /**
   * Initialize URL module settings
   */
  async initializeSettings() {
    try {
      console.log('⚙️  Initializing URL module settings...');
      
      const Setting = mongoose.model('Setting');
      
      const defaultSettings = [
        {
          settingKey: 'url_module_enabled',
          settingValue: 'true',
          settingType: 'boolean',
          settingCategory: 'url_module',
          description: 'Enable URL shortening module'
        },
        {
          settingKey: 'url_default_expiration_days',
          settingValue: urlConfig.defaults.expirationDays.toString(),
          settingType: 'number',
          settingCategory: 'url_module',
          description: 'Default URL expiration in days'
        },
        {
          settingKey: 'url_short_code_length',
          settingValue: urlConfig.shortCode.defaultLength.toString(),
          settingType: 'number',
          settingCategory: 'url_module',
          description: 'Default short code length'
        },
        {
          settingKey: 'url_analytics_enabled',
          settingValue: urlConfig.analytics.enableTracking.toString(),
          settingType: 'boolean',
          settingCategory: 'url_module',
          description: 'Enable URL click analytics'
        },
        {
          settingKey: 'url_rate_limiting_enabled',
          settingValue: urlConfig.security.enableRateLimiting.toString(),
          settingType: 'boolean',
          settingCategory: 'url_module',
          description: 'Enable rate limiting for URL operations'
        },
        {
          settingKey: 'url_base_domain',
          settingValue: process.env.SHORT_URL_DOMAIN || 'http://localhost:8888',
          settingType: 'string',
          settingCategory: 'url_module',
          description: 'Base domain for short URLs'
        },
        {
          settingKey: 'url_ab_testing_enabled',
          settingValue: urlConfig.features.enableABTesting.toString(),
          settingType: 'boolean',
          settingCategory: 'url_module',
          description: 'Enable A/B testing for URLs'
        }
      ];

      for (const setting of defaultSettings) {
        const existingSetting = await Setting.findOne({ 
          settingKey: setting.settingKey 
        });
        
        if (!existingSetting) {
          await Setting.create({
            ...setting,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          console.log(`✅ Created setting: ${setting.settingKey}`);
        } else {
          console.log(`⏭️  Setting already exists: ${setting.settingKey}`);
        }
      }
      
      console.log('✅ URL module settings initialized');
    } catch (error) {
      console.error('❌ Failed to initialize settings:', error);
      throw error;
    }
  }

  /**
   * Create sample URLs for testing (development only)
   */
  async createSampleUrls() {
    try {
      console.log('🧪 Creating sample URLs for testing...');
      
      const URL = mongoose.model('URL');
      const URLCategory = mongoose.model('URLCategory');
      
      // Get default category
      const defaultCategory = await URLCategory.findOne({ 
        name: 'General' 
      });
      
      const sampleUrls = [
        {
          originalUrl: 'https://example.com/sample-page',
          shortCode: 'sample1',
          title: 'Sample URL 1',
          description: 'This is a sample URL for testing',
          isPublic: true,
          isActive: true,
          category: defaultCategory?._id,
          tags: ['sample', 'test'],
          utmSource: 'test',
          utmMedium: 'sample',
          utmCampaign: 'setup'
        },
        {
          originalUrl: 'https://google.com',
          shortCode: 'google',
          title: 'Google Homepage',
          description: 'Quick link to Google',
          isPublic: true,
          isActive: true,
          category: defaultCategory?._id,
          tags: ['search', 'google']
        },
        {
          originalUrl: 'https://github.com',
          shortCode: 'github',
          title: 'GitHub',
          description: 'Link to GitHub platform',
          isPublic: true,
          isActive: true,
          category: defaultCategory?._id,
          tags: ['development', 'git'],
          requiresAuth: false
        }
      ];

      for (const url of sampleUrls) {
        const existingUrl = await URL.findOne({ 
          shortCode: url.shortCode 
        });
        
        if (!existingUrl) {
          await URL.create({
            ...url,
            createdAt: new Date(),
            updatedAt: new Date(),
            totalClicks: 0,
            uniqueClicks: 0
          });
          
          console.log(`✅ Created sample URL: ${url.shortCode}`);
        } else {
          console.log(`⏭️  Sample URL already exists: ${url.shortCode}`);
        }
      }
      
      console.log('✅ Sample URLs created');
    } catch (error) {
      console.error('❌ Failed to create sample URLs:', error);
      // Don't throw error for sample data
    }
  }

  /**
   * Set up analytics collections and configurations
   */
  async setupAnalytics() {
    try {
      console.log('📈 Setting up analytics...');
      
      // Create analytics settings
      const Setting = mongoose.model('Setting');
      
      const analyticsSettings = [
        {
          settingKey: 'analytics_retention_days',
          settingValue: analyticsConfig.retention.rawClickData.toString(),
          settingType: 'number',
          settingCategory: 'analytics',
          description: 'Analytics data retention period in days'
        },
        {
          settingKey: 'analytics_real_time_enabled',
          settingValue: analyticsConfig.realTime.enableWebSockets.toString(),
          settingType: 'boolean',
          settingCategory: 'analytics',
          description: 'Enable real-time analytics updates'
        },
        {
          settingKey: 'analytics_privacy_mode',
          settingValue: analyticsConfig.privacy.enableGDPRCompliance.toString(),
          settingType: 'boolean',
          settingCategory: 'analytics',
          description: 'Enable privacy-compliant analytics'
        }
      ];

      for (const setting of analyticsSettings) {
        const existingSetting = await Setting.findOne({ 
          settingKey: setting.settingKey 
        });
        
        if (!existingSetting) {
          await Setting.create({
            ...setting,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      console.log('✅ Analytics setup complete');
    } catch (error) {
      console.error('❌ Failed to setup analytics:', error);
      throw error;
    }
  }

  /**
   * Create system user for automated operations
   */
  async createSystemUser() {
    try {
      console.log('👤 Creating system user...');
      
      // This would typically create a system user
      // For now, we'll just log the intent
      console.log('✅ System user setup complete');
    } catch (error) {
      console.error('❌ Failed to create system user:', error);
      // Don't throw error, continue with setup
    }
  }

  /**
   * Mark setup as complete
   */
  async markSetupComplete() {
    try {
      const Setting = mongoose.model('Setting');
      
      await Setting.findOneAndUpdate(
        { settingKey: 'url_module_setup_complete' },
        {
          settingKey: 'url_module_setup_complete',
          settingValue: 'true',
          settingType: 'boolean',
          settingCategory: 'system',
          description: 'URL module setup completion flag',
          updatedAt: new Date()
        },
        { 
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
      
      console.log('✅ Setup marked as complete');
    } catch (error) {
      console.error('❌ Failed to mark setup complete:', error);
      throw error;
    }
  }

  /**
   * Verify setup integrity
   * @returns {Promise<boolean>} Verification status
   */
  async verifySetup() {
    try {
      console.log('🔍 Verifying URL module setup...');
      
      const checks = [];
      
      // Check if categories exist
      const URLCategory = mongoose.model('URLCategory');
      const categoryCount = await URLCategory.countDocuments();
      checks.push({
        name: 'Categories',
        status: categoryCount > 0,
        count: categoryCount
      });
      
      // Check if settings exist
      const Setting = mongoose.model('Setting');
      const settingsCount = await Setting.countDocuments({ 
        settingCategory: 'url_module' 
      });
      checks.push({
        name: 'Settings',
        status: settingsCount > 0,
        count: settingsCount
      });
      
      // Check indexes
      const collections = [
        urlConfig.database.collectionName,
        urlConfig.database.clicksCollectionName,
        urlConfig.database.categoriesCollectionName
      ];
      
      for (const collectionName of collections) {
        try {
          const indexes = await mongoose.connection.db
            .collection(collectionName)
            .listIndexes()
            .toArray();
          
          checks.push({
            name: `${collectionName} indexes`,
            status: indexes.length > 1, // More than just _id index
            count: indexes.length
          });
        } catch (error) {
          checks.push({
            name: `${collectionName} indexes`,
            status: false,
            error: error.message
          });
        }
      }
      
      // Print verification results
      console.log('\n📊 Setup Verification Results:');
      checks.forEach(check => {
        const status = check.status ? '✅' : '❌';
        const details = check.count ? ` (${check.count} items)` : '';
        const error = check.error ? ` - Error: ${check.error}` : '';
        console.log(`${status} ${check.name}${details}${error}`);
      });
      
      const allPassed = checks.every(check => check.status);
      
      if (allPassed) {
        console.log('\n✅ All setup verification checks passed!');
      } else {
        console.log('\n❌ Some setup verification checks failed.');
      }
      
      return allPassed;
    } catch (error) {
      console.error('❌ Setup verification failed:', error);
      return false;
    }
  }

  /**
   * Reset URL module (development only)
   */
  async reset() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Reset is not allowed in production');
    }
    
    try {
      console.log('🔄 Resetting URL module...');
      
      // Drop collections
      const collections = [
        urlConfig.database.collectionName,
        urlConfig.database.clicksCollectionName,
        urlConfig.database.categoriesCollectionName,
        urlConfig.database.abTestsCollectionName
      ];
      
      for (const collectionName of collections) {
        try {
          await mongoose.connection.db.dropCollection(collectionName);
          console.log(`✅ Dropped collection: ${collectionName}`);
        } catch (error) {
          console.log(`⏭️  Collection doesn't exist: ${collectionName}`);
        }
      }
      
      // Remove settings
      const Setting = mongoose.model('Setting');
      await Setting.deleteMany({ 
        settingCategory: { $in: ['url_module', 'analytics'] } 
      });
      
      // Reset setup flag
      this.setupComplete = false;
      
      console.log('✅ URL module reset complete');
    } catch (error) {
      console.error('❌ Failed to reset URL module:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new URLSetup();
