/**
 * TIER 3 TEST SUITE: Advanced Search & Filtering
 *
 * Tests complex search functionality including full-text search,
 * faceted filtering, saved searches, and search performance.
 *
 * Coverage Areas:
 * - Full-text search across entities
 * - Advanced filtering and faceted search
 * - Search result ranking and relevance
 * - Saved searches and search history
 * - Search performance and optimization
 * - Cross-entity search and relationships
 * - Search analytics and insights
 * - Real-time search suggestions
 */

const mongoose = require('mongoose');
const {
  createTestUser,
  createTestCompany,
  generateJWT,
  cleanupDatabase,
  mockRequest,
  mockResponse,
} = require('../setup/testUtilities');

// Import models
const Client = require('../../src/models/appModels/Client');
const Invoice = require('../../src/models/appModels/Invoice');
const Quote = require('../../src/models/appModels/Quote');
const Document = require('../../src/models/appModels/Document');
const Task = require('../../src/models/appModels/Task');
const User = require('../../src/models/appModels/User');
const SavedSearch = require('../../src/models/appModels/SavedSearch');

// Import search services
const searchService = require('../../src/services/searchService');
const advancedSearchController = require('../../src/controllers/appControllers/advancedSearchController');

describe('Advanced Search & Filtering', () => {
  let testUser, testCompany, authToken;
  let testClients, testInvoices, testQuotes, testDocuments, testTasks;

  beforeEach(async () => {
    await cleanupDatabase();

    // Create test data
    testCompany = await createTestCompany();
    testUser = await createTestUser(testCompany._id);
    authToken = generateJWT(testUser._id, testCompany._id);

    // Create comprehensive test dataset
    testClients = await Client.create([
      {
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1234567890',
        address: '123 Business St, New York, NY',
        industry: 'Technology',
        size: 'Large',
        owner: testCompany._id,
        createdBy: testUser._id,
        tags: ['enterprise', 'technology', 'priority'],
      },
      {
        name: 'Tech Innovations LLC',
        email: 'info@techinnovations.com',
        phone: '+1987654321',
        address: '456 Innovation Ave, San Francisco, CA',
        industry: 'Software',
        size: 'Medium',
        owner: testCompany._id,
        createdBy: testUser._id,
        tags: ['software', 'startup', 'growth'],
      },
      {
        name: 'Global Manufacturing Inc',
        email: 'sales@globalmanufacturing.com',
        phone: '+1555000111',
        address: '789 Factory Rd, Detroit, MI',
        industry: 'Manufacturing',
        size: 'Large',
        owner: testCompany._id,
        createdBy: testUser._id,
        tags: ['manufacturing', 'industrial', 'established'],
      },
      {
        name: 'Local Retail Store',
        email: 'manager@localretail.com',
        phone: '+1444000222',
        address: '321 Main St, Denver, CO',
        industry: 'Retail',
        size: 'Small',
        owner: testCompany._id,
        createdBy: testUser._id,
        tags: ['retail', 'local', 'small-business'],
      },
    ]);

    testQuotes = await Quote.create([
      {
        number: 1,
        year: 2024,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        client: testClients[0]._id,
        owner: testCompany._id,
        createdBy: testUser._id,
        items: [
          { itemName: 'Software License', quantity: 10, price: 1000, total: 10000 },
          { itemName: 'Support Services', quantity: 12, price: 500, total: 6000 },
        ],
        currency: 'USD',
        total: 16000,
        status: 'draft',
        approved: false,
      },
      {
        number: 2,
        year: 2024,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        client: testClients[1]._id,
        owner: testCompany._id,
        createdBy: testUser._id,
        items: [{ itemName: 'Development Services', quantity: 100, price: 150, total: 15000 }],
        currency: 'USD',
        total: 15000,
        status: 'draft',
        approved: false,
      },
      {
        number: 3,
        year: 2024,
        date: new Date(),
        expiredDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        client: testClients[2]._id,
        owner: testCompany._id,
        createdBy: testUser._id,
        items: [
          { itemName: 'Manufacturing Equipment', quantity: 1, price: 50000, total: 50000 },
          { itemName: 'Installation', quantity: 1, price: 5000, total: 5000 },
        ],
        currency: 'USD',
        total: 55000,
        status: 'draft',
        approved: false,
      },
    ]);

    testInvoices = await Invoice.create([
      {
        number: 1,
        year: 2024,
        date: new Date(),
        expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        client: testClients[0]._id,
        owner: testCompany._id,
        createdBy: testUser._id,
        items: [
          { itemName: 'Software License', quantity: 10, price: 1000, total: 10000 },
          { itemName: 'Support Services', quantity: 12, price: 500, total: 6000 },
        ],
        currency: 'USD',
        total: 16000,
        status: 'sent',
        paymentStatus: 'paid',
        approved: true,
      },
      {
        number: 2,
        year: 2024,
        date: new Date(),
        expiredDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        client: testClients[1]._id,
        owner: testCompany._id,
        createdBy: testUser._id,
        items: [{ itemName: 'Development Services', quantity: 100, price: 150, total: 15000 }],
        currency: 'USD',
        total: 15000,
        status: 'sent',
        paymentStatus: 'unpaid',
        approved: false,
      },
    ]);

    testDocuments = await Document.create([
      {
        title: 'Acme Corporation Proposal',
        documentType: 'proposal',
        description:
          'Comprehensive software solution proposal for Acme Corporation including licensing and support terms.',
        fileName: 'acme-proposal.pdf',
        fileType: 'application/pdf',
        filePath: '/documents/acme-proposal.pdf',
        fileSize: 2500000,
        owner: testCompany._id,
        createdBy: testUser._id,
        tags: ['proposal', 'software', 'enterprise'],
      },
      {
        title: 'Technical Specifications',
        documentType: 'specification',
        description:
          'Detailed technical requirements and specifications for the manufacturing equipment project.',
        fileName: 'tech-specs.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filePath: '/documents/tech-specs.docx',
        fileSize: 5000000,
        owner: testCompany._id,
        createdBy: testUser._id,
        tags: ['technical', 'specifications', 'manufacturing'],
      },
      {
        title: 'Project Timeline',
        documentType: 'timeline',
        description: 'Development timeline and milestones for the Tech Innovations project.',
        fileName: 'project-timeline.xlsx',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filePath: '/documents/project-timeline.xlsx',
        fileSize: 800000,
        owner: testCompany._id,
        createdBy: testUser._id,
        tags: ['timeline', 'development', 'milestones'],
      },
    ]);

    testTasks = await Task.create([
      {
        title: 'Follow up with Acme Corporation',
        description: 'Contact Acme regarding implementation timeline and next steps.',
        priority: 'high',
        status: 'pending',
        owner: testCompany._id,
        createdBy: testUser._id,
        assignedTo: testUser._id,
        client: testClients[0]._id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tags: ['follow-up', 'acme', 'implementation'],
      },
      {
        title: 'Prepare manufacturing equipment documentation',
        description: 'Create comprehensive documentation for the manufacturing equipment delivery.',
        priority: 'medium',
        status: 'in_progress',
        owner: testCompany._id,
        createdBy: testUser._id,
        assignedTo: testUser._id,
        client: testClients[2]._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tags: ['documentation', 'manufacturing', 'equipment'],
      },
    ]);
  });

  describe('Full-Text Search', () => {
    test('should perform basic full-text search', async () => {
      const req = mockRequest(
        {
          query: {
            q: 'Acme Corporation',
            entities: ['client', 'quote', 'invoice', 'document', 'task'],
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            query: 'Acme Corporation',
            totalResults: expect.any(Number),
            results: expect.objectContaining({
              clients: expect.arrayContaining([
                expect.objectContaining({ name: expect.stringContaining('Acme') }),
              ]),
              documents: expect.any(Array),
              tasks: expect.any(Array),
            }),
          }),
        })
      );
    });

    test('should handle search with stemming and synonyms', async () => {
      const req = mockRequest(
        {
          query: {
            q: 'software development',
            entities: ['quote', 'document'],
            options: {
              enableStemming: true,
              enableSynonyms: true,
            },
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      // Should find results for both "software" and "development"
      expect(results.totalResults).toBeGreaterThan(0);
      expect(results.results.quotes.length + results.results.documents.length).toBeGreaterThan(0);
    });

    test('should search across multiple fields', async () => {
      const req = mockRequest(
        {
          query: {
            q: 'technology software',
            fields: ['name', 'description', 'content', 'tags', 'industry'],
            entities: ['client', 'document'],
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      // Should find clients in technology industry and documents with software content
      expect(results.results.clients.some((c) => c.industry === 'Technology')).toBe(true);
      expect(
        results.results.documents.some(
          (d) => d.description?.toLowerCase().includes('software') || d.tags.includes('software')
        )
      ).toBe(true);
    });

    test('should handle phrase search', async () => {
      const req = mockRequest(
        {
          query: {
            q: '"manufacturing equipment"',
            entities: ['quote', 'document', 'task'],
            searchType: 'phrase',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      // Should find exact phrase matches
      expect(results.totalResults).toBeGreaterThan(0);
      expect(
        results.results.quotes.some((q) =>
          q.items.some((item) => item.name.includes('Manufacturing Equipment'))
        ) ||
          results.results.documents.some((d) =>
            d.description?.includes('manufacturing equipment')
          ) ||
          results.results.tasks.some((t) => t.description.includes('manufacturing equipment'))
      ).toBe(true);
    });

    test('should perform fuzzy search for typos', async () => {
      const req = mockRequest(
        {
          query: {
            q: 'Acme Corporaton', // Typo in "Corporation"
            entities: ['client'],
            options: {
              enableFuzzySearch: true,
              fuzziness: 2,
            },
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      // Should still find "Acme Corporation" despite typo
      expect(results.results.clients.some((c) => c.name === 'Acme Corporation')).toBe(true);
    });
  });

  describe('Advanced Filtering & Faceted Search', () => {
    test('should filter by date ranges', async () => {
      const req = mockRequest(
        {
          query: {
            entities: ['invoice'],
            filters: {
              expiredDate: {
                from: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                to: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
              },
            },
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.filter(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      expect(results.results.invoices.length).toBeGreaterThan(0);
      results.results.invoices.forEach((invoice) => {
        const expiredDate = new Date(invoice.expiredDate);
        expect(expiredDate.getTime()).toBeGreaterThanOrEqual(Date.now() - 10 * 24 * 60 * 60 * 1000);
        expect(expiredDate.getTime()).toBeLessThanOrEqual(Date.now() + 20 * 24 * 60 * 60 * 1000);
      });
    });

    test('should filter by numeric ranges', async () => {
      const req = mockRequest(
        {
          query: {
            entities: ['quote', 'invoice'],
            filters: {
              total: {
                min: 10000,
                max: 50000,
              },
            },
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.filter(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      [...results.results.quotes, ...results.results.invoices].forEach((item) => {
        expect(item.total).toBeGreaterThanOrEqual(10000);
        expect(item.total).toBeLessThanOrEqual(50000);
      });
    });

    test('should filter by multiple criteria', async () => {
      const req = mockRequest(
        {
          query: {
            entities: ['client'],
            filters: {
              industry: ['Technology', 'Software'],
              size: ['Medium', 'Large'],
              tags: ['enterprise', 'technology'],
            },
            operator: 'AND',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.filter(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      results.results.clients.forEach((client) => {
        expect(['Technology', 'Software']).toContain(client.industry);
        expect(['Medium', 'Large']).toContain(client.size);
        expect(client.tags.some((tag) => ['enterprise', 'technology'].includes(tag))).toBe(true);
      });
    });

    test('should provide faceted search results', async () => {
      const req = mockRequest(
        {
          query: {
            q: 'software',
            entities: ['quote', 'invoice'],
            includeFacets: true,
            facets: ['status', 'total_range', 'client_industry', 'tags'],
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      expect(results.facets).toBeDefined();
      expect(results.facets.status).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            value: expect.any(String),
            count: expect.any(Number),
          }),
        ])
      );
      expect(results.facets.total_range).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            range: expect.any(String),
            count: expect.any(Number),
          }),
        ])
      );
    });

    test('should handle complex nested filters', async () => {
      const req = mockRequest(
        {
          query: {
            entities: ['quote'],
            filters: {
              $and: [
                {
                  $or: [{ status: 'approved' }, { status: 'pending' }],
                },
                {
                  total: { $gte: 10000 },
                },
                {
                  'items.category': { $in: ['software', 'services'] },
                },
              ],
            },
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.filter(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      results.results.quotes.forEach((quote) => {
        expect(['approved', 'pending']).toContain(quote.status);
        expect(quote.total).toBeGreaterThanOrEqual(10000);
        expect(quote.items.some((item) => ['software', 'services'].includes(item.category))).toBe(
          true
        );
      });
    });
  });

  describe('Search Result Ranking & Relevance', () => {
    test('should rank results by relevance score', async () => {
      const req = mockRequest(
        {
          query: {
            q: 'Acme software technology',
            entities: ['client', 'document', 'task'],
            includeScore: true,
            sortBy: 'relevance',
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      // Results should include relevance scores
      results.results.clients.forEach((client) => {
        expect(client._score).toBeDefined();
        expect(client._score).toBeGreaterThan(0);
      });

      // Results should be sorted by score (descending)
      for (let i = 1; i < results.results.clients.length; i++) {
        expect(results.results.clients[i - 1]._score).toBeGreaterThanOrEqual(
          results.results.clients[i]._score
        );
      }
    });

    test('should boost results based on business rules', async () => {
      const req = mockRequest(
        {
          query: {
            q: 'equipment',
            entities: ['quote'],
            boost: {
              status: { approved: 2.0, pending: 1.5 },
              total: { threshold: 50000, factor: 1.8 },
              recentlyModified: { days: 7, factor: 1.3 },
            },
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      // High-value quotes should have higher scores
      const highValueQuotes = results.results.quotes.filter((q) => q.total >= 50000);
      const lowValueQuotes = results.results.quotes.filter((q) => q.total < 50000);

      if (highValueQuotes.length > 0 && lowValueQuotes.length > 0) {
        expect(Math.max(...highValueQuotes.map((q) => q._score))).toBeGreaterThan(
          Math.max(...lowValueQuotes.map((q) => q._score))
        );
      }
    });

    test('should personalize results based on user activity', async () => {
      // Simulate user interaction history
      await searchService.recordUserInteraction(testUser._id, {
        entityType: 'client',
        entityId: testClients[0]._id,
        action: 'view',
        timestamp: new Date(),
      });

      await searchService.recordUserInteraction(testUser._id, {
        entityType: 'client',
        entityId: testClients[0]._id,
        action: 'edit',
        timestamp: new Date(),
      });

      const req = mockRequest(
        {
          query: {
            q: 'corporation',
            entities: ['client'],
            personalize: true,
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      // Acme Corporation should rank higher due to user interaction
      const acmeClient = results.results.clients.find((c) => c.name === 'Acme Corporation');
      expect(acmeClient._score).toBeGreaterThan(1.0);
    });

    test('should handle geo-location based ranking', async () => {
      const req = mockRequest(
        {
          query: {
            q: 'manufacturing',
            entities: ['client'],
            location: {
              lat: 42.3314,
              lng: -83.0458, // Detroit coordinates
              radius: 100, // 100km radius
            },
            boostNearby: true,
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      // Global Manufacturing Inc (Detroit) should rank higher
      const detroitClient = results.results.clients.find(
        (c) => c.name === 'Global Manufacturing Inc'
      );
      expect(detroitClient).toBeDefined();
      expect(detroitClient._score).toBeGreaterThan(1.0);
    });
  });

  describe('Saved Searches & Search History', () => {
    test('should save search query', async () => {
      const req = mockRequest(
        {
          body: {
            name: 'High Value Technology Quotes',
            description: 'Approved quotes over $10k in technology sector',
            query: {
              q: 'technology software',
              entities: ['quote'],
              filters: {
                status: 'approved',
                total: { min: 10000 },
              },
            },
            isPublic: false,
            notifications: {
              newResults: true,
              frequency: 'daily',
            },
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.saveSearch(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            name: 'High Value Technology Quotes',
            owner: testCompany._id,
            createdBy: testUser._id,
            query: expect.objectContaining({
              entities: ['quote'],
            }),
          }),
        })
      );
    });

    test('should execute saved search', async () => {
      const savedSearch = await SavedSearch.create({
        name: 'Pending Tasks',
        description: 'All pending tasks',
        owner: testCompany._id,
        createdBy: testUser._id,
        entityType: 'Task',
        searchCriteria: {
          q: '',
          entities: ['task'],
          filters: {
            status: 'pending',
          },
        },
        isPublic: false,
      });

      const req = mockRequest(
        {
          params: { id: savedSearch._id.toString() },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.executeSavedSearch(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            savedSearch: expect.objectContaining({
              name: 'Pending Tasks',
            }),
            results: expect.objectContaining({
              tasks: expect.any(Array),
            }),
          }),
        })
      );
    });

    test('should track search history', async () => {
      // Perform multiple searches
      const searches = [
        { q: 'Acme Corporation', entities: ['client'] },
        { q: 'software license', entities: ['quote'] },
        { q: 'manufacturing equipment', entities: ['task', 'document'] },
      ];

      for (const search of searches) {
        const req = mockRequest({ query: search }, testUser, testCompany);
        const res = mockResponse();
        await advancedSearchController.search(req, res);
      }

      // Get search history
      const req = mockRequest(
        {
          query: { limit: 10 },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.getSearchHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            history: expect.arrayContaining([
              expect.objectContaining({
                query: expect.any(Object),
                timestamp: expect.any(String),
                resultCount: expect.any(Number),
              }),
            ]),
          }),
        })
      );
    });

    test('should share saved searches with team', async () => {
      const publicSearch = await SavedSearch.create({
        name: 'Team Manufacturing Projects',
        description: 'All manufacturing-related projects',
        owner: testCompany._id,
        createdBy: testUser._id,
        entityType: 'Quote',
        searchCriteria: {
          q: 'manufacturing',
          entities: ['quote', 'task', 'document'],
        },
        isPublic: true,
        sharedWith: ['team:sales', 'team:support'],
      });

      const req = mockRequest(
        {
          query: { shared: true },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.listSavedSearches(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      expect(
        results.searches.some(
          (s) => s.name === 'Team Manufacturing Projects' && s.isPublic === true
        )
      ).toBe(true);
    });
  });

  describe('Search Performance & Optimization', () => {
    test('should implement search result caching', async () => {
      const searchQuery = {
        q: 'technology',
        entities: ['client', 'quote'],
      };

      // First search (should cache results)
      const req1 = mockRequest({ query: searchQuery }, testUser, testCompany);
      const res1 = mockResponse();

      const start1 = Date.now();
      await advancedSearchController.search(req1, res1);
      const time1 = Date.now() - start1;

      expect(res1.status).toHaveBeenCalledWith(200);

      // Second identical search (should use cache)
      const req2 = mockRequest({ query: searchQuery }, testUser, testCompany);
      const res2 = mockResponse();

      const start2 = Date.now();
      await advancedSearchController.search(req2, res2);
      const time2 = Date.now() - start2;

      expect(res2.status).toHaveBeenCalledWith(200);
      expect(time2).toBeLessThan(time1); // Cached search should be faster

      // Results should be identical
      expect(res1.json.mock.calls[0][0].result.totalResults).toBe(
        res2.json.mock.calls[0][0].result.totalResults
      );
    });

    test('should handle search result pagination efficiently', async () => {
      // Create large dataset
      const largeClientSet = [];
      for (let i = 0; i < 100; i++) {
        largeClientSet.push({
          name: `Client ${i}`,
          email: `client${i}@test.com`,
          phone: `+155500${i.toString().padStart(4, '0')}`,
          industry: 'Technology',
          owner: testCompany._id,
          createdBy: testUser._id,
        });
      }
      await Client.create(largeClientSet);

      const req = mockRequest(
        {
          query: {
            q: 'technology',
            entities: ['client'],
            page: 3,
            limit: 20,
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      const startTime = Date.now();
      await advancedSearchController.search(req, res);
      const endTime = Date.now();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(endTime - startTime).toBeLessThan(500); // Should handle pagination efficiently

      const results = res.json.mock.calls[0][0].result;
      expect(results.pagination.page).toBe(3);
      expect(results.pagination.limit).toBe(20);
      expect(results.results.clients.length).toBeLessThanOrEqual(20);
    });

    test('should optimize search with proper indexing', async () => {
      // Test search performance on indexed fields
      const req = mockRequest(
        {
          query: {
            entities: ['client'],
            filters: {
              industry: 'Technology',
              owner: testCompany._id.toString(),
            },
            sort: { createdAt: -1 },
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();

      const startTime = Date.now();
      await advancedSearchController.filter(req, res);
      const endTime = Date.now();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast with proper indexing
    });

    test('should implement search query optimization', async () => {
      const complexQuery = {
        q: 'technology software development manufacturing',
        entities: ['client', 'quote', 'document', 'task'],
        filters: {
          $and: [
            { total: { $gte: 1000 } },
            { status: { $in: ['approved', 'pending', 'draft'] } },
            { tags: { $in: ['technology', 'software', 'manufacturing'] } },
          ],
        },
        sort: { createdAt: -1, total: -1 },
        limit: 50,
      };

      const req = mockRequest({ query: complexQuery }, testUser, testCompany);
      const res = mockResponse();

      const startTime = Date.now();
      await advancedSearchController.search(req, res);
      const endTime = Date.now();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(endTime - startTime).toBeLessThan(1000); // Complex query should still be reasonable

      const results = res.json.mock.calls[0][0].result;
      expect(results.totalResults).toBeGreaterThanOrEqual(0);
      expect(results.queryOptimization).toBeDefined();
    });
  });

  describe('Cross-Entity Search & Relationships', () => {
    test('should search across related entities', async () => {
      const req = mockRequest(
        {
          query: {
            q: 'Acme',
            entities: ['client', 'quote', 'invoice', 'document', 'task'],
            includeRelated: true,
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.search(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      // Should find Acme client and all related entities
      expect(results.results.clients.some((c) => c.name.includes('Acme'))).toBe(true);
      expect(
        results.results.quotes.some(
          (q) => q.client && q.client.name && q.client.name.includes('Acme')
        )
      ).toBe(true);
      expect(
        results.results.invoices.some(
          (i) => i.client && i.client.name && i.client.name.includes('Acme')
        )
      ).toBe(true);
    });

    test('should follow relationship chains', async () => {
      const req = mockRequest(
        {
          query: {
            startEntity: 'client',
            startEntityId: testClients[0]._id.toString(),
            relationshipDepth: 3,
            includeEntities: ['quote', 'invoice', 'document', 'task'],
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.getRelatedEntities(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      expect(results.relationshipMap).toBeDefined();
      expect(results.entities.quotes.length).toBeGreaterThan(0);
      expect(results.entities.invoices.length).toBeGreaterThan(0);
    });

    test('should aggregate data across entity types', async () => {
      const req = mockRequest(
        {
          query: {
            aggregations: {
              byIndustry: {
                field: 'industry',
                entities: ['client'],
                includeRelated: ['quote', 'invoice'],
              },
              byStatus: {
                field: 'status',
                entities: ['quote', 'invoice'],
              },
              byTotal: {
                field: 'total',
                entities: ['quote', 'invoice'],
                type: 'range',
                ranges: [
                  { from: 0, to: 10000 },
                  { from: 10000, to: 50000 },
                  { from: 50000, to: null },
                ],
              },
            },
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.aggregate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const results = res.json.mock.calls[0][0].result;

      expect(results.aggregations.byIndustry).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: expect.any(String),
            count: expect.any(Number),
            relatedData: expect.any(Object),
          }),
        ])
      );
    });
  });

  describe('Search Analytics & Insights', () => {
    test('should track search analytics', async () => {
      // Perform searches to generate analytics data
      const searches = [
        { q: 'technology', entities: ['client'] },
        { q: 'software', entities: ['quote'] },
        { q: 'manufacturing', entities: ['task'] },
        { q: 'technology', entities: ['client'] }, // Duplicate to test frequency
      ];

      for (const search of searches) {
        const req = mockRequest({ query: search }, testUser, testCompany);
        const res = mockResponse();
        await advancedSearchController.search(req, res);
      }

      const req = mockRequest(
        {
          query: {
            period: 'week',
            metrics: ['searchVolume', 'popularQueries', 'entityPreferences', 'resultQuality'],
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.getSearchAnalytics(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            period: 'week',
            searchVolume: expect.any(Number),
            popularQueries: expect.arrayContaining([
              expect.objectContaining({
                query: expect.any(String),
                frequency: expect.any(Number),
              }),
            ]),
            entityPreferences: expect.any(Object),
            avgResultsPerSearch: expect.any(Number),
          }),
        })
      );
    });

    test('should provide search suggestions', async () => {
      const req = mockRequest(
        {
          query: {
            partial: 'tech',
            limit: 5,
            includeEntitySuggestions: true,
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.getSuggestions(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            suggestions: expect.arrayContaining([
              expect.objectContaining({
                text: expect.stringContaining('tech'),
                type: expect.any(String),
                score: expect.any(Number),
              }),
            ]),
            entitySuggestions: expect.any(Object),
          }),
        })
      );
    });

    test('should analyze search result quality', async () => {
      const req = mockRequest(
        {
          query: {
            searchQuery: {
              q: 'Acme Corporation software',
              entities: ['client', 'quote'],
            },
            analyzeQuality: true,
          },
        },
        testUser,
        testCompany
      );

      const res = mockResponse();
      await advancedSearchController.analyzeResultQuality(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          result: expect.objectContaining({
            qualityScore: expect.any(Number),
            precision: expect.any(Number),
            recall: expect.any(Number),
            relevanceDistribution: expect.any(Array),
            recommendations: expect.any(Array),
          }),
        })
      );
    });
  });
});
