const TestDataFactory = require('./testDataFactory');

/**
 * Authentication helper for test setup
 */
class AuthHelper {
  /**
   * Create a complete test user with authentication token
   */
  static async createAuthenticatedUser(isOwner = false, userOverrides = {}) {
    if (isOwner) {
      const owner = await TestDataFactory.createCompanyOwner(userOverrides);
      const token = TestDataFactory.generateAuthToken(owner, true);
      return { user: owner, token, isOwner: true };
    } else {
      // Create owner first, then user
      const owner = await TestDataFactory.createCompanyOwner();
      const { user, team } = await TestDataFactory.createUser(owner, userOverrides);
      const token = TestDataFactory.generateAuthToken(user, false);
      return { user, owner, team, token, isOwner: false };
    }
  }

  /**
   * Get authorization headers for requests
   */
  static getAuthHeaders(token) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create authenticated request helper
   */
  static createAuthenticatedRequest(app, method, url, token) {
    const request = require('supertest');
    return request(app)[method](url).set(this.getAuthHeaders(token));
  }

  /**
   * Setup test environment with authenticated users
   */
  static async setupTestEnvironment() {
    // Create a company owner
    const owner = await TestDataFactory.createCompanyOwner();
    const ownerToken = TestDataFactory.generateAuthToken(owner, true);

    // Create a regular user
    const { user, team } = await TestDataFactory.createUser(owner);
    const userToken = TestDataFactory.generateAuthToken(user, false);

    return {
      owner,
      ownerToken,
      user,
      team,
      userToken,
    };
  }
}

module.exports = AuthHelper;
