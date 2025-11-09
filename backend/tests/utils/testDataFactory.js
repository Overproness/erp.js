const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Ensure all models are loaded
require('../../src/models/coreModels/CompanyOwner');
require('../../src/models/coreModels/CompanyOwnerPassword');
require('../../src/models/coreModels/Setting');
require('../../src/models/coreModels/Counter'); // Add Counter model
require('../../src/models/appModels/User');
require('../../src/models/appModels/Team');
require('../../src/models/appModels/Document'); // Fixed: removed documentModel, kept Document
require('../../src/models/appModels/Client');
require('../../src/models/appModels/Invoice');
require('../../src/models/appModels/Quote');
require('../../src/models/appModels/Payment');
require('../../src/models/appModels/PaymentMode');
require('../../src/models/appModels/Taxes');
require('../../src/models/appModels/Campaign');

class TestDataFactory {
  /**
   * Create a test company owner
   */
  static async createCompanyOwner(overrides = {}) {
    const CompanyOwner = mongoose.model('CompanyOwner');
    const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');

    const defaultPassword = 'password123';
    const plainPassword = overrides.password || defaultPassword;

    const ownerData = {
      email: `${faker.string.alphanumeric(8)}-${Date.now()}@${faker.internet.domainName()}`,
      name: faker.person.firstName(),
      surname: faker.person.lastName(),
      enabled: true,
      removed: false,
      role: 'owner',
      onboardingComplete: true,
      ...overrides,
    };

    // Remove password from owner data as it's stored separately
    delete ownerData.password;

    // Add timeout wrapper for database operations
    const createOwnerWithTimeout = async () => {
      const owner = await new CompanyOwner(ownerData).save();

      // Create password record using synchronous bcrypt for faster execution
      const salt = faker.string.alphanumeric(10);
      const hashedPassword = bcrypt.hashSync(salt + plainPassword, 10); // Use sync version

      await new CompanyOwnerPassword({
        user: owner._id,
        password: hashedPassword,
        salt: salt,
        removed: false,
        loggedSessions: [],
      }).save();

      return owner;
    };

    // Add timeout protection
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('createCompanyOwner timed out')), 15000);
    });

    try {
      return await Promise.race([createOwnerWithTimeout(), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Create a test user with team
   */
  static async createUser(owner, overrides = {}) {
    const User = mongoose.model('User');
    const Team = mongoose.model('Team');

    // Create team first
    const team = await new Team({
      name: faker.company.name(),
      description: faker.lorem.sentence(),
      owner: owner._id,
      members: [],
    }).save();

    const userData = {
      name: faker.person.firstName(),
      email: `${faker.string.alphanumeric(8)}-${Date.now()}@${faker.internet.domainName()}`,
      password: await bcrypt.hash('password123', 10),
      team: team._id,
      companyOwner: owner._id,
      invitedBy: owner._id,
      isInvitationAccepted: true,
      enabled: true,
      removed: false,
      role: 'member',
      ...overrides,
    };

    const user = await new User(userData).save();

    // Add user to team with proper member object structure
    team.members.push({
      user: user._id,
      role: userData.role || 'member',
      joinedAt: new Date(),
      updatedAt: new Date(),
    });
    await team.save();

    return { user, team };
  }

  /**
   * Create a test client - SIMPLIFIED to avoid auto-populate hanging issues
   */
  static async createClient(owner, overrides = {}) {
    const Client = mongoose.model('Client');

    const createClientWithTimeout = async () => {
      // Minimal client data to avoid auto-populate issues
      const clientData = {
        name: faker.person.fullName(),
        email: `test-client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@example.com`,
        phone: faker.phone.number(),
        country: faker.location.country(),
        address: faker.location.streetAddress(),
        owner: owner._id,
        // DO NOT set createdBy, updatedBy, removedBy to avoid auto-populate hanging
        enabled: true,
        removed: false,
        customerType: faker.helpers.arrayElement(['individual', 'company']),
        // Remove complex nested structures that can cause hanging
        ...overrides,
      };

      // Create and save client without auto-populate fields
      return await new Client(clientData).save();
    };

    // Add timeout protection (reduced to 15 seconds)
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('createClient timed out after 15 seconds')),
        15000
      );
    });

    try {
      return await Promise.race([createClientWithTimeout(), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Create a test invoice
   */
  static async createInvoice(owner, client, overrides = {}) {
    const Invoice = mongoose.model('Invoice');

    const items = [
      {
        itemName: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        quantity: faker.number.int({ min: 1, max: 10 }),
        price: faker.number.float({ min: 10, max: 500 }),
        total: 0, // Will be calculated
      },
    ];

    // Calculate totals
    items.forEach((item) => {
      item.total = item.quantity * item.price;
    });

    const subTotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 10; // 10%
    const taxTotal = subTotal * (taxRate / 100);
    const total = subTotal + taxTotal;

    const invoiceData = {
      number: faker.number.int({ min: 1000, max: 9999 }),
      year: new Date().getFullYear(),
      date: faker.date.recent(),
      expiredDate: faker.date.future(),
      client: client._id,
      items,
      subTotal,
      taxTotal,
      taxRate,
      total,
      credit: 0,
      discount: 0,
      currency: 'USD',
      paymentStatus: 'unpaid',
      status: 'draft',
      owner: owner._id,
      createdBy: owner._id,
      removed: false,
      ...overrides,
    };

    return await new Invoice(invoiceData).save();
  }

  /**
   * Create a test payment
   */
  static async createPayment(owner, client, invoice, overrides = {}) {
    const Payment = mongoose.model('Payment');

    // Create a payment mode if not provided
    let paymentMode = overrides.paymentMode;
    if (!paymentMode) {
      const createdPaymentMode = await this.createPaymentMode(owner);
      paymentMode = createdPaymentMode._id;
    }

    const paymentData = {
      number: faker.number.int({ min: 1000, max: 9999 }),
      client: client._id,
      invoice: invoice._id,
      paymentMode: paymentMode,
      date: faker.date.recent(),
      amount: faker.number.float({ min: 100, max: 1000 }),
      currency: 'USD',
      ref: faker.string.alphanumeric(10),
      description: faker.lorem.sentence(),
      owner: owner._id,
      createdBy: owner._id,
      removed: false,
      ...overrides,
    };

    return await new Payment(paymentData).save();
  }

  /**
   * Create a test document
   */
  static async createDocument(owner, overrides = {}) {
    const Document = mongoose.model('AppDocument');

    const documentData = {
      title: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      fileName: `${faker.lorem.word()}.pdf`,
      fileType: 'pdf', // Use simple extension, not MIME type
      fileSize: faker.number.int({ min: 1000, max: 1000000 }),
      filePath: `${faker.string.uuid()}.pdf`, // Remove leading slash
      documentType: faker.helpers.arrayElement(['contract', 'invoice', 'report']),
      tags: [faker.lorem.word(), faker.lorem.word()],
      owner: owner._id,
      createdBy: owner._id,
      removed: false,
      ...overrides,
    };

    return await new Document(documentData).save();
  }

  /**
   * Create a test quote
   */
  static async createQuote(owner, client, overrides = {}) {
    const Quote = mongoose.model('Quote');

    const items = [
      {
        itemName: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        quantity: faker.number.int({ min: 1, max: 10 }),
        price: faker.number.float({ min: 10, max: 500 }),
        total: 0, // Will be calculated
      },
    ];

    // Calculate totals
    items.forEach((item) => {
      item.total = item.quantity * item.price;
    });

    const subTotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 10; // 10%
    const taxTotal = subTotal * (taxRate / 100);
    const total = subTotal + taxTotal;

    const quoteData = {
      number: faker.number.int({ min: 1000, max: 9999 }),
      year: new Date().getFullYear(),
      date: faker.date.recent(),
      expiredDate: faker.date.future(),
      client: client._id,
      items,
      subTotal,
      taxTotal,
      taxRate,
      total,
      currency: 'USD',
      status: 'draft',
      owner: owner._id,
      createdBy: owner._id,
      removed: false,
      ...overrides,
    };

    return await new Quote(quoteData).save();
  }

  /**
   * Generate a valid JWT token for testing
   */
  static generateAuthToken(user, isOwner = false) {
    const payload = isOwner
      ? {
          id: user._id || user.id,
          email: user.email,
          role: user.role || 'owner',
        }
      : {
          id: user._id || user.id,
          email: user.email,
          companyOwner: user.companyOwner,
          role: user.role || 'member',
          isUser: true, // Required flag for User authentication
        };

    return jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only', {
      expiresIn: '1h',
    });
  }

  /**
   * Alias for generateAuthToken for backwards compatibility
   */
  static generateJWT(user, isOwner = false) {
    return this.generateAuthToken(user, isOwner);
  }

  /**
   * Generate and register a valid JWT token for testing with session management
   */
  static async generateValidToken(user, isOwner = false) {
    const token = this.generateAuthToken(user, isOwner);

    if (isOwner) {
      // For CompanyOwner, add token to loggedSessions
      const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
      await CompanyOwnerPassword.findOneAndUpdate(
        { user: user._id, removed: false },
        { $addToSet: { loggedSessions: token } }
      );
    } else {
      // For User, add token to loggedSessions if UserPassword model exists
      try {
        const UserPassword = mongoose.model('UserPassword');
        await UserPassword.findOneAndUpdate(
          { user: user._id, removed: false },
          { $addToSet: { loggedSessions: token } },
          { upsert: true }
        );
      } catch (err) {
        // UserPassword model doesn't exist, continue without session management
        console.log('UserPassword model not found, skipping session management for user token');
      }
    }

    return token;
  }

  /**
   * Create a test payment mode
   */
  static async createPaymentMode(owner, overrides = {}) {
    const PaymentMode = mongoose.model('PaymentMode');

    const paymentModeData = {
      name: faker.helpers.arrayElement(['cash', 'credit_card', 'bank_transfer', 'check']),
      description: faker.lorem.sentence(),
      isDefault: false,
      enabled: true,
      owner: owner._id || owner,
      ...overrides,
    };

    return await new PaymentMode(paymentModeData).save();
  }

  /**
   * Create a test company (alias for createCompanyOwner)
   */
  static async createCompany(overrides = {}) {
    return await this.createCompanyOwner(overrides);
  }

  /**
   * Create authenticated request helper
   */
  static createAuthenticatedRequest(app, method, url, user, isOwner = false) {
    const request = require('supertest');
    const token = this.generateAuthToken(user, isOwner);

    return request(app)
      [method](url)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
  }

  /**
   * Create a test campaign
   */
  static async createCampaign(overrides = {}) {
    // Ensure Campaign model is loaded
    const Campaign = require('../../src/models/appModels/Campaign');

    const campaignData = {
      name: faker.company.catchPhrase(),
      description: faker.lorem.sentence(),
      type: 'email',
      status: 'draft',
      startDate: new Date(),
      endDate: faker.date.future(),
      targetSegments: [],
      excludeSegments: [],
      content: {
        subject: faker.lorem.sentence(),
        customHtml: faker.lorem.paragraphs(3),
        templateVariables: {},
      },
      channels: [
        {
          type: 'email',
          enabled: true,
          configuration: {},
          deliveryOrder: 0,
          delayHours: 0,
        },
      ],
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        bounced: 0,
        unsubscribed: 0,
        complained: 0,
        revenue: 0,
      },
      aiOptimization: {
        enabled: false,
        optimizeFor: 'clicks',
        testingPercent: 10,
        variants: [],
      },
      tracking: {
        utmSource: 'test',
        utmMedium: 'email',
        utmCampaign: faker.string.alphanumeric(8),
      },
      removed: false,
      created: new Date(),
      updated: new Date(),
      ...overrides,
    };

    return await new Campaign(campaignData).save();
  }
}

// Export both the class and an instance for compatibility
module.exports = TestDataFactory;
module.exports.testDataFactory = TestDataFactory;
