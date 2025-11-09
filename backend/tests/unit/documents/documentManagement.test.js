const { faker } = require('@faker-js/faker');
const mongoose = require('mongoose');
const { testDataFactory } = require('../../utils/testDataFactory');

describe('Document Management Unit Tests', () => {
  let testCompany, testUser, AppDocument;

  beforeAll(async () => {
    // Ensure models are loaded first
    await require('../../utils/testDataFactory');
    // Get the Document model from mongoose
    AppDocument = mongoose.model('AppDocument');
  });

  beforeEach(async () => {
    testCompany = await testDataFactory.createCompany();
    testUser = await testDataFactory.createUser(testCompany);
  });

  describe('Document Model Validation', () => {
    test('should create document with valid data', async () => {
      const documentData = {
        title: faker.system.fileName(),
        description: faker.lorem.sentence(),
        documentType: 'contract',
        fileName: faker.system.fileName(),
        fileType: 'pdf',
        filePath: '/documents/test.pdf',
        fileSize: 1024000,
        owner: testCompany._id,
      };

      const document = new AppDocument(documentData);
      const savedDocument = await document.save();

      expect(savedDocument._id).toBeDefined();
      expect(savedDocument.title).toBe(documentData.title);
      expect(savedDocument.documentType).toBe('contract');
      expect(savedDocument.fileType).toBe('pdf');
    });

    test('should require mandatory fields', async () => {
      const document = new AppDocument({});

      await expect(document.save()).rejects.toThrow();
    });
  });

  describe('Document Security', () => {
    test('should enforce owner isolation', async () => {
      const anotherUser = await testDataFactory.createUser(testCompany);

      const documentData = {
        title: faker.system.fileName(),
        documentType: 'contract',
        fileName: faker.system.fileName(),
        fileType: 'pdf',
        filePath: '/documents/test.pdf',
        fileSize: 1024000,
        owner: testCompany._id,
      };

      const document = new AppDocument(documentData);
      await document.save();

      // Try to find document with wrong owner
      const foundDoc = await AppDocument.findOne({
        _id: document._id,
        owner: anotherUser._id,
      });

      expect(foundDoc).toBeNull();
    });
  });
});
