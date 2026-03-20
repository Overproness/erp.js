// @ts-nocheck
const mongoose = require('mongoose');

class ABTestSupportMigration {
  constructor() {
    this.migrationName = '003_add_abtest_support';
    this.version = '1.0.0';
    this.description = 'Add comprehensive A/B testing support and advanced analytics';
  }

  /**
   * Run the migration
   */
  async up() {
    try {
      console.log(`Running migration: ${this.migrationName}`);
      
      // Create A/B testing specific collections
      await this.createABTestVariantsCollection();
      await this.createABTestMetricsCollection();
      await this.createConversionGoalsCollection();
      await this.createStatisticalResultsCollection();
      
      // Create advanced analytics collections
      await this.createUserSegmentsCollection();
      await this.createAttributionModelsCollection();
      await this.createExperimentCohortCollection();
      
      // Create indexes for A/B testing
      await this.createABTestIndexes();
      
      // Update existing collections with A/B test fields
      await this.updateExistingCollections();
      
      // Seed A/B testing data
      await this.seedABTestingData();
      
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
        'ab_test_variants',
        'ab_test_metrics',
        'conversion_goals',
        'statistical_results',
        'user_segments',
        'attribution_models',
        'experiment_cohorts'
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
   * Create A/B Test Variants collection
   */
  async createABTestVariantsCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('ab_test_variants', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['testId', 'variantName', 'variantType', 'isControl'],
            properties: {
              testId: { bsonType: 'objectId' },
              variantName: { 
                bsonType: 'string',
                minLength: 1,
                maxLength: 100
              },
              variantType: {
                bsonType: 'string',
                enum: ['url_redirect', 'content_change', 'design_variation', 'parameter_test']
              },
              isControl: { bsonType: 'bool' },
              trafficAllocation: {
                bsonType: 'double',
                minimum: 0,
                maximum: 100
              },
              configuration: {
                bsonType: 'object',
                properties: {
                  targetUrl: { bsonType: 'string' },
                  utmParameters: { bsonType: 'object' },
                  customParameters: { bsonType: 'object' },
                  metaData: { bsonType: 'object' }
                }
              },
              performance: {
                bsonType: 'object',
                properties: {
                  visitors: { bsonType: 'int', minimum: 0 },
                  conversions: { bsonType: 'int', minimum: 0 },
                  conversionRate: { bsonType: 'double', minimum: 0, maximum: 100 },
                  revenue: { bsonType: 'double', minimum: 0 },
                  averageSessionDuration: { bsonType: 'double', minimum: 0 },
                  bounceRate: { bsonType: 'double', minimum: 0, maximum: 100 }
                }
              },
              isActive: { bsonType: 'bool' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created ab_test_variants collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
  }

  /**
   * Create A/B Test Metrics collection
   */
  async createABTestMetricsCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('ab_test_metrics', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['testId', 'variantId', 'metricType', 'value', 'timestamp'],
            properties: {
              testId: { bsonType: 'objectId' },
              variantId: { bsonType: 'objectId' },
              userId: { bsonType: 'objectId' },
              sessionId: { bsonType: 'string' },
              metricType: {
                bsonType: 'string',
                enum: [
                  'page_view', 'click', 'conversion', 'purchase', 'signup',
                  'engagement', 'bounce', 'session_duration', 'revenue',
                  'custom_event', 'micro_conversion', 'macro_conversion'
                ]
              },
              value: { bsonType: 'double' },
              currency: { bsonType: 'string' },
              properties: { bsonType: 'object' },
              timestamp: { bsonType: 'date' },
              // User context
              userAgent: { bsonType: 'string' },
              ipAddress: { bsonType: 'string' },
              country: { bsonType: 'string' },
              device: { bsonType: 'string' },
              referrer: { bsonType: 'string' },
              // Attribution data
              attribution: {
                bsonType: 'object',
                properties: {
                  channel: { bsonType: 'string' },
                  source: { bsonType: 'string' },
                  medium: { bsonType: 'string' },
                  campaign: { bsonType: 'string' },
                  firstTouch: { bsonType: 'bool' },
                  lastTouch: { bsonType: 'bool' }
                }
              }
            }
          }
        }
      });
      console.log('✅ Created ab_test_metrics collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
  }

  /**
   * Create Conversion Goals collection
   */
  async createConversionGoalsCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('conversion_goals', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['testId', 'goalName', 'goalType', 'isActive'],
            properties: {
              testId: { bsonType: 'objectId' },
              goalName: { bsonType: 'string' },
              goalType: {
                bsonType: 'string',
                enum: ['primary', 'secondary', 'micro', 'macro']
              },
              description: { bsonType: 'string' },
              criteria: {
                bsonType: 'object',
                properties: {
                  eventType: { bsonType: 'string' },
                  urlPattern: { bsonType: 'string' },
                  elementSelector: { bsonType: 'string' },
                  valueThreshold: { bsonType: 'double' },
                  timeWindow: { bsonType: 'int' }, // seconds
                  conditions: { bsonType: 'array' }
                }
              },
              weight: {
                bsonType: 'double',
                minimum: 0,
                maximum: 1
              },
              monetaryValue: { bsonType: 'double' },
              isActive: { bsonType: 'bool' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created conversion_goals collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
  }

  /**
   * Create Statistical Results collection
   */
  async createStatisticalResultsCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('statistical_results', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['testId', 'calculatedAt', 'confidenceLevel'],
            properties: {
              testId: { bsonType: 'objectId' },
              calculatedAt: { bsonType: 'date' },
              confidenceLevel: {
                bsonType: 'double',
                minimum: 0.8,
                maximum: 0.99
              },
              statisticalPower: {
                bsonType: 'double',
                minimum: 0,
                maximum: 1
              },
              variants: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    variantId: { bsonType: 'objectId' },
                    sampleSize: { bsonType: 'int', minimum: 0 },
                    conversions: { bsonType: 'int', minimum: 0 },
                    conversionRate: { bsonType: 'double', minimum: 0 },
                    confidenceInterval: {
                      bsonType: 'object',
                      properties: {
                        lower: { bsonType: 'double' },
                        upper: { bsonType: 'double' }
                      }
                    },
                    pValue: { bsonType: 'double', minimum: 0, maximum: 1 },
                    zScore: { bsonType: 'double' },
                    standardError: { bsonType: 'double' },
                    lift: { bsonType: 'double' },
                    liftConfidenceInterval: {
                      bsonType: 'object',
                      properties: {
                        lower: { bsonType: 'double' },
                        upper: { bsonType: 'double' }
                      }
                    }
                  }
                }
              },
              overallResults: {
                bsonType: 'object',
                properties: {
                  isSignificant: { bsonType: 'bool' },
                  winner: { bsonType: 'objectId' },
                  testStatistic: { bsonType: 'double' },
                  degreeOfFreedom: { bsonType: 'int' },
                  effectSize: { bsonType: 'double' },
                  minimumDetectableEffect: { bsonType: 'double' },
                  probabilityToBeBest: { bsonType: 'double' }
                }
              },
              bayesianResults: {
                bsonType: 'object',
                properties: {
                  posteriorDistributions: { bsonType: 'object' },
                  probabilityToWin: { bsonType: 'object' },
                  expectedLoss: { bsonType: 'object' },
                  valueRemaining: { bsonType: 'double' }
                }
              },
              recommendations: {
                bsonType: 'object',
                properties: {
                  action: {
                    bsonType: 'string',
                    enum: ['continue', 'stop_winner', 'stop_inconclusive', 'extend_duration']
                  },
                  reason: { bsonType: 'string' },
                  recommendedDuration: { bsonType: 'int' },
                  requiredSampleSize: { bsonType: 'int' }
                }
              }
            }
          }
        }
      });
      console.log('✅ Created statistical_results collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
  }

  /**
   * Create User Segments collection
   */
  async createUserSegmentsCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('user_segments', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['segmentName', 'criteria', 'isActive'],
            properties: {
              segmentName: { bsonType: 'string' },
              description: { bsonType: 'string' },
              criteria: {
                bsonType: 'object',
                properties: {
                  demographic: { bsonType: 'object' },
                  behavioral: { bsonType: 'object' },
                  geographic: { bsonType: 'object' },
                  technographic: { bsonType: 'object' },
                  psychographic: { bsonType: 'object' }
                }
              },
              targetingRules: { bsonType: 'array' },
              estimatedSize: { bsonType: 'int', minimum: 0 },
              actualSize: { bsonType: 'int', minimum: 0 },
              isActive: { bsonType: 'bool' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created user_segments collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
  }

  /**
   * Create Attribution Models collection
   */
  async createAttributionModelsCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('attribution_models', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['modelName', 'modelType', 'configuration'],
            properties: {
              modelName: { bsonType: 'string' },
              modelType: {
                bsonType: 'string',
                enum: [
                  'first_touch', 'last_touch', 'linear', 'time_decay',
                  'position_based', 'data_driven', 'custom'
                ]
              },
              configuration: {
                bsonType: 'object',
                properties: {
                  lookbackWindow: { bsonType: 'int' }, // days
                  touchpointWeights: { bsonType: 'object' },
                  decayFunction: { bsonType: 'string' },
                  customRules: { bsonType: 'array' }
                }
              },
              isDefault: { bsonType: 'bool' },
              isActive: { bsonType: 'bool' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created attribution_models collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
  }

  /**
   * Create Experiment Cohort collection
   */
  async createExperimentCohortCollection() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection('experiment_cohorts', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['testId', 'cohortName', 'startDate', 'endDate'],
            properties: {
              testId: { bsonType: 'objectId' },
              cohortName: { bsonType: 'string' },
              description: { bsonType: 'string' },
              startDate: { bsonType: 'date' },
              endDate: { bsonType: 'date' },
              participants: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    userId: { bsonType: 'objectId' },
                    variantId: { bsonType: 'objectId' },
                    assignedAt: { bsonType: 'date' },
                    firstInteraction: { bsonType: 'date' },
                    lastInteraction: { bsonType: 'date' },
                    totalInteractions: { bsonType: 'int', minimum: 0 },
                    hasConverted: { bsonType: 'bool' },
                    conversionValue: { bsonType: 'double' },
                    sessionCount: { bsonType: 'int', minimum: 0 }
                  }
                }
              },
              cohortMetrics: {
                bsonType: 'object',
                properties: {
                  totalParticipants: { bsonType: 'int', minimum: 0 },
                  retentionRates: { bsonType: 'array' },
                  conversionByDay: { bsonType: 'array' },
                  revenueByDay: { bsonType: 'array' },
                  churnRate: { bsonType: 'double', minimum: 0, maximum: 100 }
                }
              },
              isComplete: { bsonType: 'bool' },
              createdAt: { bsonType: 'date' },
              updatedAt: { bsonType: 'date' }
            }
          }
        }
      });
      console.log('✅ Created experiment_cohorts collection');
    } catch (error) {
      if (error.code !== 48) throw error;
    }
  }

  /**
   * Create indexes for A/B testing collections
   */
  async createABTestIndexes() {
    const db = mongoose.connection.db;
    
    console.log('📊 Creating A/B testing indexes...');
    
    // A/B Test Variants indexes
    const variantIndexes = [
      { testId: 1, isActive: 1 },
      { testId: 1, isControl: 1 },
      { variantName: 1 },
      { variantType: 1 },
      { createdAt: -1 }
    ];
    
    for (const index of variantIndexes) {
      try {
        await db.collection('ab_test_variants').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create variant index:`, error.message);
      }
    }
    
    // A/B Test Metrics indexes
    const metricIndexes = [
      { testId: 1, timestamp: -1 },
      { variantId: 1, timestamp: -1 },
      { userId: 1, testId: 1 },
      { sessionId: 1, timestamp: -1 },
      { metricType: 1, timestamp: -1 },
      { timestamp: -1 },
      // Compound indexes for analytics
      { testId: 1, variantId: 1, metricType: 1, timestamp: -1 },
      { testId: 1, metricType: 1, timestamp: -1 },
      { userId: 1, metricType: 1, timestamp: -1 }
    ];
    
    for (const index of metricIndexes) {
      try {
        await db.collection('ab_test_metrics').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create metrics index:`, error.message);
      }
    }
    
    // Conversion Goals indexes
    const goalIndexes = [
      { testId: 1, isActive: 1 },
      { goalType: 1 },
      { createdAt: -1 }
    ];
    
    for (const index of goalIndexes) {
      try {
        await db.collection('conversion_goals').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create goal index:`, error.message);
      }
    }
    
    // Statistical Results indexes
    const statisticalIndexes = [
      { testId: 1, calculatedAt: -1 },
      { calculatedAt: -1 },
      { 'overallResults.isSignificant': 1 },
      { 'overallResults.winner': 1 }
    ];
    
    for (const index of statisticalIndexes) {
      try {
        await db.collection('statistical_results').createIndex(index, { background: true });
      } catch (error) {
        console.warn(`Warning: Could not create statistical index:`, error.message);
      }
    }
    
    console.log('✅ A/B testing indexes created successfully');
  }

  /**
   * Update existing collections with A/B test fields
   */
  async updateExistingCollections() {
    const db = mongoose.connection.db;
    
    console.log('📊 Updating existing collections for A/B testing...');
    
    try {
      // Add A/B test fields to URLs collection
      await db.collection('urls').updateMany(
        {},
        {
          $set: {
            abTestEnabled: false,
            abTestId: null,
            abTestVariantId: null,
            abTestAssignmentMethod: 'random', // 'random', 'hash', 'sticky'
            abTestExclusionRules: [],
            abTestTargetingRules: []
          }
        }
      );
      
      // Add experiment tracking to URL clicks
      await db.collection('url_clicks').updateMany(
        {},
        {
          $set: {
            experimentId: null,
            variantId: null,
            isControlGroup: false,
            userSegment: null,
            attributionData: {}
          }
        }
      );
      
      console.log('✅ Updated existing collections for A/B testing');
    } catch (error) {
      console.warn('Warning: Could not update existing collections:', error.message);
    }
  }

  /**
   * Seed A/B testing data
   */
  async seedABTestingData() {
    console.log('🌱 Seeding A/B testing data...');
    
    try {
      const db = mongoose.connection.db;
      
      // Create default attribution models
      const defaultAttributionModels = [
        {
          modelName: 'First Touch',
          modelType: 'first_touch',
          configuration: {
            lookbackWindow: 30,
            touchpointWeights: { first: 1.0 }
          },
          isDefault: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          modelName: 'Last Touch',
          modelType: 'last_touch',
          configuration: {
            lookbackWindow: 30,
            touchpointWeights: { last: 1.0 }
          },
          isDefault: true,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          modelName: 'Linear Attribution',
          modelType: 'linear',
          configuration: {
            lookbackWindow: 30,
            touchpointWeights: {}
          },
          isDefault: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          modelName: 'Time Decay',
          modelType: 'time_decay',
          configuration: {
            lookbackWindow: 30,
            decayFunction: 'exponential',
            touchpointWeights: {}
          },
          isDefault: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const existingModels = await db.collection('attribution_models').countDocuments();
      if (existingModels === 0) {
        await db.collection('attribution_models').insertMany(defaultAttributionModels);
        console.log('✅ Default attribution models created');
      }
      
      // Create default user segments
      const defaultSegments = [
        {
          segmentName: 'New Visitors',
          description: 'First-time visitors to the site',
          criteria: {
            behavioral: {
              sessionCount: { $eq: 1 },
              isReturning: false
            }
          },
          targetingRules: [
            { field: 'sessionCount', operator: 'equals', value: 1 }
          ],
          estimatedSize: 0,
          actualSize: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          segmentName: 'Returning Visitors',
          description: 'Visitors who have been here before',
          criteria: {
            behavioral: {
              sessionCount: { $gt: 1 },
              isReturning: true
            }
          },
          targetingRules: [
            { field: 'sessionCount', operator: 'greater_than', value: 1 }
          ],
          estimatedSize: 0,
          actualSize: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          segmentName: 'Mobile Users',
          description: 'Users accessing from mobile devices',
          criteria: {
            technographic: {
              deviceType: 'mobile'
            }
          },
          targetingRules: [
            { field: 'deviceType', operator: 'equals', value: 'mobile' }
          ],
          estimatedSize: 0,
          actualSize: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          segmentName: 'Desktop Users',
          description: 'Users accessing from desktop devices',
          criteria: {
            technographic: {
              deviceType: 'desktop'
            }
          },
          targetingRules: [
            { field: 'deviceType', operator: 'equals', value: 'desktop' }
          ],
          estimatedSize: 0,
          actualSize: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const existingSegments = await db.collection('user_segments').countDocuments();
      if (existingSegments === 0) {
        await db.collection('user_segments').insertMany(defaultSegments);
        console.log('✅ Default user segments created');
      }
      
    } catch (error) {
      console.warn('Warning: Could not seed A/B testing data:', error.message);
    }
    
    console.log('✅ A/B testing data seeding completed');
  }

  /**
   * Verify migration was successful
   */
  async verify() {
    try {
      const db = mongoose.connection.db;
      const collections = [
        'ab_test_variants',
        'ab_test_metrics', 
        'conversion_goals',
        'statistical_results',
        'user_segments',
        'attribution_models',
        'experiment_cohorts'
      ];
      
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
      
      console.log('📊 A/B Testing Migration Verification Results:');
      verificationResults.forEach(result => {
        if (result.exists) {
          console.log(`✅ ${result.collection}: ${result.documentCount} docs, ${result.indexCount} indexes`);
        } else {
          console.log(`❌ ${result.collection}: ${result.error}`);
        }
      });
      
      return verificationResults;
    } catch (error) {
      console.error('❌ A/B testing migration verification failed:', error);
      throw error;
    }
  }
}

module.exports = ABTestSupportMigration;
