// @ts-nocheck
// const mongoose = require('mongoose');
const Client = require('../models/appModels/Client');
const Invoice = require('../models/appModels/Invoice');
const Quote = require('../models/appModels/Quote');
const Payment = require('../models/appModels/Payment');
const Document = require('../models/appModels/Document');
const Task = require('../models/appModels/Task');
const User = require('../models/appModels/User');
const Team = require('../models/appModels/Team');
const SavedSearch = require('../models/appModels/SavedSearch');

/**
 * Advanced Search Service
 */
class SearchService {
  constructor() {
    this.modelMap = {
      Client: Client,
      Invoice: Invoice,
      Quote: Quote,
      Payment: Payment,
      Document: Document,
      Task: Task,
      User: User,
      Team: Team,
    };
  }

  /**
   * Perform advanced search with filters
   */
  async search(entityType, criteria, options = {}) {
    const Model = this.modelMap[entityType];
    if (!Model) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const {
      owner,
      page = 1,
      limit = 20,
      sortBy = 'created',
      sortOrder = 'desc',
      filters = {},
    } = options;

    // Build query
    const query = { ...criteria };

    // Add owner filter for tenant isolation
    if (owner) {
      query.owner = owner;
    }

    // Apply additional filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        query[key] = filters[key];
      }
    });

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search
    const results = await Model.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email')
      .populate('createdBy', 'name email');

    const total = await Model.countDocuments(query);

    return {
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Build complex filter query
   */
  buildFilterQuery(filters) {
    const query = {};

    Object.keys(filters).forEach((key) => {
      const filter = filters[key];

      if (filter.type === 'text' && filter.value) {
        query[key] = { $regex: filter.value, $options: 'i' };
      } else if (filter.type === 'exact' && filter.value) {
        query[key] = filter.value;
      } else if (filter.type === 'range') {
        const rangeQuery = {};
        if (filter.min !== undefined) rangeQuery.$gte = filter.min;
        if (filter.max !== undefined) rangeQuery.$lte = filter.max;
        if (Object.keys(rangeQuery).length > 0) {
          query[key] = rangeQuery;
        }
      } else if (filter.type === 'date') {
        const dateQuery = {};
        if (filter.from) dateQuery.$gte = new Date(filter.from);
        if (filter.to) dateQuery.$lte = new Date(filter.to);
        if (Object.keys(dateQuery).length > 0) {
          query[key] = dateQuery;
        }
      } else if (filter.type === 'in' && Array.isArray(filter.values)) {
        query[key] = { $in: filter.values };
      }
    });

    return query;
  }

  /**
   * Save search criteria for future use
   */
  async saveSearch(searchData, userId, owner) {
    const savedSearch = new SavedSearch({
      ...searchData,
      createdBy: userId,
      owner: owner,
    });

    return await savedSearch.save();
  }

  /**
   * Get saved searches
   */
  async getSavedSearches(owner, entityType = null) {
    const query = { owner };
    if (entityType) {
      query.entityType = entityType;
    }

    return await SavedSearch.find(query).sort({ created: -1 }).populate('createdBy', 'name email');
  }

  /**
   * Execute saved search
   */
  async executeSavedSearch(searchId, owner, options = {}) {
    const savedSearch = await SavedSearch.findOne({ _id: searchId, owner });
    if (!savedSearch) {
      throw new Error('Saved search not found');
    }

    const searchOptions = {
      ...options,
      owner,
      sortBy: savedSearch.sortBy.field,
      sortOrder: savedSearch.sortBy.order,
      filters: savedSearch.filters,
    };

    return await this.search(savedSearch.entityType, savedSearch.searchCriteria, searchOptions);
  }

  /**
   * Full text search across multiple fields
   */
  async fullTextSearch(entityType, searchTerm, owner, options = {}) {
    const Model = this.modelMap[entityType];
    if (!Model) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Define searchable fields per entity type
    const searchableFields = {
      Client: ['name', 'email', 'phone', 'company'],
      Invoice: ['number', 'description'],
      Quote: ['number', 'description'],
      Payment: ['reference', 'description'],
      Document: ['title', 'description', 'tags'],
      Task: ['title', 'description'],
      User: ['name', 'email'],
      Team: ['name', 'description'],
    };

    const fields = searchableFields[entityType] || ['name'];

    // Build OR query for text search
    const textQuery = {
      $or: fields.map((field) => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    };

    // Add owner filter
    const query = {
      ...textQuery,
      owner: owner,
    };

    const { page = 1, limit = 20, sortBy = 'created', sortOrder = 'desc' } = options;

    const skip = (page - 1) * limit;

    const results = await Model.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email')
      .populate('createdBy', 'name email');

    const total = await Model.countDocuments(query);

    return {
      results,
      searchTerm,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Record user interaction for personalization
   */
  async recordUserInteraction(userId, interaction) {
    // For now, just log the interaction
    // In a real implementation, this would store in a UserInteraction model
    console.log('User interaction recorded:', { userId, interaction });
    return true;
  }
}

module.exports = new SearchService();
