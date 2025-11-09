const searchService = require('../../../services/searchService');
const SavedSearch = require('../../../models/appModels/SavedSearch');

/**
 * Advanced Search Controller
 * Handles search, filtering, and saved search functionality
 */
const advancedSearchController = {
  /**
   * Perform advanced search with filters
   */
  async search(req, res) {
    try {
      const {
        entityType,
        criteria = {},
        page = 1,
        limit = 20,
        sortBy = 'created',
        sortOrder = 'desc',
        filters = {},
      } = req.body;

      if (!entityType) {
        return res.status(400).json({
          success: false,
          message: 'Entity type is required',
        });
      }

      const options = {
        owner: req.user ? req.user._id : req.companyOwner._id,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        filters,
      };

      const results = await searchService.search(entityType, criteria, options);

      res.status(200).json({
        success: true,
        result: results,
        message: 'Search completed successfully',
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error performing search',
      });
    }
  },

  /**
   * Apply filters to existing search results
   */
  async filter(req, res) {
    try {
      const {
        entityType,
        filters = {},
        page = 1,
        limit = 20,
        sortBy = 'created',
        sortOrder = 'desc',
      } = req.body;

      if (!entityType) {
        return res.status(400).json({
          success: false,
          message: 'Entity type is required',
        });
      }

      const options = {
        owner: req.user ? req.user._id : req.companyOwner._id,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        filters,
      };

      // Use filters as search criteria
      const results = await searchService.search(entityType, filters, options);

      res.status(200).json({
        success: true,
        result: results,
        message: 'Filters applied successfully',
      });
    } catch (error) {
      console.error('Filter error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error applying filters',
      });
    }
  },

  /**
   * Save a search for later use
   */
  async saveSearch(req, res) {
    try {
      const { name, entityType, criteria, filters, description } = req.body;

      if (!name || !entityType) {
        return res.status(400).json({
          success: false,
          message: 'Name and entity type are required',
        });
      }

      const searchData = {
        name,
        entityType,
        searchCriteria: criteria,
        filters,
        description,
      };

      const owner = req.user ? req.user._id : req.companyOwner._id;
      const savedSearch = await searchService.saveSearch(
        searchData,
        req.user ? req.user._id : req.companyOwner._id,
        owner
      );

      res.status(201).json({
        success: true,
        result: savedSearch,
        message: 'Search saved successfully',
      });
    } catch (error) {
      console.error('Save search error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error saving search',
      });
    }
  },

  /**
   * Execute a saved search
   */
  async executeSavedSearch(req, res) {
    try {
      const { searchId } = req.params;
      const { page = 1, limit = 20, sortBy = 'created', sortOrder = 'desc' } = req.query;

      if (!searchId) {
        return res.status(400).json({
          success: false,
          message: 'Search ID is required',
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
      };

      const owner = req.user ? req.user._id : req.companyOwner._id;
      const results = await searchService.executeSavedSearch(searchId, owner, options);

      res.status(200).json({
        success: true,
        result: results,
        message: 'Saved search executed successfully',
      });
    } catch (error) {
      console.error('Execute saved search error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error executing saved search',
      });
    }
  },

  /**
   * Get search history for user
   */
  async getSearchHistory(req, res) {
    try {
      const { page = 1, limit = 20, entityType } = req.query;

      const owner = req.user ? req.user._id : req.companyOwner._id;

      let query = { owner };
      if (entityType) {
        query.entityType = entityType;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const searches = await SavedSearch.find(query)
        .sort({ lastUsed: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email');

      const total = await SavedSearch.countDocuments(query);

      res.status(200).json({
        success: true,
        result: {
          searches,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
            hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
            hasPrev: parseInt(page) > 1,
          },
        },
        message: 'Search history retrieved successfully',
      });
    } catch (error) {
      console.error('Get search history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving search history',
      });
    }
  },

  /**
   * List all saved searches for user
   */
  async listSavedSearches(req, res) {
    try {
      const { entityType } = req.query;
      const owner = req.user ? req.user._id : req.companyOwner._id;

      const savedSearches = await searchService.getSavedSearches(owner, entityType);

      res.status(200).json({
        success: true,
        result: savedSearches,
        message: 'Saved searches retrieved successfully',
      });
    } catch (error) {
      console.error('List saved searches error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error retrieving saved searches',
      });
    }
  },

  /**
   * Full text search across entities
   */
  async fullTextSearch(req, res) {
    try {
      const {
        entityType,
        searchTerm,
        page = 1,
        limit = 20,
        sortBy = 'created',
        sortOrder = 'desc',
      } = req.body;

      if (!entityType || !searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Entity type and search term are required',
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
      };

      const owner = req.user ? req.user._id : req.companyOwner._id;
      const results = await searchService.fullTextSearch(entityType, searchTerm, owner, options);

      res.status(200).json({
        success: true,
        result: results,
        message: 'Full text search completed successfully',
      });
    } catch (error) {
      console.error('Full text search error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error performing full text search',
      });
    }
  },
};

module.exports = advancedSearchController;
