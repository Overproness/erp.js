const jwt = require('jsonwebtoken');
const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');

/**
 * Test utilities for mocking and setup
 */

// Database cleanup utility
const cleanupDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

// Create test company helper
const createTestCompany = async () => {
  const CompanyOwner = mongoose.model('CompanyOwner');
  return await CompanyOwner.create({
    name: faker.person.firstName(),
    surname: faker.person.lastName(),
    email: faker.internet.email(),
    role: 'owner',
    enabled: true,
    onboardingComplete: true,
  });
};

// Create test user helper
const createTestUser = async (companyId, options = {}) => {
  const User = mongoose.model('User');
  const Team = mongoose.model('Team');

  // Create a team first if not provided
  let team;
  if (options.team) {
    team = options.team;
  } else {
    team = await Team.create({
      name: faker.company.name(),
      description: faker.lorem.sentence(),
      owner: companyId,
      members: [],
    });
  }

  return await User.create({
    name: faker.person.firstName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    team: team._id,
    companyOwner: companyId,
    invitedBy: companyId,
    isInvitationAccepted: true,
    enabled: true,
    role: options.role || 'member',
    permissions: options.permissions || [],
    ...options,
  });
};

// Generate JWT token helper
const generateJWT = (userId, companyId) => {
  return jwt.sign(
    {
      _id: userId,
      companyOwner: companyId,
      role: 'user',
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

// Mock Express request object
const mockRequest = (overrides = {}, user = null, company = null) => {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: user || null,
    admin: user || null, // Many controllers expect req.admin
    companyOwner: company || null, // Some controllers expect req.companyOwner
    ...overrides,
  };
  return req;
};

// Mock Express response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// Mock Express next function
const mockNext = jest.fn();

// Generate test JWT token
const generateTestToken = (payload = { _id: 'test-user-id', role: 'owner' }) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Generate test data
const generateTestData = {
  email: () => faker.internet.email(),
  phone: () => faker.phone.number(),
  name: () => faker.person.fullName(),
  company: () => faker.company.name(),
  amount: () => faker.number.int({ min: 100, max: 10000 }),
  currency: () => 'USD',
  password: () => faker.internet.password({ length: 12 }),
  address: () => faker.location.streetAddress(),
  city: () => faker.location.city(),
  country: () => faker.location.country(),
  description: () => faker.lorem.sentence(),
  date: () => faker.date.recent(),
  boolean: () => faker.datatype.boolean(),
};

// Create authenticated request
const createAuthenticatedRequest = (user = null, overrides = {}) => {
  const token = generateTestToken(user);
  return mockRequest({
    headers: {
      authorization: `Bearer ${token}`,
    },
    user,
    ...overrides,
  });
};

// Wait for async operations
const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock database operations
const mockDbOperations = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  deleteMany: jest.fn(),
  updateMany: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
};

// Reset all mocks
const resetMocks = () => {
  Object.values(mockDbOperations).forEach((mock) => mock.mockReset());
  mockNext.mockReset();
};

module.exports = {
  mockRequest,
  mockResponse,
  mockNext,
  generateTestToken,
  generateTestData,
  createAuthenticatedRequest,
  waitFor,
  mockDbOperations,
  resetMocks,
  cleanupDatabase,
  createTestCompany,
  createTestUser,
  generateJWT,
};
