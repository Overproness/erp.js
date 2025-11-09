const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const { describe, it, beforeAll, beforeEach, expect, fail } = require('@jest/globals');

describe('Core Models', () => {
  let CompanyOwner, CompanyOwnerPassword, Setting;

  beforeAll(async () => {
    CompanyOwner = mongoose.model('CompanyOwner');
    CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
    Setting = mongoose.model('Setting');
  });

  describe('CompanyOwner Model', () => {
    it('should create a company owner with valid data', async () => {
      const ownerData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: 'owner',
        enabled: true,
        onboardingComplete: false,
      };

      const owner = await CompanyOwner.create(ownerData);

      expect(owner).toBeDefined();
      expect(owner.name).toBe(ownerData.name);
      expect(owner.email).toBe(ownerData.email);
      expect(owner.role).toBe('owner');
      expect(owner.enabled).toBe(true);
      expect(owner.onboardingComplete).toBe(false);
      expect(owner.createdAt).toBeDefined();
      expect(owner.updatedAt).toBeDefined();
    });

    it('should require name and email fields', async () => {
      try {
        await CompanyOwner.create({});
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.name).toBeDefined();
        expect(error.errors.email).toBeDefined();
      }
    });

    it('should enforce unique email constraint', async () => {
      const email = faker.internet.email();

      await CompanyOwner.create({
        name: faker.person.fullName(),
        email,
        role: 'owner',
      });

      try {
        await CompanyOwner.create({
          name: faker.person.fullName(),
          email,
          role: 'owner',
        });
        fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).toBe(11000);
      }
    });

    it('should validate email format', async () => {
      try {
        await CompanyOwner.create({
          name: faker.person.fullName(),
          email: 'invalid-email',
          role: 'owner',
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.email).toBeDefined();
      }
    });

    it('should set default values correctly', async () => {
      const owner = await CompanyOwner.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
      });

      expect(owner.enabled).toBe(true);
      expect(owner.onboardingComplete).toBe(false);
      expect(owner.role).toBe('owner');
    });
  });

  describe('CompanyOwnerPassword Model', () => {
    let testOwner;

    beforeEach(async () => {
      testOwner = await global.testUtils.createTestCompanyOwner();
    });

    it('should create password record for company owner', async () => {
      const password = await CompanyOwnerPassword.create({
        user: testOwner._id,
        salt: 'test-salt',
        password: 'hashed-password',
        emailVerified: true,
        authType: 'email',
      });

      expect(password).toBeDefined();
      expect(password.user).toEqual(testOwner._id);
      expect(password.salt).toBe('test-salt');
      expect(password.password).toBe('hashed-password');
      expect(password.emailVerified).toBe(true);
      expect(password.authType).toBe('email');
    });

    it('should require user reference', async () => {
      try {
        await CompanyOwnerPassword.create({
          salt: 'test-salt',
          password: 'hashed-password',
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.user).toBeDefined();
      }
    });

    it('should set default values for emailVerified and authType', async () => {
      const password = await CompanyOwnerPassword.create({
        user: testOwner._id,
        salt: 'test-salt',
        password: 'hashed-password',
      });

      expect(password.emailVerified).toBe(false);
      expect(password.authType).toBe('email');
    });
  });

  describe('Setting Model', () => {
    it('should create settings with valid data', async () => {
      const settingData = {
        key: 'test_setting',
        value: { enabled: true, config: { maxItems: 100 } },
        description: 'Test setting for unit tests',
      };

      const setting = await Setting.create(settingData);

      expect(setting).toBeDefined();
      expect(setting.key).toBe(settingData.key);
      expect(setting.value).toEqual(settingData.value);
      expect(setting.description).toBe(settingData.description);
    });

    it('should require key field', async () => {
      try {
        await Setting.create({
          value: { test: true },
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.key).toBeDefined();
      }
    });

    it('should enforce unique key constraint', async () => {
      const key = 'unique_setting';

      await Setting.create({
        key,
        value: { test: 'value1' },
      });

      try {
        await Setting.create({
          key,
          value: { test: 'value2' },
        });
        fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).toBe(11000);
      }
    });

    it('should allow mixed type values', async () => {
      const stringValue = await Setting.create({
        key: 'string_setting',
        value: 'string value',
      });

      const objectValue = await Setting.create({
        key: 'object_setting',
        value: { nested: { data: true } },
      });

      const arrayValue = await Setting.create({
        key: 'array_setting',
        value: [1, 2, 3, 'test'],
      });

      expect(stringValue.value).toBe('string value');
      expect(objectValue.value).toEqual({ nested: { data: true } });
      expect(arrayValue.value).toEqual([1, 2, 3, 'test']);
    });
  });
});
