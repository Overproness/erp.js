const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

// Test to identify the exact hanging point in createCompanyOwner
async function testCreateCompanyOwner() {
  console.log('🔍 Testing createCompanyOwner components...');

  try {
    // Test 1: Basic faker functionality
    console.log('1. Testing faker...');
    const email = `${faker.string.alphanumeric(8)}-${Date.now()}@${faker.internet.domainName()}`;
    const name = faker.person.firstName();
    console.log('✅ Faker works:', { email, name });

    // Test 2: Bcrypt hashing (potential hang point)
    console.log('2. Testing bcrypt hashing...');
    const salt = faker.string.alphanumeric(10);
    const plainPassword = 'password123';

    // Use synchronous version first to see if async is the issue
    console.log('   Testing bcrypt.hashSync...');
    const syncHash = bcrypt.hashSync(salt + plainPassword, 10);
    console.log('✅ bcrypt.hashSync works');

    // Now test async version with timeout
    console.log('   Testing bcrypt.hash (async)...');
    const hashPromise = bcrypt.hash(salt + plainPassword, 10);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('bcrypt.hash timed out')), 5000);
    });

    const asyncHash = await Promise.race([hashPromise, timeoutPromise]);
    console.log('✅ bcrypt.hash (async) works');

    // Test 3: Database models (if we get this far)
    console.log('3. Testing database models...');
    const CompanyOwner = mongoose.model('CompanyOwner');
    const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
    console.log('✅ Models loaded');

    // Test 4: Database connection
    console.log('4. Testing database connection...');
    console.log('   Connection state:', mongoose.connection.readyState);
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    console.log('✅ Database connected');

    // Test 5: Simple database operation with timeout
    console.log('5. Testing simple CompanyOwner creation...');
    const ownerData = {
      email,
      name,
      surname: faker.person.lastName(),
      enabled: true,
      removed: false,
      role: 'owner',
      onboardingComplete: true,
    };

    const createOwnerPromise = new CompanyOwner(ownerData).save();
    const dbTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('CompanyOwner creation timed out')), 10000);
    });

    const owner = await Promise.race([createOwnerPromise, dbTimeoutPromise]);
    console.log('✅ CompanyOwner created:', owner._id);

    // Test 6: CompanyOwnerPassword creation with timeout
    console.log('6. Testing CompanyOwnerPassword creation...');
    const passwordData = {
      user: owner._id,
      password: syncHash, // Use sync hash to avoid potential async issues
      salt: salt,
      removed: false,
      loggedSessions: [],
    };

    const createPasswordPromise = new CompanyOwnerPassword(passwordData).save();
    const passwordTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('CompanyOwnerPassword creation timed out')), 10000);
    });

    const passwordRecord = await Promise.race([createPasswordPromise, passwordTimeoutPromise]);
    console.log('✅ CompanyOwnerPassword created:', passwordRecord._id);

    console.log('🎉 All tests passed - createCompanyOwner should work');
    return { owner, passwordRecord };
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

module.exports = testCreateCompanyOwner;
