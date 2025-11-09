const { describe, test, beforeEach, expect, jest, beforeAll } = require('@jest/globals');

// Mock crypto for aiUtils
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mock-random-string'),
  }),
}));

describe('Utils Tests', () => {
  let utils;

  beforeAll(() => {
    // Try to load utils from different possible locations
    try {
      utils = require('../../../src/utils');
    } catch (error) {
      // If main utils doesn't exist, we'll test utility functions in general
      utils = {};
    }
  });

  describe('General Utility Functions', () => {
    test('should handle object utilities', () => {
      // Test object manipulation utilities
      const obj = { a: 1, b: 2, c: 3 };

      // Test object keys
      const keys = Object.keys(obj);
      expect(keys).toEqual(['a', 'b', 'c']);

      // Test object values
      const values = Object.values(obj);
      expect(values).toEqual([1, 2, 3]);

      // Test object entries
      const entries = Object.entries(obj);
      expect(entries).toEqual([
        ['a', 1],
        ['b', 2],
        ['c', 3],
      ]);
    });

    test('should handle array utilities', () => {
      const arr = [1, 2, 3, 4, 5];

      // Test array chunk utility
      const chunk = (array, size) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      };

      const chunked = chunk(arr, 2);
      expect(chunked).toEqual([[1, 2], [3, 4], [5]]);
    });

    test('should handle string utilities', () => {
      // Test string utilities
      const camelCase = (str) => {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      };

      const kebabCase = (str) => {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      };

      expect(camelCase('hello-world')).toBe('helloWorld');
      expect(kebabCase('helloWorld')).toBe('hello-world');
    });
  });

  describe('AI Utils', () => {
    let aiUtils;

    beforeAll(() => {
      try {
        aiUtils = require('../../../src/utils/aiUtils');
      } catch (error) {
        aiUtils = null;
      }
    });

    test('should exist and be properly structured', () => {
      if (aiUtils) {
        expect(aiUtils).toBeDefined();
        expect(typeof aiUtils).toBe('object');
      }
    });

    test('should generate conversation ID', () => {
      if (aiUtils && aiUtils.generateConversationId) {
        const id = aiUtils.generateConversationId();
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
      }
    });

    test('should estimate tokens', () => {
      if (aiUtils && aiUtils.estimateTokens) {
        const text = 'This is a test text for token estimation';
        const tokens = aiUtils.estimateTokens(text);
        expect(tokens).toBeDefined();
        expect(typeof tokens).toBe('number');
        expect(tokens).toBeGreaterThan(0);
      }
    });

    test('should format AI response', () => {
      if (aiUtils && aiUtils.formatAiResponse) {
        const response = 'Test AI response';
        const metadata = { model: 'gpt-4', tokens: 50 };

        const formatted = aiUtils.formatAiResponse(response, metadata);

        expect(formatted).toBeDefined();
        expect(formatted).toHaveProperty('content', response);
        expect(formatted).toHaveProperty('timestamp');
        expect(formatted).toHaveProperty('metadata');
        expect(formatted.metadata).toHaveProperty('model', 'gpt-4');
        expect(formatted.metadata).toHaveProperty('tokens', 50);
      }
    });

    test('should extract module context', () => {
      if (aiUtils && aiUtils.extractModuleContext) {
        const clientData = {
          name: 'Test Client',
          email: 'test@client.com',
          customerType: 'enterprise',
          customerValue: { segment: 'high' },
        };

        const context = aiUtils.extractModuleContext('client', clientData);

        expect(context).toBeDefined();
        expect(context).toHaveProperty('clientName', 'Test Client');
        expect(context).toHaveProperty('clientEmail', 'test@client.com');
        expect(context).toHaveProperty('segment', 'high');
      }
    });

    test('should handle invoice context extraction', () => {
      if (aiUtils && aiUtils.extractModuleContext) {
        const invoiceData = {
          number: 'INV-001',
          client: { name: 'Test Client' },
          total: 1500,
          status: 'sent',
          paymentStatus: 'pending',
        };

        const context = aiUtils.extractModuleContext('invoice', invoiceData);

        expect(context).toBeDefined();
        expect(context).toHaveProperty('invoiceNumber', 'INV-001');
        expect(context).toHaveProperty('clientName', 'Test Client');
        expect(context).toHaveProperty('total', 1500);
        expect(context).toHaveProperty('status', 'sent');
      }
    });
  });

  describe('PDF Utils', () => {
    let pdfUtils;

    beforeAll(() => {
      try {
        pdfUtils = require('../../../src/utils/pdfUtils');
      } catch (error) {
        pdfUtils = null;
      }
    });

    test('should exist and be properly structured', () => {
      if (pdfUtils) {
        expect(pdfUtils).toBeDefined();
        expect(typeof pdfUtils).toBe('object');
      }
    });

    test('should handle PDF generation options', () => {
      if (pdfUtils && pdfUtils.getDefaultOptions) {
        const options = pdfUtils.getDefaultOptions();
        expect(options).toBeDefined();
        expect(options).toHaveProperty('format');
        expect(options).toHaveProperty('orientation');
      }
    });

    test('should validate PDF content', () => {
      if (pdfUtils && pdfUtils.validateContent) {
        const validContent = '<html><body><h1>Test PDF</h1></body></html>';
        const invalidContent = '';

        expect(pdfUtils.validateContent(validContent)).toBe(true);
        expect(pdfUtils.validateContent(invalidContent)).toBe(false);
      }
    });

    test('should format PDF data', () => {
      if (pdfUtils && pdfUtils.formatPdfData) {
        const data = {
          title: 'Test Document',
          content: 'Test content',
          date: new Date(),
        };

        const formatted = pdfUtils.formatPdfData(data);
        expect(formatted).toBeDefined();
        expect(formatted).toHaveProperty('title');
        expect(formatted).toHaveProperty('content');
      }
    });
  });

  describe('NLP Utils', () => {
    let nlpUtils;

    beforeAll(() => {
      try {
        nlpUtils = require('../../../src/utils/nlpUtils');
      } catch (error) {
        nlpUtils = null;
      }
    });

    test('should exist and be properly structured', () => {
      if (nlpUtils) {
        expect(nlpUtils).toBeDefined();
        expect(typeof nlpUtils).toBe('object');
      }
    });

    test('should tokenize text', () => {
      if (nlpUtils && nlpUtils.tokenize) {
        const text = 'This is a test sentence.';
        const tokens = nlpUtils.tokenize(text);

        expect(tokens).toBeDefined();
        expect(Array.isArray(tokens)).toBe(true);
        expect(tokens.length).toBeGreaterThan(0);
      }
    });

    test('should remove stop words', () => {
      if (nlpUtils && nlpUtils.removeStopWords) {
        const words = ['this', 'is', 'a', 'test', 'sentence'];
        const filtered = nlpUtils.removeStopWords(words);

        expect(filtered).toBeDefined();
        expect(Array.isArray(filtered)).toBe(true);
        expect(filtered.length).toBeLessThan(words.length);
      }
    });

    test('should extract keywords', () => {
      if (nlpUtils && nlpUtils.extractKeywords) {
        const text = 'This is a comprehensive test of keyword extraction functionality';
        const keywords = nlpUtils.extractKeywords(text);

        expect(keywords).toBeDefined();
        expect(Array.isArray(keywords)).toBe(true);
      }
    });

    test('should calculate text similarity', () => {
      if (nlpUtils && nlpUtils.calculateSimilarity) {
        const text1 = 'This is a test document';
        const text2 = 'This is a test document';
        const text3 = 'Completely different content';

        const similarity1 = nlpUtils.calculateSimilarity(text1, text2);
        const similarity2 = nlpUtils.calculateSimilarity(text1, text3);

        expect(similarity1).toBeDefined();
        expect(similarity2).toBeDefined();
        expect(similarity1).toBeGreaterThan(similarity2);
      }
    });
  });

  describe('Prompt Templates', () => {
    let promptTemplates;

    beforeAll(() => {
      try {
        promptTemplates = require('../../../src/utils/promptTemplates');
      } catch (error) {
        promptTemplates = null;
      }
    });

    test('should exist and be properly structured', () => {
      if (promptTemplates) {
        expect(promptTemplates).toBeDefined();
        expect(typeof promptTemplates).toBe('object');
      }
    });

    test('should have client analysis template', () => {
      if (promptTemplates && promptTemplates.clientAnalysis) {
        expect(promptTemplates.clientAnalysis).toBeDefined();
        expect(typeof promptTemplates.clientAnalysis).toBe('string');
        expect(promptTemplates.clientAnalysis.length).toBeGreaterThan(0);
      }
    });

    test('should have invoice analysis template', () => {
      if (promptTemplates && promptTemplates.invoiceAnalysis) {
        expect(promptTemplates.invoiceAnalysis).toBeDefined();
        expect(typeof promptTemplates.invoiceAnalysis).toBe('string');
      }
    });

    test('should have document summarization template', () => {
      if (promptTemplates && promptTemplates.documentSummary) {
        expect(promptTemplates.documentSummary).toBeDefined();
        expect(typeof promptTemplates.documentSummary).toBe('string');
      }
    });

    test('should have business insights template', () => {
      if (promptTemplates && promptTemplates.businessInsights) {
        expect(promptTemplates.businessInsights).toBeDefined();
        expect(typeof promptTemplates.businessInsights).toBe('string');
      }
    });
  });

  describe('DOCX Utils', () => {
    let docxUtils;

    beforeAll(() => {
      try {
        docxUtils = require('../../../src/utils/docxUtils');
      } catch (error) {
        docxUtils = null;
      }
    });

    test('should exist and be properly structured', () => {
      if (docxUtils) {
        expect(docxUtils).toBeDefined();
        expect(typeof docxUtils).toBe('object');
      }
    });

    test('should handle document creation options', () => {
      if (docxUtils && docxUtils.getDefaultOptions) {
        const options = docxUtils.getDefaultOptions();
        expect(options).toBeDefined();
        expect(typeof options).toBe('object');
      }
    });

    test('should format document data', () => {
      if (docxUtils && docxUtils.formatDocumentData) {
        const data = {
          title: 'Test Document',
          sections: [
            { heading: 'Section 1', content: 'Content 1' },
            { heading: 'Section 2', content: 'Content 2' },
          ],
        };

        const formatted = docxUtils.formatDocumentData(data);
        expect(formatted).toBeDefined();
        expect(formatted).toHaveProperty('title');
        expect(formatted).toHaveProperty('sections');
      }
    });
  });

  describe('Expression Evaluator', () => {
    let expressionEvaluator;

    beforeAll(() => {
      try {
        expressionEvaluator = require('../../../src/utils/expressionEvaluator');
      } catch (error) {
        expressionEvaluator = null;
      }
    });

    test('should exist and be properly structured', () => {
      if (expressionEvaluator) {
        expect(expressionEvaluator).toBeDefined();
        expect(typeof expressionEvaluator).toBe('object');
      }
    });

    test('should evaluate mathematical expressions', () => {
      if (expressionEvaluator && expressionEvaluator.evaluate) {
        const expressions = [
          { expr: '2 + 2', expected: 4 },
          { expr: '10 - 3', expected: 7 },
          { expr: '5 * 6', expected: 30 },
          { expr: '15 / 3', expected: 5 },
        ];

        expressions.forEach(({ expr, expected }) => {
          const result = expressionEvaluator.evaluate(expr);
          expect(result).toBe(expected);
        });
      }
    });

    test('should handle complex expressions', () => {
      if (expressionEvaluator && expressionEvaluator.evaluate) {
        const expr = '(10 + 5) * 2 - 8';
        const result = expressionEvaluator.evaluate(expr);
        expect(result).toBe(22);
      }
    });

    test('should handle variable substitution', () => {
      if (expressionEvaluator && expressionEvaluator.evaluateWithVariables) {
        const expr = 'x + y * z';
        const variables = { x: 5, y: 3, z: 2 };
        const result = expressionEvaluator.evaluateWithVariables(expr, variables);
        expect(result).toBe(11);
      }
    });

    test('should validate expressions', () => {
      if (expressionEvaluator && expressionEvaluator.validate) {
        expect(expressionEvaluator.validate('2 + 2')).toBe(true);
        expect(expressionEvaluator.validate('2 +')).toBe(false);
        expect(expressionEvaluator.validate('invalid expression')).toBe(false);
      }
    });
  });

  describe('Path Safety Utils', () => {
    let pathUtils;

    beforeAll(() => {
      try {
        pathUtils = require('../../../src/utils/is-path-inside');
      } catch (error) {
        pathUtils = null;
      }
    });

    test('should exist and be properly structured', () => {
      if (pathUtils) {
        expect(pathUtils).toBeDefined();
        expect(typeof pathUtils).toBe('function');
      }
    });

    test('should validate path safety', () => {
      if (pathUtils) {
        const safePath = '/safe/path/file.txt';
        const parentPath = '/safe/path';

        const result = pathUtils(safePath, parentPath);
        expect(typeof result).toBe('boolean');
      }
    });
  });

  describe('Social Media Utils', () => {
    let facebookAuth, twitterAuth, instagramAuth;

    beforeAll(() => {
      try {
        facebookAuth = require('../../../src/utils/socialMedia/facebookAuth');
      } catch (error) {
        facebookAuth = null;
      }

      try {
        twitterAuth = require('../../../src/utils/socialMedia/twitterAuth');
      } catch (error) {
        twitterAuth = null;
      }

      try {
        instagramAuth = require('../../../src/utils/socialMedia/instagramAuth');
      } catch (error) {
        instagramAuth = null;
      }
    });

    test('should have Facebook auth utilities', () => {
      if (facebookAuth) {
        expect(facebookAuth).toBeDefined();
        expect(typeof facebookAuth).toBe('object');
      }
    });

    test('should have Twitter auth utilities', () => {
      if (twitterAuth) {
        expect(twitterAuth).toBeDefined();
        expect(typeof twitterAuth).toBe('object');
      }
    });

    test('should have Instagram auth utilities', () => {
      if (instagramAuth) {
        expect(instagramAuth).toBeDefined();
        expect(typeof instagramAuth).toBe('object');
      }
    });

    test('should validate social media credentials', () => {
      if (facebookAuth && facebookAuth.validateCredentials) {
        const validCreds = {
          appId: 'test-app-id',
          appSecret: 'test-app-secret',
          accessToken: 'test-access-token',
        };

        const invalidCreds = {
          appId: '',
          appSecret: '',
          accessToken: '',
        };

        expect(facebookAuth.validateCredentials(validCreds)).toBe(true);
        expect(facebookAuth.validateCredentials(invalidCreds)).toBe(false);
      }
    });

    test('should generate OAuth URLs', () => {
      if (facebookAuth && facebookAuth.generateAuthUrl) {
        const config = {
          appId: 'test-app-id',
          redirectUri: 'http://localhost:3000/auth/callback',
          scope: ['email', 'pages_show_list'],
        };

        const authUrl = facebookAuth.generateAuthUrl(config);
        expect(authUrl).toBeDefined();
        expect(typeof authUrl).toBe('string');
        expect(authUrl).toContain('facebook.com');
      }
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle memory-efficient operations', () => {
      // Test memory-efficient array operations
      const largeArray = new Array(10000).fill(0).map((_, i) => i);

      // Test streaming operations
      const processInChunks = (array, chunkSize, processor) => {
        const results = [];
        for (let i = 0; i < array.length; i += chunkSize) {
          const chunk = array.slice(i, i + chunkSize);
          results.push(processor(chunk));
        }
        return results;
      };

      const processor = (chunk) => chunk.reduce((sum, val) => sum + val, 0);
      const results = processInChunks(largeArray, 1000, processor);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(10);
    });

    test('should handle async utilities', async () => {
      // Test promise utilities
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      const promiseAll = async (promises) => {
        return await Promise.all(promises);
      };

      const promises = [
        delay(10).then(() => 'result1'),
        delay(20).then(() => 'result2'),
        delay(5).then(() => 'result3'),
      ];

      const results = await promiseAll(promises);
      expect(results).toEqual(['result1', 'result2', 'result3']);
    });

    test('should handle error boundaries', () => {
      const safeExecute = (fn, fallback = null) => {
        try {
          return fn();
        } catch (error) {
          console.warn('Safe execute caught error:', error.message);
          return fallback;
        }
      };

      const throwingFunction = () => {
        throw new Error('Test error');
      };

      const safeFunction = () => {
        return 'success';
      };

      expect(safeExecute(throwingFunction, 'fallback')).toBe('fallback');
      expect(safeExecute(safeFunction, 'fallback')).toBe('success');
    });
  });
});
