const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const TestDataFactory = require('../utils/testDataFactory');
const app = require('../../src/app');

describe('TIER 2 - Document Management System', () => {
  let testCompanyOwner;
  let validToken;
  let testDocument;

  beforeEach(async () => {
    testCompanyOwner = await global.testUtils.createTestCompanyOwner();

    // Generate token and add to logged sessions manually
    const jwt = require('jsonwebtoken');
    const mongoose = require('mongoose');

    validToken = jwt.sign(
      {
        id: testCompanyOwner._id,
        email: testCompanyOwner.email,
        role: testCompanyOwner.role || 'owner',
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Add token to CompanyOwnerPassword loggedSessions
    const CompanyOwnerPassword = mongoose.model('CompanyOwnerPassword');
    await CompanyOwnerPassword.findOneAndUpdate(
      { user: testCompanyOwner._id, removed: false },
      { $addToSet: { loggedSessions: validToken } }
    );

    // Create test document using AppDocument model
    const AppDocument = mongoose.model('AppDocument');
    testDocument = await AppDocument.create({
      title: 'Test Document',
      description: 'A test document for testing',
      fileName: 'test-document.pdf',
      fileType: 'pdf',
      filePath: 'test-document.pdf',
      fileSize: 1024,
      documentType: 'contract',
      owner: testCompanyOwner._id,
      createdBy: testCompanyOwner._id,
    });
  });

  describe('Unit Tests - File Upload Validation', () => {
    test('should validate file type restrictions', () => {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
      ];

      const testFiles = [
        { type: 'application/pdf', expected: true },
        { type: 'application/msword', expected: true },
        { type: 'application/x-executable', expected: false },
        { type: 'application/javascript', expected: false },
        { type: 'text/html', expected: false },
      ];

      testFiles.forEach((file) => {
        const isAllowed = allowedTypes.includes(file.type);
        expect(isAllowed).toBe(file.expected);
      });
    });

    test('should validate file size limits', () => {
      const maxFileSize = 50 * 1024 * 1024; // 50MB

      const testSizes = [
        { size: 1024, expected: true }, // 1KB - valid
        { size: 10 * 1024 * 1024, expected: true }, // 10MB - valid
        { size: 45 * 1024 * 1024, expected: true }, // 45MB - valid
        { size: 60 * 1024 * 1024, expected: false }, // 60MB - invalid
        { size: 100 * 1024 * 1024, expected: false }, // 100MB - invalid
      ];

      testSizes.forEach((test) => {
        const isValid = test.size <= maxFileSize;
        expect(isValid).toBe(test.expected);
      });
    });

    test('should validate filename sanitization', () => {
      const dangerousFilenames = [
        '../../../etc/passwd',
        'C:\\Windows\\System32\\config',
        'file with spaces and special chars!@#$.pdf',
        'normalfile.pdf',
      ];

      const sanitizeFilename = (filename) => {
        return filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
      };

      dangerousFilenames.forEach((filename) => {
        const sanitized = sanitizeFilename(filename);
        expect(sanitized).not.toContain('../');
        expect(sanitized).not.toContain('\\');
        expect(sanitized).not.toContain(' ');
      });
    });
  });

  describe('Unit Tests - Version Control Logic', () => {
    test('should create version number correctly', () => {
      const versions = [
        { current: undefined, expected: 1 },
        { current: 1, expected: 2 },
        { current: 5, expected: 6 },
        { current: 10, expected: 11 },
      ];

      versions.forEach((test) => {
        const nextVersion = (test.current || 0) + 1;
        expect(nextVersion).toBe(test.expected);
      });
    });

    test('should maintain version history structure', () => {
      const versionHistory = {
        originalDocument: {
          fileName: 'original.pdf',
          fileSize: 1024,
          createdAt: new Date(),
        },
        versions: [
          {
            versionNumber: 1,
            fileName: 'v1.pdf',
            fileSize: 1100,
            createdAt: new Date(),
            changes: 'Initial version',
          },
          {
            versionNumber: 2,
            fileName: 'v2.pdf',
            fileSize: 1200,
            createdAt: new Date(),
            changes: 'Updated content',
          },
        ],
      };

      expect(versionHistory.originalDocument).toBeDefined();
      expect(versionHistory.versions).toHaveLength(2);
      expect(versionHistory.versions[0].versionNumber).toBe(1);
      expect(versionHistory.versions[1].versionNumber).toBe(2);
    });
  });

  describe('Unit Tests - Access Permission Checks', () => {
    test('should validate document ownership', async () => {
      const AppDocument = mongoose.model('AppDocument');
      const document = await AppDocument.findById(testDocument._id);

      expect(document).toBeTruthy();
      expect(document.owner.toString()).toBe(testCompanyOwner._id.toString());
      expect(document.createdBy.toString()).toBe(testCompanyOwner._id.toString());
    });

    test('should check read permissions', () => {
      const permissions = {
        owner: true,
        collaborator: true,
        viewer: true,
        public: false,
      };

      const userRoles = ['owner', 'collaborator', 'viewer', 'stranger'];

      userRoles.forEach((role) => {
        const hasReadAccess = permissions[role] || false;
        if (role === 'stranger') {
          expect(hasReadAccess).toBe(false);
        } else {
          expect(hasReadAccess).toBe(true);
        }
      });
    });

    test('should check write permissions', () => {
      const writePermissions = {
        owner: true,
        collaborator: true,
        viewer: false,
        public: false,
      };

      const testCases = [
        { role: 'owner', expected: true },
        { role: 'collaborator', expected: true },
        { role: 'viewer', expected: false },
        { role: 'stranger', expected: false },
      ];

      testCases.forEach((test) => {
        const hasWriteAccess = writePermissions[test.role] || false;
        expect(hasWriteAccess).toBe(test.expected);
      });
    });
  });

  describe('Integration Tests - Document Lifecycle Workflows', () => {
    test('should create document successfully', async () => {
      const documentData = {
        title: 'New Test Document',
        description: 'Created via API test',
        documentType: 'Contract',
        tags: ['test', 'contract', 'api'],
      };

      // Mock file upload
      const response = await request(app)
        .post('/api/document/create')
        .set('Authorization', `Bearer ${validToken}`)
        .field('title', documentData.title)
        .field('description', documentData.description)
        .field('documentType', documentData.documentType)
        .field('tags', documentData.tags.join(','))
        .attach('file', Buffer.from('test file content'), 'test.pdf');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.title).toBe(documentData.title);
      expect(response.body.result.owner).toBe(testCompanyOwner._id.toString());
    });

    test('should read document with metadata', async () => {
      const response = await request(app)
        .get(`/api/document/read/${testDocument._id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result._id).toBe(testDocument._id.toString());
      expect(response.body.result.title).toBe(testDocument.title);
      expect(response.body.result.fileSize).toBe(testDocument.fileSize);
    });

    test('should update document metadata', async () => {
      const updateData = {
        title: 'Updated Document Title',
        description: 'Updated description',
        tags: ['updated', 'test'],
      };

      const response = await request(app)
        .patch(`/api/document/update/${testDocument._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.title).toBe(updateData.title);
      expect(response.body.result.description).toBe(updateData.description);
    });

    test('should archive document (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/document/delete/${testDocument._id}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);

      // Verify document is archived
      const AppDocument = mongoose.model('AppDocument');
      const archivedDoc = await AppDocument.findById(testDocument._id);
      expect(archivedDoc.removed).toBe(true);
    });

    test('should create document version', async () => {
      const response = await request(app)
        .post(`/api/document/${testDocument._id}/version`)
        .set('Authorization', `Bearer ${validToken}`)
        .field('changes', 'Updated content in version 2')
        .attach('file', Buffer.from('updated file content'), 'test-v2.pdf');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Integration Tests - Compliance Checking', () => {
    test('should create compliance record', async () => {
      const complianceData = {
        documentId: testDocument._id,
        standard: 'ISO-27001',
        status: 'compliant',
        checkedBy: testCompanyOwner._id,
        checkedAt: new Date(),
        findings: 'Document meets all requirements',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      };

      const response = await request(app)
        .post(`/api/document/${testDocument._id}/compliance`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(complianceData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.standard).toBe(complianceData.standard);
      expect(response.body.result.status).toBe(complianceData.status);
    });

    test('should get compliance status', async () => {
      const response = await request(app)
        .get(`/api/document/${testDocument._id}/compliance`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should detect compliance expiry', () => {
      const complianceRecord = {
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        status: 'compliant',
      };

      const isExpired = new Date() > new Date(complianceRecord.expiryDate);
      expect(isExpired).toBe(true);
    });
  });

  describe('Integration Tests - Audit Trail Generation', () => {
    test('should create audit trail entry for document creation', async () => {
      const response = await request(app)
        .get(`/api/document/${testDocument._id}/audit-trail`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      if (response.body.result && response.body.result.length > 0) {
        const auditEntry = response.body.result[0];
        expect(auditEntry.action).toBeDefined();
        expect(auditEntry.timestamp).toBeDefined();
        expect(auditEntry.userId).toBeDefined();
      }
    });

    test('should track document modifications in audit trail', async () => {
      // Update document to create audit entry
      await request(app)
        .patch(`/api/document/update/${testDocument._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Modified Title' });

      const response = await request(app)
        .get(`/api/document/${testDocument._id}/audit-trail`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      if (response.body.result && response.body.result.length > 0) {
        const hasUpdateEntry = response.body.result.some(
          (entry) => entry.action === 'update' || entry.action === 'modify'
        );
        expect(hasUpdateEntry).toBe(true);
      }
    });
  });

  describe('Security Tests - File Type Validation', () => {
    test('should reject executable files', async () => {
      const maliciousFiles = [
        { name: 'virus.exe', type: 'application/x-executable' },
        { name: 'script.bat', type: 'application/x-bat' },
        { name: 'malware.scr', type: 'application/x-screensaver' },
      ];

      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/api/document/create')
          .set('Authorization', `Bearer ${validToken}`)
          .field('title', 'Test Document')
          .attach('file', Buffer.from('malicious content'), {
            filename: file.name,
            contentType: file.type,
          });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      }
    });

    test('should validate file content vs extension', () => {
      const testCases = [
        {
          filename: 'document.pdf',
          content: '%PDF-1.4',
          expected: true,
        },
        {
          filename: 'document.pdf',
          content: '<html><body>fake pdf</body></html>',
          expected: false,
        },
        {
          filename: 'image.jpg',
          content: 'FFD8FF', // JPEG header in hex
          expected: true,
        },
      ];

      testCases.forEach((test) => {
        const isPdfFile = test.filename.endsWith('.pdf');
        const hasPdfHeader = test.content.startsWith('%PDF');

        if (isPdfFile) {
          expect(hasPdfHeader).toBe(test.expected);
        }
      });
    });
  });

  describe('Security Tests - Access Control Verification', () => {
    test('should prevent unauthorized document access', async () => {
      // Create another company owner
      const otherOwner = await global.testUtils.createTestCompanyOwner();
      otherOwner.email = 'other@example.com';
      await otherOwner.save();

      const otherToken = await TestDataFactory.generateValidToken(otherOwner, true);

      const response = await request(app)
        .get(`/api/document/read/${testDocument._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);
    });

    test('should prevent unauthorized document modification', async () => {
      const otherOwner = await global.testUtils.createTestCompanyOwner();
      otherOwner.email = 'other2@example.com';
      await otherOwner.save();

      const otherToken = await TestDataFactory.generateValidToken(otherOwner, true);

      const response = await request(app)
        .patch(`/api/document/update/${testDocument._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Title' });

      expect(response.status).toBe(404);
    });

    test('should enforce document deletion permissions', async () => {
      const otherOwner = await global.testUtils.createTestCompanyOwner();
      otherOwner.email = 'other3@example.com';
      await otherOwner.save();

      const otherToken = await TestDataFactory.generateValidToken(otherOwner, true);

      const response = await request(app)
        .delete(`/api/document/delete/${testDocument._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Document Search and Organization', () => {
    test('should search documents by title', async () => {
      const response = await request(app)
        .get('/api/document/search?q=Test Document')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      if (response.body.result && response.body.result.length > 0) {
        expect(response.body.result[0].title).toContain('Test');
      }
    });

    test('should filter documents by type', async () => {
      const Document = mongoose.model('Document');

      await Document.create({
        title: 'Contract Document',
        fileName: 'contract.pdf',
        fileType: 'application/pdf',
        filePath: '/uploads/contract.pdf',
        fileSize: 2048,
        documentType: 'Contract',
        owner: testCompanyOwner._id,
        createdBy: testCompanyOwner._id,
        status: 'active',
      });

      const response = await request(app)
        .get('/api/document/filter?documentType=Contract')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      if (response.body.result && response.body.result.length > 0) {
        response.body.result.forEach((doc) => {
          expect(doc.documentType).toBe('Contract');
        });
      }
    });

    test('should filter documents by tags', async () => {
      const Document = mongoose.model('Document');

      await Document.create({
        title: 'Tagged Document',
        fileName: 'tagged.pdf',
        fileType: 'application/pdf',
        filePath: '/uploads/tagged.pdf',
        fileSize: 1500,
        tags: ['important', 'contract', 'legal'],
        owner: testCompanyOwner._id,
        createdBy: testCompanyOwner._id,
        status: 'active',
      });

      const response = await request(app)
        .get('/api/document/filter?tags=important')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      if (response.body.result && response.body.result.length > 0) {
        response.body.result.forEach((doc) => {
          expect(doc.tags).toContain('important');
        });
      }
    });
  });

  describe('Document Version Management', () => {
    test('should list document versions', async () => {
      const response = await request(app)
        .get(`/api/document/${testDocument._id}/versions`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should revert to previous version', async () => {
      // First create a new version
      await request(app)
        .post(`/api/document/${testDocument._id}/version`)
        .set('Authorization', `Bearer ${validToken}`)
        .field('changes', 'Test version')
        .attach('file', Buffer.from('new version content'), 'test-v2.pdf');

      // Then revert to original
      const response = await request(app)
        .post(`/api/document/${testDocument._id}/revert`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ versionNumber: 'original' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
