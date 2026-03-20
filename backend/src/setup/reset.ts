// @ts-nocheck
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

async function resetDatabase() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to database successfully');
    
    console.log('Starting complete database reset...');
    
    // Get all collection names in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    console.log(`Found ${collectionNames.length} collections:`, collectionNames);
    
    // Delete all documents from each collection
    for (const collectionName of collectionNames) {
      const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
      console.log(`👍 ${collectionName}: ${result.deletedCount} documents deleted`);
    }

    console.log('✅ Complete database reset completed successfully!');
    console.log('\nAll collections have been cleared.');
    console.log('\nTo restore default data, run:\n\n\tnpm run setup\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

resetDatabase();