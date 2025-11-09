const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  describe,
  test,
  beforeAll,
  afterAll,
  afterEach,
  expect,
  beforeEach,
} = require('@jest/globals');

// Import the controllers to test
const createCRUDController = require('../../../src/controllers/middlewaresControllers/createCRUDController');
const createAuthMiddleware = require('../../../src/controllers/middlewaresControllers/createAuthMiddleware');
const createUserController = require('../../../src/controllers/middlewaresControllers/createUserController');

describe('Middleware Controllers', () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Load required models
    require('../../../src/models/coreModels/CompanyOwner');
    require('../../../src/models/coreModels/CompanyOwnerPassword');
    require('../../../src/models/coreModels/Setting');
    require('../../../src/models/appModels/Client');
    require('../../../src/models/appModels/Invoice');
    require('../../../src/models/appModels/User');
    require('../../../src/models/appModels/Team');

    // Setup Express app for testing
    app = express();
    app.use(express.json());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('createCRUDController', () => {
    let clientController;
    let Client;

    beforeAll(() => {
      Client = mongoose.model('Client');
      clientController = createCRUDController('Client');
    });

    test('should create a CRUD controller with all required methods', () => {
      expect(clientController).toBeDefined();
      expect(typeof clientController.create).toBe('function');
      expect(typeof clientController.read).toBe('function');
      expect(typeof clientController.update).toBe('function');
      expect(typeof clientController.delete).toBe('function');
      expect(typeof clientController.list).toBe('function');
      expect(typeof clientController.listAll).toBe('function');
      expect(typeof clientController.search).toBe('function');
      expect(typeof clientController.filter).toBe('function');
      expect(typeof clientController.summary).toBe('function');
    });

    test('should throw error for non-existent model', () => {
      expect(() => {
        createCRUDController('NonExistentModel');
      }).toThrow('Model NonExistentModel does not exist');
    });

    describe('CRUD Operations', () => {
      let testClient;

      beforeEach(async () => {
        testClient = await Client.create({
          name: 'Test Client',
          email: 'test@example.com',
        });
      });

      test('create method should create new document', async () => {
        const req = {
          body: {
            name: 'New Client',
            email: 'new@example.com',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await clientController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            result: expect.objectContaining({
              name: 'New Client',
              email: 'new@example.com',
            }),
          })
        );
      });

      test('read method should return document by ID', async () => {
        const req = {
          params: { id: testClient._id.toString() },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await clientController.read(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            result: expect.objectContaining({
              name: 'Test Client',
              email: 'test@example.com',
            }),
          })
        );
      });

      test('read method should return 404 for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const req = {
          params: { id: nonExistentId.toString() },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await clientController.read(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      });

      test('update method should update document', async () => {
        const req = {
          params: { id: testClient._id.toString() },
          body: {
            name: 'Updated Client',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await clientController.update(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            result: expect.objectContaining({
              name: 'Updated Client',
            }),
          })
        );
      });

      test('delete method should soft delete document', async () => {
        const req = {
          params: { id: testClient._id.toString() },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await clientController.delete(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
          })
        );

        // Verify soft delete
        const deletedClient = await Client.findById(testClient._id);
        expect(deletedClient.removed).toBe(true);
      });

      test('list method should return paginated results', async () => {
        // Create additional test data
        await Client.create({ name: 'Client 2', email: 'client2@example.com' });
        await Client.create({ name: 'Client 3', email: 'client3@example.com' });

        const req = {
          query: { page: 1, items: 2 },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await clientController.list(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            result: expect.arrayContaining([expect.objectContaining({ name: expect.any(String) })]),
            pagination: expect.objectContaining({
              page: 1,
              pages: expect.any(Number),
              count: expect.any(Number),
            }),
          })
        );
      });

      test('search method should find documents by query', async () => {
        const req = {
          query: { q: 'Test' },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await clientController.search(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            result: expect.arrayContaining([expect.objectContaining({ name: 'Test Client' })]),
          })
        );
      });

      test('summary method should return document statistics', async () => {
        const req = {};
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await clientController.summary(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            result: expect.objectContaining({
              total: expect.any(Number),
            }),
          })
        );
      });
    });

    describe('Error Handling', () => {
      test('should handle validation errors', async () => {
        const req = {
          body: {
            // Missing required fields
            email: 'invalid-email',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await clientController.create(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      });

      test('should handle database errors gracefully', async () => {
        // Force a database error by using invalid ObjectId
        const req = {
          params: { id: 'invalid-id' },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await clientController.read(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      });
    });
  });

  describe('createAuthMiddleware', () => {
    let authMiddleware;
    let CompanyOwner;
    let CompanyOwnerPassword;

    beforeAll(() => {
      CompanyOwner = mongoose.model('CompanyOwner');
      CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
      authMiddleware = createAuthMiddleware('CompanyOwner');
    });

    test('should create auth middleware with all required methods', () => {
      expect(authMiddleware).toBeDefined();
      expect(typeof authMiddleware.register).toBe('function');
      expect(typeof authMiddleware.login).toBe('function');
      expect(typeof authMiddleware.logout).toBe('function');
      expect(typeof authMiddleware.isValidAuthToken).toBe('function');
      expect(typeof authMiddleware.forgetPassword).toBe('function');
      expect(typeof authMiddleware.resetPassword).toBe('function');
    });

    describe('Registration', () => {
      test('should register new user with valid data', async () => {
        const req = {
          body: {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123!',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          cookie: jest.fn(),
        };

        await authMiddleware.register(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: expect.stringContaining('registered'),
          })
        );

        // Verify user was created
        const user = await CompanyOwner.findOne({ email: 'john@example.com' });
        expect(user).toBeTruthy();
        expect(user.name).toBe('John Doe');
      });

      test('should reject registration with invalid data', async () => {
        const req = {
          body: {
            // Missing required fields
            email: 'invalid-email',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await authMiddleware.register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      });

      test('should reject duplicate email registration', async () => {
        // First registration
        await CompanyOwner.create({
          name: 'Existing User',
          email: 'existing@example.com',
        });

        const req = {
          body: {
            name: 'Another User',
            email: 'existing@example.com',
            password: 'Password123!',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await authMiddleware.register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      });
    });

    describe('Login', () => {
      let testUser;
      let bcrypt;

      beforeEach(async () => {
        bcrypt = require('bcryptjs');
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(salt + 'Password123!');

        testUser = await CompanyOwner.create({
          name: 'Test User',
          email: 'test@example.com',
          enabled: true,
        });

        await CompanyOwnerPassword.create({
          user: testUser._id,
          salt: salt,
          password: hashedPassword,
          emailVerified: true,
        });
      });

      test('should login with valid credentials', async () => {
        const req = {
          body: {
            email: 'test@example.com',
            password: 'Password123!',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          cookie: jest.fn(),
        };

        await authMiddleware.login(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: expect.stringContaining('logged in'),
          })
        );
        expect(res.cookie).toHaveBeenCalled();
      });

      test('should reject login with invalid password', async () => {
        const req = {
          body: {
            email: 'test@example.com',
            password: 'WrongPassword',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await authMiddleware.login(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      });

      test('should reject login for non-existent user', async () => {
        const req = {
          body: {
            email: 'nonexistent@example.com',
            password: 'Password123!',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await authMiddleware.login(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      });

      test('should reject login for disabled user', async () => {
        await CompanyOwner.findByIdAndUpdate(testUser._id, { enabled: false });

        const req = {
          body: {
            email: 'test@example.com',
            password: 'Password123!',
          },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await authMiddleware.login(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
      });
    });

    describe('Token Validation', () => {
      let jwt;
      let testUser;

      beforeEach(async () => {
        jwt = require('jsonwebtoken');
        testUser = await CompanyOwner.create({
          name: 'Test User',
          email: 'test@example.com',
          enabled: true,
        });
      });

      test('should validate valid token', async () => {
        const token = jwt.sign(
          { id: testUser._id, email: testUser.email },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '1h' }
        );

        const req = {
          cookies: { token },
          headers: {},
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        const next = jest.fn();

        await authMiddleware.isValidAuthToken(req, res, next);

        expect(req.companyOwner).toBeDefined();
        expect(req.companyOwner._id.toString()).toBe(testUser._id.toString());
        expect(next).toHaveBeenCalled();
      });

      test('should reject invalid token', async () => {
        const req = {
          cookies: { token: 'invalid-token' },
          headers: {},
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        const next = jest.fn();

        await authMiddleware.isValidAuthToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
        expect(next).not.toHaveBeenCalled();
      });

      test('should reject missing token', async () => {
        const req = {
          cookies: {},
          headers: {},
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        const next = jest.fn();

        await authMiddleware.isValidAuthToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          })
        );
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Logout', () => {
      test('should logout user successfully', async () => {
        const req = {
          companyOwner: { _id: 'test-id' },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          clearCookie: jest.fn(),
        };

        await authMiddleware.logout(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: expect.stringContaining('logged out'),
          })
        );
        expect(res.clearCookie).toHaveBeenCalledWith('token');
      });
    });
  });

  describe('createUserController', () => {
    let userController;
    let testUser;

    beforeAll(() => {
      userController = createUserController('CompanyOwner');
    });

    beforeEach(async () => {
      const CompanyOwner = mongoose.model('CompanyOwner');
      testUser = await CompanyOwner.create({
        name: 'Test User',
        email: 'test@example.com',
        enabled: true,
      });
    });

    test('should create user controller with required methods', () => {
      expect(userController).toBeDefined();
      expect(typeof userController.read).toBe('function');
      expect(typeof userController.updateProfile).toBe('function');
      expect(typeof userController.updatePassword).toBe('function');
      expect(typeof userController.updateProfilePassword).toBe('function');
    });

    test('read method should return user profile', async () => {
      const req = {
        params: { id: testUser._id.toString() },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await userController.read(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            _id: testUser._id,
            name: 'Test User',
            email: 'test@example.com',
          }),
        })
      );
    });

    test('updateProfile method should update user profile', async () => {
      const req = {
        params: { id: testUser._id.toString() },
        body: {
          name: 'Updated Name',
          phone: '+1234567890',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );

      // Verify update
      const CompanyOwner = mongoose.model('CompanyOwner');
      const updatedUser = await CompanyOwner.findById(testUser._id);
      expect(updatedUser.name).toBe('Updated Name');
    });
  });
});
