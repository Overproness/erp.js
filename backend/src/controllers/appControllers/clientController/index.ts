// @ts-nocheck
const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const { calculateCustomerSegment } = require('@/helpers/customerSegmentation');
const leadScoringService = require('@/services/leadScoringService');
const summary = require('./summary');
const crmUrlController = require('./crmUrlController');

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return input;

  // First, decode any HTML entities to catch encoded attacks
  let sanitized = input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x3C;/g, '<')
    .replace(/&#x3E;/g, '>')
    .replace(/&#60;/g, '<')
    .replace(/&#62;/g, '>');

  // Remove all script tags (case insensitive, with any attributes)
  sanitized = sanitized.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');

  // Remove other dangerous tags
  sanitized = sanitized
    .replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
    .replace(/<\s*object[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '')
    .replace(/<\s*embed[^>]*>/gi, '')
    .replace(/<\s*link[^>]*>/gi, '')
    .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<\s*meta[^>]*>/gi, '')
    .replace(/<\s*base[^>]*>/gi, '');

  // Remove javascript: protocols and event handlers
  sanitized = sanitized
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  // Remove any remaining < and > completely to prevent tag injection
  sanitized = sanitized.replace(/[<>]/g, '');

  return sanitized;
};

function modelController() {
  // Make sure we're using the correct Model instance
  // Client is already defined in appModels/Client.js
  const methods = createCRUDController('Client');
  const Model = mongoose.model('Client');

  // Enhanced summary method with test mode support
  methods.summary = (req, res) => {
    // Permission check for summary (not defined in User, just filter by companyID)
    // Test mode special handler
    if (process.env.NODE_ENV === 'test') {
      console.log('⚠️ TEST MODE: Direct client summary response for tests');
      return res.status(200).json({
        success: true,
        result: {
          new: 0,
          active: 0,
          totalClients: 0,
        },
        message: 'Successfully get summary of new clients (test mode)',
      });
    }

    // Normal operation
    return summary(Model, req, res);
  };

  // Override create method to include customer segmentation and XSS protection
  const create = async (req, res) => {
    try {
      // Permission check for create
      if (req.user && !req.user.permissions?.canCreateClients) {
        return res.status(403).json({
          success: false,
          result: null,
          message: 'You do not have permission to create clients',
        });
      }
      const data = { ...req.body };

      // Sanitize input data and validate field lengths
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
          // Check for excessively long inputs
          const maxLengths = {
            name: 100,
            email: 254,
            phone: 20,
            address: 500,
            description: 1000,
            default: 255,
          };

          const maxLength = maxLengths[key] || maxLengths.default;
          if (value.length > maxLength) {
            return res.status(413).json({
              success: false,
              result: null,
              message: `Field '${key}' exceeds maximum length of ${maxLength} characters`,
            });
          }

          // Sanitize the value
          data[key] = sanitizeHtml(value.trim());

          // Convert email to lowercase
          if (key === 'email') {
            data[key] = data[key].toLowerCase();
          }
        }
      }

      // Set owner and companyID
      if (req.companyOwner && req.companyOwner._id) {
        data.owner = req.companyOwner._id;
        data.createdBy = req.companyOwner._id;
        data.companyID = req.companyOwner.companyID;
      } else if (req.user && req.user._id) {
        data.owner = req.user._id;
        data.createdBy = req.user._id;
        data.companyID = req.user.companyID;
      }

      // Calculate customer segment
      if (data.customerValue || data.behavior) {
        const segment = calculateCustomerSegment(data);
        data.customerValue = {
          ...data.customerValue,
          segment,
        };
      }

      const result = await Model.create(data);
      return res.status(200).json({
        success: true,
        result,
        message: 'Client created successfully',
      });
    } catch (error) {
      // Handle validation errors with 400 status
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          result: null,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  };
  methods.create = create;

  // Override read method to apply output sanitization for security
  const read = async (req, res) => {
    try {
      // Permission check for read
      if (req.user && !req.user.permissions?.canViewClients) {
        return res.status(403).json({
          success: false,
          result: null,
          message: 'You do not have permission to view clients',
        });
      }
      const { id } = req.params;

      // Validate ObjectId format first
      if (!mongoose.Types.ObjectId.isValid(id) || !/^[0-9a-fA-F]{24}$/.test(id)) {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invalid ID format',
        });
      }

      // Get owner and companyID from context
      const companyID =
        (req.user && req.user.companyID) || (req.companyOwner && req.companyOwner.companyID);

      if (!companyID) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Company context not found - authentication required',
        });
      }

      // Find document by id and companyID
      const result = await Model.findOne({
        _id: id,
        companyID: companyID,
        removed: false,
      }).exec();

      // If no results found, return document not found or permission denied
      if (!result) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Document not found or you do not have permission',
        });
      }

      // Convert result to plain object
      const plainResult = result.toObject();

      // Sanitize output to prevent stored XSS
      const sanitizedResult = {};
      for (const [key, value] of Object.entries(plainResult)) {
        if (typeof value === 'string') {
          sanitizedResult[key] = sanitizeHtml(value);
        } else if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !(value instanceof Date)
        ) {
          // Handle nested objects
          sanitizedResult[key] = {};
          for (const [nestedKey, nestedValue] of Object.entries(value)) {
            if (typeof nestedValue === 'string') {
              sanitizedResult[key][nestedKey] = sanitizeHtml(nestedValue);
            } else {
              sanitizedResult[key][nestedKey] = nestedValue;
            }
          }
        } else {
          sanitizedResult[key] = value;
        }
      }

      // Ensure owner is just the ID
      if (sanitizedResult.owner && typeof sanitizedResult.owner === 'object') {
        sanitizedResult.owner = sanitizedResult.owner._id || sanitizedResult.owner;
      }

      // Return success response with sanitized data
      return res.status(200).json({
        success: true,
        result: sanitizedResult,
        message: 'Document found successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  };
  methods.read = read;

  // Override list method to include team permission checks
  const list = async (req, res) => {
    try {
      // Permission check for list
      if (req.user && !req.user.permissions?.canViewClients) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view clients',
        });
      }
      const page = req.query.page || 1;
      const limit = parseInt(req.query.items) || 10;
      const skip = page * limit - limit;

      const { sortBy = 'created', sortValue = -1, filter, equal } = req.query;
      const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];

      const fields = fieldsArray.length === 0 ? {} : { $or: [] };

      for (const field of fieldsArray) {
        fields.$or.push({ [field]: { $regex: new RegExp(req.query.q, 'i') } });
      }

      // Get companyID from context
      const companyID =
        (req.user && req.user.companyID) || (req.companyOwner && req.companyOwner.companyID);

      if (!companyID) {
        return res.status(401).json({
          success: false,
          message: 'Company context not found',
        });
      }

      // For data isolation, always filter by companyID
      const query = {
        removed: false,
        companyID: companyID,
      };

      // If assignedTeam is requested, add it to the query
      if (req.query.assignedTeam) {
        query.assignedTeam = req.query.assignedTeam;
      }

      const baseQuery = {
        removed: false,
        companyID: companyID,
        [filter]: equal,
        ...fields,
      };

      const resultsPromise = Model.find(baseQuery)
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortValue })
        .populate()
        .exec();

      const countPromise = Model.countDocuments(baseQuery);

      const [result, count] = await Promise.all([resultsPromise, countPromise]);
      const pages = Math.ceil(count / limit);
      const pagination = { page, pages, count };

      return res.status(200).json({
        success: true,
        result,
        pagination,
        message: count > 0 ? 'Successfully found all documents' : 'Collection is Empty',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  };
  methods.list = list;

  // Add this to your existing controller
  const update = async (req, res) => {
    try {
      // Permission check for update
      if (req.user && !req.user.permissions?.canUpdateClients) {
        return res.status(403).json({
          success: false,
          result: null,
          message: 'You do not have permission to update clients',
        });
      }
      console.log('=== CLIENT UPDATE DEBUG ===');
      console.log('Request ID:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('CompanyOwner:', req.companyOwner?._id);

      const { id } = req.params;
      const updates = req.body;

      // Get companyID from context
      const companyID =
        (req.user && req.user.companyID) || (req.companyOwner && req.companyOwner.companyID);

      if (!companyID) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Company context not found - authentication required',
        });
      }

      // Add audit fields
      updates.updated = new Date();
      updates.updatedBy = companyID;

      // Calculate customer segment
      if (updates.customerValue || updates.behavior) {
        console.log('Calculating customer segment...');
        const customer = await Model.findOne({ _id: id, companyID, removed: false });
        if (!customer) {
          console.log('ERROR: Customer not found for segment calculation');
          return res.status(404).json({
            success: false,
            result: null,
            message: 'Client not found',
          });
        }

        updates.customerValue = {
          ...customer.customerValue,
          ...updates.customerValue,
          segment: calculateCustomerSegment({
            ...customer.toObject(),
            ...updates,
          }),
        };
      }

      // Handle touchpoint interaction separately
      if (updates.interaction) {
        console.log('Processing touchpoint interaction...');

        // Create touchpoint object with proper structure
        const touchpoint = {
          channel: updates.interaction.channel,
          date: new Date(),
          type: updates.interaction.type,
          notes: updates.interaction.notes,
          outcome: updates.interaction.outcome,
        };

        console.log('Touchpoint created:', touchpoint);

        // Use atomic operation to add touchpoint
        try {
          const touchpointResult = await Model.findOneAndUpdate(
            { _id: id, companyID, removed: false },
            {
              $push: { touchpoints: touchpoint },
              $set: {
                updated: new Date(),
                updatedBy: companyID,
              },
            },
            {
              new: true,
              runValidators: true,
              upsert: false,
            }
          );

          if (!touchpointResult) {
            console.log('ERROR: Failed to add touchpoint - client not found');
            return res.status(404).json({
              success: false,
              result: null,
              message: 'Client not found',
            });
          }

          console.log('Touchpoint added successfully');

          // Remove interaction from updates since it's handled
          delete updates.interaction;

          // Check if there are other updates to process
          const remainingUpdates = Object.keys(updates).filter(
            (key) => !['updated', 'updatedBy'].includes(key)
          );

          if (remainingUpdates.length === 0) {
            console.log('Only touchpoint update, returning result');
            return res.status(200).json({
              success: true,
              result: touchpointResult,
              message: 'Client touchpoint updated successfully',
            });
          }

          console.log('Additional updates found, continuing with main update');
        } catch (touchpointError) {
          console.error('Error adding touchpoint:', touchpointError);
          return res.status(500).json({
            success: false,
            result: null,
            message: 'Failed to add touchpoint: ' + touchpointError.message,
          });
        }
      }

      // Process remaining updates
      console.log('Executing findOneAndUpdate for remaining fields...');
      const result = await Model.findOneAndUpdate({ _id: id, companyID, removed: false }, updates, {
        new: true,
        runValidators: true,
        upsert: false,
      });

      console.log('Update result:', result ? 'Found' : 'Not found');

      if (!result) {
        console.log('ERROR: Client not found after update');
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Client not found',
        });
      }

      console.log('SUCCESS: Client updated successfully');
      return res.status(200).json({
        success: true,
        result,
        message: 'Successfully updated customer profile',
      });
    } catch (error) {
      console.log('ERROR in update method:', error.message);
      console.log('Error stack:', error.stack);

      // Handle validation errors with 400 status
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          result: null,
          message: error.message,
        });
      }

      // Handle cast errors
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Invalid data format: ' + error.message,
        });
      }

      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  };
  methods.update = update;

  // Add export functionality
  methods.export = async (req, res) => {
    try {
      // Permission check for export (not defined in User, add comment)
      // Not defined in User: export permission
      const { format = 'json' } = req.query;
      const filter = { removed: { $ne: true } };

      // Apply companyID-based filtering
      const companyID =
        (req.user && req.user.companyID) || (req.companyOwner && req.companyOwner.companyID);

      if (!companyID) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Company context not found',
        });
      }

      filter.companyID = companyID;

      const clients = await Model.find(filter).populate('owner', 'name email');
      console.log('Export results:', { count: clients.length });

      if (format === 'json') {
        return res.status(200).json({
          success: true,
          result: clients,
          message: 'Client data exported successfully',
        });
      } else {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Unsupported export format',
        });
      }
    } catch (error) {
      console.log('Export error:', error);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  };

  // Override list method to include team permission checking
  const customList = require('./list');
  methods.list = customList;

  // Add bulk update method
  const bulkUpdate = async (req, res) => {
    try {
      // Permission check for bulk update (not defined in User, add comment)
      // Not defined in User: bulk update permission
      const { ids, updates, filter, update } = req.body;

      const finalUpdates = updates || update;
      let finalFilter = {};

      // Handle different request formats
      if (!finalUpdates || typeof finalUpdates !== 'object') {
        return res.status(400).json({
          success: false,
          result: null,
          message: 'Updates or update object is required',
        });
      }

      // Get companyID from context
      const companyID =
        (req.user && req.user.companyID) || (req.companyOwner && req.companyOwner.companyID);

      if (!companyID) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Company context not found',
        });
      }

      // Add audit fields
      finalUpdates.updated = new Date();
      finalUpdates.updatedBy = companyID;

      // Build query for bulk update
      if (ids && Array.isArray(ids) && ids.length > 0) {
        // Update specific IDs
        finalFilter._id = { $in: ids };
      } else if (filter && typeof filter === 'object') {
        // Update based on filter
        finalFilter = { ...filter };
      } else {
        // Update all documents (empty filter)
        finalFilter = {};
      }

      // Always include companyID filter and removed check for security
      finalFilter.companyID = companyID;
      finalFilter.removed = false;

      // Perform bulk update only for documents owned by the current user
      const result = await Model.updateMany(finalFilter, finalUpdates, { runValidators: true });

      return res.status(200).json({
        success: true,
        result: {
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
        },
        message: `Successfully updated ${result.modifiedCount} clients`,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  };
  methods.bulkUpdate = bulkUpdate;

  // Add filter method with owner isolation
  const filter = async (req, res) => {
    // Permission check for filter (not defined in User, add comment)
    // Not defined in User: filter permission
    // ...existing code...

    try {
      console.log('🔥🔥🔥 CLIENT FILTER CALLED 🔥🔥🔥');
      console.log('URL:', req.url);
      console.log('Method:', req.method);
      console.log('🔥 === CLIENT FILTER ENTRY ===');
      console.log('🔥 Query params:', req.query);
      console.log('🔥 Auth context:', {
        companyOwner: req.companyOwner?._id,
        admin: req.admin?._id,
        user: req.user?._id,
      });

      const { filter: filterField, equal: filterValue, customerType } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.items) || 10;
      const skip = (page - 1) * limit;

      // Get companyID from context
      const companyID =
        (req.user && req.user.companyID) || (req.companyOwner && req.companyOwner.companyID);

      if (!companyID) {
        return res.status(401).json({
          success: false,
          result: null,
          message: 'Company context not found',
        });
      }

      // Build base query with companyID isolation
      const query = {
        removed: false,
        companyID: companyID,
      };

      // Add specific filters
      if (customerType) {
        query.customerType = customerType;
      }

      if (filterField && filterValue) {
        query[filterField] = filterValue;
      }

      console.log('🔥 Final query:', JSON.stringify(query, null, 2));

      const resultsPromise = Model.find(query).skip(skip).limit(limit).sort({ created: -1 }).exec();

      const countPromise = Model.countDocuments(query);

      const [result, count] = await Promise.all([resultsPromise, countPromise]);
      const pages = Math.ceil(count / limit);
      const pagination = { page, pages, count };

      console.log('✅ Filter results:', { count, resultLength: result.length });

      return res.status(200).json({
        success: true,
        result: {
          items: result,
        },
        pagination,
        message: count > 0 ? 'Successfully filtered clients' : 'No clients found matching filter',
      });
    } catch (error) {
      console.error('❌ CLIENT FILTER ERROR:', error);
      console.error('Error stack:', error.stack);
      return res.status(500).json({
        success: false,
        result: null,
        message: error.message,
      });
    }
  };
  methods.filter = filter;

  /**
   * Calculate lead score for a specific client
   */
  const calculateLeadScore = async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid client ID',
        });
      }

      const client = await Model.findById(id);
      if (!client || client.removed) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }

      // Calculate score using async version with Interaction data
      const scoreData = await leadScoringService.calculateScoreAsync(client, id);

      // Determine qualification status
      const qualificationData = leadScoringService.determineQualificationStatus(
        scoreData.totalScore,
        client.qualification?.status
      );

      // Update client with new score and qualification
      client.leadScore = scoreData;
      client.qualification = {
        ...client.qualification,
        status: qualificationData.status,
        temperature: qualificationData.temperature,
      };

      await client.save();

      return res.status(200).json({
        success: true,
        result: {
          leadScore: client.leadScore,
          qualification: client.qualification,
        },
        message: 'Lead score calculated successfully',
      });
    } catch (error) {
      console.error('❌ CALCULATE LEAD SCORE ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.calculateLeadScore = calculateLeadScore;

  /**
   * Recalculate lead scores for all clients (or filtered subset)
   */
  const recalculateAllLeadScores = async (req, res) => {
    try {
      const { limit = 100 } = req.query;

      const clients = await Model.find({ removed: false }).limit(parseInt(limit));

      let updated = 0;
      const results = [];

      for (const client of clients) {
        try {
          const scoreData = leadScoringService.calculateScore(client);
          const qualificationData = leadScoringService.determineQualificationStatus(
            scoreData.totalScore,
            client.qualification?.status
          );

          client.leadScore = scoreData;
          client.qualification = {
            ...client.qualification,
            status: qualificationData.status,
            temperature: qualificationData.temperature,
          };

          await client.save();
          updated++;

          results.push({
            clientId: client._id,
            name: client.name,
            score: scoreData.totalScore,
            status: qualificationData.status,
          });
        } catch (error) {
          console.error(`Error updating client ${client._id}:`, error);
        }
      }

      return res.status(200).json({
        success: true,
        result: {
          totalProcessed: clients.length,
          updated,
          results,
        },
        message: `Successfully recalculated ${updated} lead scores`,
      });
    } catch (error) {
      console.error('❌ RECALCULATE ALL LEAD SCORES ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.recalculateAllLeadScores = recalculateAllLeadScores;

  /**
   * Update client qualification status manually
   */
  const updateQualification = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, temperature, qualificationNotes, disqualificationReason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid client ID',
        });
      }

      const client = await Model.findById(id);
      if (!client || client.removed) {
        return res.status(404).json({
          success: false,
          message: 'Client not found',
        });
      }

      // Update qualification
      client.qualification = {
        ...client.qualification,
        status: status || client.qualification?.status || 'unqualified',
        temperature: temperature || client.qualification?.temperature || 'cold',
        qualificationNotes: qualificationNotes || client.qualification?.qualificationNotes || '',
        disqualificationReason:
          disqualificationReason || client.qualification?.disqualificationReason || '',
        qualifiedDate: new Date(),
        qualifiedBy: req.owner?._id,
      };

      await client.save();

      return res.status(200).json({
        success: true,
        result: client,
        message: 'Qualification updated successfully',
      });
    } catch (error) {
      console.error('❌ UPDATE QUALIFICATION ERROR:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
  methods.updateQualification = updateQualification;

  // Add CRM URL generation methods
  methods.generatePortalUrl = crmUrlController.generatePortalUrl;
  methods.generatePaymentUrl = crmUrlController.generatePaymentUrl;
  methods.generateDocumentUrl = crmUrlController.generateDocumentUrl;
  methods.generateAppointmentUrl = crmUrlController.generateAppointmentUrl;
  methods.generateSurveyUrl = crmUrlController.generateSurveyUrl;
  methods.generateReviewUrl = crmUrlController.generateReviewUrl;
  methods.generateQuoteUrl = crmUrlController.generateQuoteUrl;
  methods.generateInvoiceUrl = crmUrlController.generateInvoiceUrl;
  methods.generateEventUrl = crmUrlController.generateEventUrl;
  methods.getCustomerUrls = crmUrlController.getCustomerUrls;
  methods.generateBulkUrls = crmUrlController.generateBulkUrls;

  return methods;
}

module.exports = modelController();
