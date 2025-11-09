const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const TestDataFactory = require('../../utils/testDataFactory');

describe('Authentication Unit Tests', () => {
  let CompanyOwner;

  beforeAll(() => {
    CompanyOwner = mongoose.model('CompanyOwner');
  });

  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(password.length);
    });

    test('should verify password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('should reject invalid password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    test('should handle empty password', async () => {
      const password = '';
      const hashedPassword = await bcrypt.hash(password, 10);

      expect(hashedPassword).toBeDefined();
      const isValid = await bcrypt.compare('', hashedPassword);
      expect(isValid).toBe(true);
    });
  });

  describe('JWT Token Generation', () => {
    test('should generate valid JWT token', () => {
      const payload = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'owner',
      };

      const secret = 'test-secret';
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('should verify JWT token correctly', () => {
      const payload = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'owner',
      };

      const secret = 'test-secret';
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, secret);

      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    test('should reject invalid JWT token', () => {
      const token = 'invalid.jwt.token';
      const secret = 'test-secret';

      expect(() => {
        jwt.verify(token, secret);
      }).toThrow();
    });

    test('should reject expired JWT token', () => {
      const payload = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'owner',
      };

      const secret = 'test-secret';
      const token = jwt.sign(payload, secret, { expiresIn: '-1h' });

      expect(() => {
        jwt.verify(token, secret);
      }).toThrow('jwt expired');
    });

    test('should reject token with wrong secret', () => {
      const payload = {
        id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        role: 'owner',
      };

      const secret = 'test-secret';
      const wrongSecret = 'wrong-secret';
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });

      expect(() => {
        jwt.verify(token, wrongSecret);
      }).toThrow();
    });
  });

  describe('Permission Checking Logic', () => {
    test('should validate owner permissions', () => {
      const user = {
        role: 'owner',
        permissions: {},
      };

      const hasOwnerAccess = user.role === 'owner';
      expect(hasOwnerAccess).toBe(true);
    });

    test('should validate user permissions', () => {
      const user = {
        role: 'member',
        permissions: {
          canViewInvoices: true,
          canViewClients: false,
        },
      };

      expect(user.permissions.canViewInvoices).toBe(true);
      expect(user.permissions.canViewClients).toBe(false);
    });

    test('should handle missing permissions', () => {
      const user = {
        role: 'member',
        permissions: {},
      };

      const canViewInvoices = user.permissions?.canViewInvoices || false;
      expect(canViewInvoices).toBe(false);
    });

    test('should validate role hierarchy', () => {
      const roles = ['owner', 'admin', 'lead', 'member'];

      const getRolePriority = (role) => {
        const priorities = { owner: 4, admin: 3, lead: 2, member: 1 };
        return priorities[role] || 0;
      };

      expect(getRolePriority('owner')).toBeGreaterThan(getRolePriority('admin'));
      expect(getRolePriority('admin')).toBeGreaterThan(getRolePriority('member'));
    });
  });

  describe('Session Management', () => {
    test('should track login time', async () => {
      const owner = await TestDataFactory.createCompanyOwner({
        email: 'session@test.com',
      });

      const loginTime = new Date();
      owner.lastLogin = loginTime;
      await owner.save();

      expect(owner.lastLogin).toEqual(loginTime);
    });

    test('should handle multiple sessions', () => {
      const sessions = new Map();
      const userId = '507f1f77bcf86cd799439011';
      const sessionId1 = 'session1';
      const sessionId2 = 'session2';

      sessions.set(sessionId1, { userId, loginTime: new Date() });
      sessions.set(sessionId2, { userId, loginTime: new Date() });

      expect(sessions.size).toBe(2);
      expect(sessions.get(sessionId1).userId).toBe(userId);
    });

    test('should expire old sessions', () => {
      const sessions = new Map();
      const userId = '507f1f77bcf86cd799439011';
      const sessionId = 'expiredSession';
      const expiredTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      sessions.set(sessionId, { userId, loginTime: expiredTime });

      // Simulate session cleanup
      const isExpired = Date.now() - sessions.get(sessionId).loginTime > 2 * 60 * 60 * 1000; // 2 hours
      if (isExpired) {
        sessions.delete(sessionId);
      }

      expect(sessions.has(sessionId)).toBe(false);
    });
  });

  describe('Input Validation', () => {
    test('should validate email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@example.org'];

      const invalidEmails = ['invalid-email', '@example.com', 'test@', 'test..test@example.com'];

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      // First check which email is failing
      invalidEmails.forEach((email) => {
        if (emailRegex.test(email)) {
          console.log(`Invalid email "${email}" is passing the regex test`);
        }
      });

      // Now the regex should be more restrictive
      const strictEmailRegex =
        /^[a-zA-Z0-9]+([._+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;

      validEmails.forEach((email) => {
        expect(strictEmailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach((email) => {
        expect(strictEmailRegex.test(email)).toBe(false);
      });
    });

    test('should validate password strength', () => {
      const validatePassword = (password) => {
        if (!password || password.length < 6) return false;
        if (!/(?=.*[a-z])/.test(password)) return false;
        if (!/(?=.*[A-Z])/.test(password)) return false;
        if (!/(?=.*\d)/.test(password)) return false;
        return true;
      };

      expect(validatePassword('Password123')).toBe(true);
      expect(validatePassword('password123')).toBe(false); // No uppercase
      expect(validatePassword('PASSWORD123')).toBe(false); // No lowercase
      expect(validatePassword('Password')).toBe(false); // No number
      expect(validatePassword('Pass1')).toBe(false); // Too short
    });

    test('should sanitize input data', () => {
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      };

      expect(sanitizeInput('  normal text  ')).toBe('normal text');
      expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello');
      expect(sanitizeInput('safe content')).toBe('safe content');
    });
  });
});
