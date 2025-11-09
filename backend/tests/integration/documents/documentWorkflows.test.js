const request = require('supertest');
const app = require('../../../src/app');
const { testDataFactory } = require('../../utils/testDataFactory');

describe('Document Management Integration Tests', () => {
  let testCompany, authToken;

  beforeEach(async () => {
    testCompany = await testDataFactory.createCompany();
    authToken = testDataFactory.generateAuthToken(testCompany, true); // Use company owner token
  });

  describe('Document Upload Workflow', () => {
    test('should upload document successfully', async () => {
      const documentData = {
        title: 'test-document.pdf',
        description: 'Test document upload',
        documentType: 'contract',
      };

      const response = await request(app)
        .post('/api/document/create')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', documentData.title)
        .field('documentType', documentData.documentType)
        .field('description', documentData.description)
        .attach('file', Buffer.from('test file content'), 'test.pdf')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.title).toBe(documentData.title);
      expect(response.body.result.owner.toString()).toBe(testCompany._id.toString());
    });

    test('should reject unauthorized upload', async () => {
      const response = await request(app)
        .post('/api/document/create')
        .field('title', 'unauthorized.pdf')
        .field('documentType', 'document')
        .attach('file', Buffer.from('test'), 'test.pdf')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should validate file type restrictions', async () => {
      const response = await request(app)
        .post('/api/document/create')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'malicious.exe')
        .field('documentType', 'other')
        .attach('file', Buffer.from('executable content'), 'malicious.exe')
        .expect(400); // Should reject malicious file types

      expect(response.body.success).toBe(false); // Should fail validation
    });

    test('should enforce file size limits', async () => {
      const largeBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB

      const response = await request(app)
        .post('/api/document/create')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'large-file.pdf')
        .field('documentType', 'document')
        .attach('file', largeBuffer, 'large-file.pdf')
        .expect(413);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('size');
    });
  });

  describe('Document Retrieval Workflow', () => {
    test('should list company documents', async () => {
      await testDataFactory.createDocument(testCompany, {
        title: 'doc1.pdf',
      });

      await testDataFactory.createDocument(testCompany, {
        title: 'doc2.pdf',
      });

      const response = await request(app)
        .get('/api/document/list')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.items.length).toBe(2);
      expect(response.body.result.items[0].owner.toString()).toBe(testCompany._id.toString());
    });

    test('should get specific document', async () => {
      const document = await testDataFactory.createDocument(testCompany, {
        title: 'specific-doc.pdf',
      });

      const response = await request(app)
        .get(`/api/document/read/${document._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.title).toBe('specific-doc.pdf');
    });

    test('should enforce company isolation in retrieval', async () => {
      const otherCompany = await testDataFactory.createCompany();
      const otherDocument = await testDataFactory.createDocument(otherCompany);

      const response = await request(app)
        .get(`/api/document/read/${otherDocument._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Document Search Workflow', () => {
    test('should search documents by name', async () => {
      await testDataFactory.createDocument(testCompany, {
        title: 'service-agreement.pdf',
        description: 'Legal service agreement',
      });

      const response = await request(app)
        .get('/api/document/search')
        .query({ q: 'service', type: 'name' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.length).toBeGreaterThan(0);
      expect(response.body.result[0].title).toContain('service');
    });

    test('should filter by category', async () => {
      await testDataFactory.createDocument(testCompany, {
        documentType: 'contract',
      });

      const response = await request(app)
        .get('/api/document/list')
        .query({ category: 'contract' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.items.every((doc) => doc.documentType === 'contract')).toBe(true);
    });

    test('should paginate search results', async () => {
      // Create multiple documents
      for (let i = 0; i < 15; i++) {
        await testDataFactory.createDocument(testCompany, {
          title: `doc-${i}.pdf`,
        });
      }

      const response = await request(app)
        .get('/api/document/list')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.items.length).toBe(10);
      expect(response.body.result.pagination.page).toBe(1);
      expect(response.body.result.pagination.total).toBe(15);
    });
  });

  describe('Document Update Workflow', () => {
    test('should update document metadata', async () => {
      const document = await testDataFactory.createDocument(testCompany, {
        title: 'original-name.pdf',
        description: 'Original description',
      });

      const updateData = {
        title: 'updated-name.pdf',
        description: 'Updated description',
        tags: ['updated', 'modified'],
      };

      const response = await request(app)
        .patch(`/api/document/update/${document._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.title).toBe('updated-name.pdf');
      expect(response.body.result.description).toBe('Updated description');
    });

    test('should create new version on content update', async () => {
      const document = await testDataFactory.createDocument(testCompany, {
        title: 'versioned-doc.pdf',
        fileType: 'pdf',
      });

      const response = await request(app)
        .post(`/api/document/${document._id}/edit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'updated content',
          editSummary: 'Updated document content',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.updated).toBeDefined();
    });
  });

  describe('Document Deletion Workflow', () => {
    test('should soft delete document', async () => {
      const document = await testDataFactory.createDocument(testCompany);

      const response = await request(app)
        .delete(`/api/document/delete/${document._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify soft deletion
      const Document = require('../../../src/models/appModels/Document');
      const deletedDoc = await Document.findById(document._id);
      expect(deletedDoc.removed).toBe(true);
    });

    test('should permanently delete on admin request', async () => {
      const document = await testDataFactory.createDocument(testCompany);

      const response = await request(app)
        .delete(`/api/document/delete/${document._id}`)
        .query({ permanent: true })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify permanent deletion
      const Document = require('../../../src/models/appModels/Document');
      const deletedDoc = await Document.findById(document._id);
      expect(deletedDoc).toBeNull();
    });

    test('should prevent unauthorized deletion', async () => {
      const otherCompany = await testDataFactory.createCompany();
      const otherToken = testDataFactory.generateAuthToken(otherCompany, true);

      const document = await testDataFactory.createDocument(testCompany);

      const response = await request(app)
        .delete(`/api/document/delete/${document._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404); // Should be 404 since they can't access the document

      expect(response.body.success).toBe(false);
    });
  });

  describe('Document Sharing Workflow', () => {
    test('should share document with users', async () => {
      const otherCompany = await testDataFactory.createCompany();
      const otherUserResult = await testDataFactory.createUser(otherCompany);

      const document = await testDataFactory.createDocument(testCompany);

      const response = await request(app)
        .post(`/api/document/${document._id}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userIds: [otherUserResult.user._id],
          permissions: ['read', 'write'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.collaborators).toBeDefined();
    });

    test('should generate shareable link', async () => {
      const document = await testDataFactory.createDocument(testCompany);

      const response = await request(app)
        .post(`/api/document/${document._id}/link`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          expiresIn: '7d',
          permissions: ['read'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.shareLink).toBeDefined();
      expect(response.body.result.expiresAt).toBeDefined();
    });
  });
});
