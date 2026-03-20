// @ts-nocheck
const mongoose = require('mongoose');

// Import migration classes
const URLTablesMigration = require('./001_create_url_tables');
const URLAnalyticsTablesMigration = require('./002_create_url_analytics_tables');
const ABTestSupportMigration = require('./003_add_abtest_support');

class MigrationRunner {
  constructor() {
    this.migrationCollectionName = 'migration_history';
    this.migrations = [
      new URLTablesMigration(),
      new URLAnalyticsTablesMigration(),
      new ABTestSupportMigration()
    ];
  }

  /**
   * Register a migration
   * @param {Object} migration - Migration class instance
   */
  registerMigration(migration) {
    this.migrations.push(migration);
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    try {
      console.log('🚀 Starting database migrations...');
      
      // Ensure migration history collection exists
      await this.ensureMigrationHistory();
      
      // Get completed migrations
      const completedMigrations = await this.getCompletedMigrations();
      
      // Run pending migrations
      for (const migration of this.migrations) {
        const isCompleted = completedMigrations.some(
          m => m.migrationName === migration.migrationName
        );
        
        if (!isCompleted) {
          console.log(`📦 Running migration: ${migration.migrationName}`);
          
          const startTime = Date.now();
          const result = await migration.up();
          const duration = Date.now() - startTime;
          
          // Record migration completion
          await this.recordMigration({
            migrationName: migration.migrationName,
            version: migration.version,
            description: migration.description,
            status: 'completed',
            duration,
            executedAt: new Date(),
            result
          });
          
          console.log(`✅ Migration ${migration.migrationName} completed in ${duration}ms`);
        } else {
          console.log(`⏭️  Migration ${migration.migrationName} already completed`);
        }
      }
      
      console.log('✅ All migrations completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Run all URL Management migrations
   */
  async runUrlMigrations() {
    try {
      console.log('🚀 Starting URL Management migrations...');
      
      for (const migration of this.migrations) {
        const completedMigrations = await this.getCompletedMigrations();
        const isCompleted = completedMigrations.some(
          m => m.migrationName === migration.migrationName
        );
        
        if (!isCompleted) {
          console.log(`📦 Running migration: ${migration.migrationName}`);
          
          const startTime = Date.now();
          const result = await migration.up();
          const duration = Date.now() - startTime;
          
          // Record migration completion
          await this.recordMigration({
            migrationName: migration.migrationName,
            version: migration.version,
            description: migration.description,
            status: 'completed',
            duration,
            executedAt: new Date(),
            result
          });
          
          console.log(`✅ Migration ${migration.migrationName} completed in ${duration}ms`);
          
          // Verify migration
          if (typeof migration.verify === 'function') {
            await migration.verify();
          }
        } else {
          console.log(`⏭️  Migration ${migration.migrationName} already completed`);
        }
      }
      
      console.log('✅ All URL Management migrations completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ URL Management migration failed:', error);
      throw error;
    }
  }

  /**
   * Rollback the last migration
   */
  async rollbackMigration(migrationName = null) {
    try {
      console.log('🔄 Rolling back migration...');
      
      const completedMigrations = await this.getCompletedMigrations();
      
      // Find migration to rollback
      let migrationToRollback;
      if (migrationName) {
        migrationToRollback = this.migrations.find(m => m.migrationName === migrationName);
        if (!migrationToRollback) {
          throw new Error(`Migration ${migrationName} not found`);
        }
      } else {
        // Rollback the last completed migration
        const lastCompleted = completedMigrations[completedMigrations.length - 1];
        if (!lastCompleted) {
          throw new Error('No migrations to rollback');
        }
        migrationToRollback = this.migrations.find(m => m.migrationName === lastCompleted.migrationName);
      }
      
      if (!migrationToRollback) {
        throw new Error('Migration not found for rollback');
      }
      
      console.log(`📦 Rolling back migration: ${migrationToRollback.migrationName}`);
      
      const startTime = Date.now();
      const result = await migrationToRollback.down();
      const duration = Date.now() - startTime;
      
      // Update migration record
      await this.recordMigration({
        migrationName: migrationToRollback.migrationName,
        version: migrationToRollback.version,
        status: 'rolled_back',
        duration,
        executedAt: new Date(),
        result
      });
      
      console.log(`✅ Migration ${migrationToRollback.migrationName} rolled back in ${duration}ms`);
      return { success: true, migration: migrationToRollback.migrationName };
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus() {
    try {
      const completedMigrations = await this.getCompletedMigrations();
      
      const status = this.migrations.map(migration => {
        const completed = completedMigrations.find(
          m => m.migrationName === migration.migrationName
        );
        
        return {
          migrationName: migration.migrationName,
          version: migration.version,
          description: migration.description,
          status: completed ? completed.status : 'pending',
          executedAt: completed ? completed.executedAt : null
        };
      });
      
      return {
        totalMigrations: this.migrations.length,
        completedMigrations: completedMigrations.length,
        pendingMigrations: this.migrations.length - completedMigrations.length,
        migrations: status
      };
    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
      throw error;
    }
  }

  /**
   * Ensure migration history collection exists
   */
  async ensureMigrationHistory() {
    const db = mongoose.connection.db;
    
    try {
      await db.createCollection(this.migrationCollectionName, {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['migrationName', 'status', 'executedAt'],
            properties: {
              migrationName: { bsonType: 'string' },
              version: { bsonType: 'string' },
              description: { bsonType: 'string' },
              status: { 
                bsonType: 'string',
                enum: ['completed', 'failed', 'rolled_back']
              },
              duration: { bsonType: 'int' },
              executedAt: { bsonType: 'date' },
              result: { bsonType: 'object' }
            }
          }
        }
      });
    } catch (error) {
      if (error.code !== 48) { // Not NamespaceExists
        throw error;
      }
    }
    
    // Create index for efficient queries
    try {
      await db.collection(this.migrationCollectionName).createIndex(
        { migrationName: 1 },
        { unique: true, background: true }
      );
    } catch (error) {
      // Index might already exist
    }
  }

  /**
   * Get completed migrations
   */
  async getCompletedMigrations() {
    const db = mongoose.connection.db;
    
    return await db.collection(this.migrationCollectionName)
      .find({ status: 'completed' })
      .sort({ executedAt: 1 })
      .toArray();
  }

  /**
   * Record migration execution
   */
  async recordMigration(migrationData) {
    const db = mongoose.connection.db;
    
    await db.collection(this.migrationCollectionName).replaceOne(
      { migrationName: migrationData.migrationName },
      migrationData,
      { upsert: true }
    );
  }

  /**
   * Verify all migrations
   */
  async verifyMigrations() {
    try {
      console.log('🔍 Verifying migrations...');
      
      const verificationResults = [];
      
      for (const migration of this.migrations) {
        if (typeof migration.verify === 'function') {
          try {
            const result = await migration.verify();
            verificationResults.push({
              migrationName: migration.migrationName,
              status: 'verified',
              result
            });
          } catch (error) {
            verificationResults.push({
              migrationName: migration.migrationName,
              status: 'failed',
              error: error.message
            });
          }
        } else {
          verificationResults.push({
            migrationName: migration.migrationName,
            status: 'no_verification',
            message: 'Migration does not implement verify method'
          });
        }
      }
      
      console.log('📊 Migration Verification Summary:');
      verificationResults.forEach(result => {
        const status = result.status === 'verified' ? '✅' : 
                      result.status === 'failed' ? '❌' : '⚠️';
        console.log(`${status} ${result.migrationName}: ${result.status}`);
      });
      
      return verificationResults;
    } catch (error) {
      console.error('❌ Migration verification failed:', error);
      throw error;
    }
  }
}

module.exports = MigrationRunner;
