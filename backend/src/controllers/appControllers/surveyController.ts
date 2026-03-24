// @ts-nocheck
const Survey = require('../../models/appModels/Survey');
const SurveyResponse = require('../../models/appModels/SurveyResponse');
const surveyAnalysisHelper = require('../../helpers/surveyAnalysisHelper');

/**
 * Create a new survey
 */
const create = async (req, res) => {
  try {
    const { title, description, type, questions, settings, distribution, tags, business } =
      req.body;

    const owner = req.companyOwner._id;

    // Validate required fields
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title and at least one question are required',
        result: null,
      });
    }

    const survey = new Survey({
      title,
      description,
      type: type || 'custom',
      owner,
      business,
      questions,
      settings: settings || {},
      distribution: distribution || {},
      tags: tags || [],
      createdBy: owner,
      status: 'draft',
    });

    await survey.save();

    return res.status(201).json({
      success: true,
      message: 'Survey created successfully',
      result: survey,
    });
  } catch (error) {
    console.error('Error creating survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating survey',
      result: null,
    });
  }
};

/**
 * List all surveys for the authenticated user
 */
const list = async (req, res) => {
  try {
    const owner = req.companyOwner._id;
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { owner, removed: false };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const surveys = await Survey.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('business', 'name')
      .lean();

    const total = await Survey.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Surveys retrieved successfully',
      result: surveys,
      pagination: {
        page: parseInt(page),
        count: surveys.length,
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error('Error listing surveys:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving surveys',
      result: null,
    });
  }
};

/**
 * Get a single survey by ID
 */
const read = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const survey = await Survey.findOne({
      _id: id,
      owner,
      removed: false,
    }).populate('business', 'name');

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Survey retrieved successfully',
      result: survey,
    });
  } catch (error) {
    console.error('Error retrieving survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving survey',
      result: null,
    });
  }
};

/**
 * Update a survey
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.owner;
    delete updateData.createdBy;
    delete updateData.analytics;

    updateData.updatedBy = owner;

    const survey = await Survey.findOneAndUpdate({ _id: id, owner, removed: false }, updateData, {
      new: true,
      runValidators: true,
    }).populate('business', 'name');

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Survey updated successfully',
      result: survey,
    });
  } catch (error) {
    console.error('Error updating survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating survey',
      result: null,
    });
  }
};

/**
 * Delete a survey (soft delete)
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const survey = await Survey.findOneAndUpdate(
      { _id: id, owner, removed: false },
      { removed: true, status: 'archived' },
      { new: true }
    );

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Survey deleted successfully',
      result: survey,
    });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting survey',
      result: null,
    });
  }
};

/**
 * Get survey analytics
 */
const getAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const survey = await Survey.findOne({
      _id: id,
      owner,
      removed: false,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    // Get detailed analytics
    const analytics = await surveyAnalysisHelper.getDetailedAnalytics(survey._id);

    return res.status(200).json({
      success: true,
      message: 'Survey analytics retrieved successfully',
      result: analytics,
    });
  } catch (error) {
    console.error('Error retrieving survey analytics:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving analytics',
      result: null,
    });
  }
};

/**
 * Get NPS score and breakdown
 */
const getNPS = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const survey = await Survey.findOne({
      _id: id,
      owner,
      removed: false,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    const npsData = await surveyAnalysisHelper.calculateNPSBreakdown(survey._id);

    return res.status(200).json({
      success: true,
      message: 'NPS data retrieved successfully',
      result: npsData,
    });
  } catch (error) {
    console.error('Error retrieving NPS data:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving NPS data',
      result: null,
    });
  }
};

/**
 * Get survey responses
 */
const getResponses = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;
    const {
      page = 1,
      limit = 10,
      status,
      npsCategory,
      sentimentCategory,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const survey = await Survey.findOne({
      _id: id,
      owner,
      removed: false,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    const query = { survey: id, removed: false };

    if (status) {
      query.status = status;
    }

    if (npsCategory) {
      query['nps.category'] = npsCategory;
    }

    if (sentimentCategory) {
      query['sentiment.overall.category'] = sentimentCategory;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const responses = await SurveyResponse.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('respondent.customerId', 'name email')
      .lean();

    const total = await SurveyResponse.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Survey responses retrieved successfully',
      result: responses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (error) {
    console.error('Error retrieving survey responses:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving responses',
      result: null,
    });
  }
};

/**
 * Publish/activate a survey
 */
const publish = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const survey = await Survey.findOne({
      _id: id,
      owner,
      removed: false,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    if (survey.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Survey is already active',
        result: null,
      });
    }

    survey.status = 'active';
    await survey.save();

    return res.status(200).json({
      success: true,
      message: 'Survey published successfully',
      result: survey,
    });
  } catch (error) {
    console.error('Error publishing survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error publishing survey',
      result: null,
    });
  }
};

/**
 * Pause a survey
 */
const pause = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const survey = await Survey.findOne({
      _id: id,
      owner,
      removed: false,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    survey.status = 'paused';
    await survey.save();

    return res.status(200).json({
      success: true,
      message: 'Survey paused successfully',
      result: survey,
    });
  } catch (error) {
    console.error('Error pausing survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error pausing survey',
      result: null,
    });
  }
};

/**
 * Close a survey
 */
const close = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const survey = await Survey.findOne({
      _id: id,
      owner,
      removed: false,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    survey.status = 'closed';
    await survey.save();

    return res.status(200).json({
      success: true,
      message: 'Survey closed successfully',
      result: survey,
    });
  } catch (error) {
    console.error('Error closing survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error closing survey',
      result: null,
    });
  }
};

/**
 * Duplicate a survey
 */
const duplicate = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const originalSurvey = await Survey.findOne({
      _id: id,
      owner,
      removed: false,
    });

    if (!originalSurvey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    const surveyData = originalSurvey.toObject();
    delete surveyData._id;
    delete surveyData.createdAt;
    delete surveyData.updatedAt;
    delete surveyData.customUrl;
    delete surveyData.analytics;

    surveyData.title = `${surveyData.title} (Copy)`;
    surveyData.status = 'draft';
    surveyData.createdBy = owner;

    const newSurvey = new Survey(surveyData);
    await newSurvey.save();

    return res.status(201).json({
      success: true,
      message: 'Survey duplicated successfully',
      result: newSurvey,
    });
  } catch (error) {
    console.error('Error duplicating survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error duplicating survey',
      result: null,
    });
  }
};

/**
 * Export survey results
 */
const exportResults = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;
    const { format = 'csv' } = req.query;

    const survey = await Survey.findOne({
      _id: id,
      owner,
      removed: false,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    const exportData = await surveyAnalysisHelper.exportSurveyResults(survey._id, format);

    return res.status(200).json({
      success: true,
      message: 'Survey results exported successfully',
      result: exportData,
    });
  } catch (error) {
    console.error('Error exporting survey results:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error exporting results',
      result: null,
    });
  }
};

/**
 * Get AI-powered suggestions for survey
 */
const getAISuggestions = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const survey = await Survey.findOne({
      _id: id,
      owner,
      removed: false,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    // Get all responses for the survey
    const responses = await SurveyResponse.find({
      survey: survey._id,
    }).limit(100); // Limit to last 100 responses for performance

    if (responses.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No responses available for analysis',
        result: {
          suggestions: [],
          insights: [],
          summary: 'No responses available yet. Please wait for users to submit responses.',
        },
      });
    }

    // Generate AI analysis
    const aiAnalysis = await surveyAnalysisHelper.generateAISuggestions(survey, responses);

    return res.status(200).json({
      success: true,
      message: 'AI suggestions generated successfully',
      result: aiAnalysis,
    });
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error generating AI suggestions',
      result: null,
    });
  }
};

module.exports = {
  create,
  list,
  read,
  update,
  remove,
  getAnalytics,
  getNPS,
  getResponses,
  publish,
  pause,
  close,
  duplicate,
  exportResults,
  getAISuggestions,
};
