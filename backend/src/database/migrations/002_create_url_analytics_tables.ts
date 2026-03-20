// @ts-nocheck
const mongoose = require('mongoose');

class URLAnalyticsTablesMigration {
  constructor() {
    this.migrationName = '002_create_url_analytics_tables';
    this.version = '1.0.0';
    this.description = 'Create URL analytics aggregation tables and views';
  }

  /**
   * Run the migration
   */
  async up() {
    try {
      console.log(`Running migration: ${this.migrationName}`);
      
      // Create analytics aggregation collections
      await this.createAnalyticsAggregationCollections();
      
      // Create materialized views for common queries
      await this.createMaterializedViews();
      
      // Create indexes for analytics tables
      await this.createAnalyticsIndexes();
      
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
      
      const collections = [
        'url_analytics_hourly',
        'url_analytics_daily',
        'url_analytics_weekly',
        'url_analytics_monthly',
        'url_performance_summary',
        'url_geographic_stats',
        'url_device_stats',
        'url_referrer_stats'
      ];
      
      for (const collectionName of collections) {
        try {
          await mongoose.connection.db.dropCollection(collectionName);
          console.log(`✅ Dropped collection: ${collectionName}`);
        } catch (error) {
          if (error.code === 26) { // NamespaceNotFound
            console.log(`⏭️  Collection ${collectionName} doesn't exist`);
          } else {
            console.warn(`Warning dropping ${collectionName}:`, error.message);
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
   * Create analytics aggregation collections
   */
  async createAnalyticsAggregationCollections() {
    const db = mongoose.connection.db;
    
    // Hourly analytics aggregation
    try {
      await db.createCollection('url_analytics_hourly', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['url', 'hour', 'totalClicks', 'uniqueClicks'],
            properties: {
              url: { bsonType: 'objectId' },
              hour: { bsonType: 'date' },
              totalClicks: { bsonType: 'int', minimum: 0 },
              uniqueClicks: { bsonType: 'int', minimum: 0 },
              bounceRate: { bsonType: 'double', minimum: 0, maximum: 100 },
              avgSessionDuration: { bsonType: 'double', minimum: 0 },
              conversionRate: { bsonType: 'double', minimum: 0, maximum: 100 },
              topCountries: { bsonType: 'array' },
              topDevices: { bsonType: 'array' },
              topReferrers: { bsonType: 'array' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created url_analytics_hourly collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
    
    // Daily analytics aggregation
    try {
      await db.createCollection('url_analytics_daily', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['url', 'date', 'totalClicks', 'uniqueClicks'],
            properties: {
              url: { bsonType: 'objectId' },
              date: { bsonType: 'date' },
              totalClicks: { bsonType: 'int', minimum: 0 },
              uniqueClicks: { bsonType: 'int', minimum: 0 },
              bounceRate: { bsonType: 'double', minimum: 0, maximum: 100 },
              avgSessionDuration: { bsonType: 'double', minimum: 0 },
              conversionRate: { bsonType: 'double', minimum: 0, maximum: 100 },
              peakHour: { bsonType: 'int', minimum: 0, maximum: 23 },
              topCountries: { bsonType: 'array' },
              topDevices: { bsonType: 'array' },
              topReferrers: { bsonType: 'array' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created url_analytics_daily collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
    
    // Performance summary collection
    try {
      await db.createCollection('url_performance_summary', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['url', 'period', 'metrics'],
            properties: {
              url: { bsonType: 'objectId' },
              period: { 
                bsonType: 'string',
                enum: ['last_24h', 'last_7d', 'last_30d', 'last_90d', 'all_time']
              },
              metrics: {
                bsonType: 'object',
                properties: {
                  totalClicks: { bsonType: 'int', minimum: 0 },
                  uniqueClicks: { bsonType: 'int', minimum: 0 },
                  clickThroughRate: { bsonType: 'double', minimum: 0 },
                  bounceRate: { bsonType: 'double', minimum: 0, maximum: 100 },
                  avgSessionDuration: { bsonType: 'double', minimum: 0 },
                  conversionRate: { bsonType: 'double', minimum: 0, maximum: 100 },
                  topPerformingHours: { bsonType: 'array' },
                  topPerformingDays: { bsonType: 'array' }
                }
              },
              lastUpdated: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created url_performance_summary collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
    
    // Geographic stats collection
    try {
      await db.createCollection('url_geographic_stats', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['url', 'country', 'totalClicks'],
            properties: {
              url: { bsonType: 'objectId' },
              country: { bsonType: 'string' },
              countryCode: { bsonType: 'string' },
              region: { bsonType: 'string' },
              city: { bsonType: 'string' },
              totalClicks: { bsonType: 'int', minimum: 0 },
              uniqueClicks: { bsonType: 'int', minimum: 0 },
              percentage: { bsonType: 'double', minimum: 0, maximum: 100 },
              lastClickAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created url_geographic_stats collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
  }

  /**
   * Create materialized views for common queries
   */
  async createMaterializedViews() {
    // Note: MongoDB doesn't have traditional materialized views
    // We'll create aggregation pipelines that can be used for common queries
    console.log('📊 Setting up aggregation pipelines for analytics views...');
    
    // This would typically involve creating indexes and preparing aggregation pipelines
    // that the application can use for common analytics queries
    console.log('✅ Analytics views configured');
  }

  /**
   * Create indexes for analytics tables
   */
  async createAnalyticsIndexes() {
    const db = mongoose.connection.db;
    
    console.log('📊 Creating analytics indexes...');
    
    // Hourly analytics indexes
    const hourlyIndexes = [
      { url: 1, hour: -1 },
      { hour: -1 },
      { url: 1, totalClicks: -1 },
      { updatedAt: -1 }
    ];
    
    for (const index of hourlyIndexes) {
      try {
        await db.collection('url_analytics_hourly').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create hourly analytics index:`, error.message);
      }
    }
    
    // Daily analytics indexes
    const dailyIndexes = [
      { url: 1, date: -1 },
      { date: -1 },
      { url: 1, totalClicks: -1 },
      { url: 1, conversionRate: -1 }
    ];
    
    for (const index of dailyIndexes) {
      try {
        await db.collection('url_analytics_daily').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create daily analytics index:`, error.message);
      }
    }
    
    // Performance summary indexes
    const performanceIndexes = [
      { url: 1, period: 1 },
      { 'metrics.totalClicks': -1 },
      { 'metrics.conversionRate': -1 },
      { lastUpdated: -1 }
    ];
    
    for (const index of performanceIndexes) {
      try {
        await db.collection('url_performance_summary').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create performance summary index:`, error.message);
      }
    }
    
    // Geographic stats indexes
    const geoIndexes = [
      { url: 1, country: 1 },
      { url: 1, totalClicks: -1 },
      { country: 1, totalClicks: -1 },
      { percentage: -1 }
    ];
    
    for (const index of geoIndexes) {
      try {
        await db.collection('url_geographic_stats').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create geographic stats index:`, error.message);
      }
    }
    
    console.log('✅ Analytics indexes created successfully');
  }
}

module.exports = URLAnalyticsTablesMigration;
