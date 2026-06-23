// @ts-nocheck

import Survey from '../../models/appModels/Survey';
import SurveyResponse from '../../models/appModels/SurveyResponse';
import Client from '../../models/appModels/Client';
import surveyAnalysisHelper from '../../helpers/surveyAnalysisHelper';
/**
 * Get public survey by short code
 */
const getPublicSurvey = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const survey = await Survey.findOne({
      'customUrl.shortCode': shortCode,
      removed: false,
    }).select('-owner -createdBy -updatedBy');

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    // Check if survey is active
    if (!survey.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This survey is not currently accepting responses',
        result: null,
      });
    }

    // Increment click count
    survey.customUrl.clicks += 1;
    await survey.save();

    return res.status(200).json({
      success: true,
      message: 'Survey retrieved successfully',
      result: {
        _id: survey._id,
        title: survey.title,
        description: survey.description,
        type: survey.type,
        questions: survey.questions,
        settings: survey.settings,
      },
    });
  } catch (error) {
    console.error('Error retrieving public survey:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving survey',
      result: null,
    });
  }
};

/**
 * Submit a survey response
 */
const submitResponse = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { respondent, answers, metadata, timing } = req.body;

    const survey = await Survey.findOne({
      'customUrl.shortCode': shortCode,
      removed: false,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    // Check if survey is active
    if (!survey.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This survey is not currently accepting responses',
        result: null,
      });
    }

    // Check for duplicate responses
    if (survey.settings.oneResponsePerUser && respondent && respondent.email) {
      const existingResponse = await SurveyResponse.findOne({
        survey: survey._id,
        'respondent.email': respondent.email.toLowerCase(),
        status: 'completed',
      });

      if (existingResponse) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted a response to this survey',
          result: null,
        });
      }
    }

    // Find or create customer if email is provided
    let customerId = null;
    if (respondent && respondent.email) {
      let customer = await Client.findOne({ email: respondent.email.toLowerCase() });

      if (!customer && respondent.name) {
        customer = new Client({
          name: respondent.name,
          email: respondent.email,
          phone: respondent.phone,
          type: 'lead',
        });
        await customer.save();
      }

      if (customer) {
        customerId = customer._id;
      }
    }

    // Prepare response data
    const responseData = {
      survey: survey._id,
      respondent: {
        name: respondent?.name,
        email: respondent?.email,
        phone: respondent?.phone,
        customerId,
        isAnonymous: survey.settings.allowAnonymous && !respondent?.email,
      },
      answers: answers.map((answer) => ({
        questionId: answer.questionId,
        questionText: survey.questions.find((q) => q.questionId === answer.questionId)?.question,
        questionType: survey.questions.find((q) => q.questionId === answer.questionId)?.type,
        value: answer.value,
        skipped: answer.skipped || false,
      })),
      metadata: {
        ...metadata,
        ip: survey.settings.collectIpAddress ? req.ip : null,
        userAgent: req.headers['user-agent'],
      },
      timing: timing || {},
      status: 'completed',
    };

    // Calculate NPS if applicable
    const npsQuestion = survey.questions.find((q) => q.type === 'nps');
    if (npsQuestion) {
      const npsAnswer = answers.find((a) => a.questionId === npsQuestion.questionId);
      if (npsAnswer && !isNaN(npsAnswer.value)) {
        responseData.nps = {
          score: parseInt(npsAnswer.value),
        };
      }
    }

    const response = new SurveyResponse(responseData);
    await response.save();

    // Analyze sentiment and feedback
    await surveyAnalysisHelper.analyzeFeedback(response._id);

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      result: {
        _id: response._id,
        thankYouMessage: survey.settings.thankYouMessage,
        redirectUrl: survey.settings.redirectUrl,
      },
    });
  } catch (error) {
    console.error('Error submitting survey response:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error submitting response',
      result: null,
    });
  }
};

/**
 * Save partial response (for auto-save)
 */
const savePartialResponse = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { responseId, answers, metadata, timing } = req.body;

    const survey = await Survey.findOne({
      'customUrl.shortCode': shortCode,
      removed: false,
    });

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
        result: null,
      });
    }

    let response;

    if (responseId) {
      // Update existing partial response
      response = await SurveyResponse.findOneAndUpdate(
        { _id: responseId, survey: survey._id, status: { $in: ['started', 'in_progress'] } },
        {
          answers,
          metadata,
          timing,
          status: 'in_progress',
        },
        { new: true }
      );
    } else {
      // Create new partial response
      response = new SurveyResponse({
        survey: survey._id,
        answers,
        metadata: {
          ...metadata,
          ip: survey.settings.collectIpAddress ? req.ip : null,
          userAgent: req.headers['user-agent'],
        },
        timing,
        status: 'started',
      });
      await response.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Progress saved',
      result: { _id: response._id },
    });
  } catch (error) {
    console.error('Error saving partial response:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error saving progress',
      result: null,
    });
  }
};

/**
 * Get a single response (for authenticated users)
 */
const getResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const response = await SurveyResponse.findById(id)
      .populate({
        path: 'survey',
        match: { owner },
      })
      .populate('respondent.customerId', 'name email phone');

    if (!response || !response.survey) {
      return res.status(404).json({
        success: false,
        message: 'Response not found',
        result: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Response retrieved successfully',
      result: response,
    });
  } catch (error) {
    console.error('Error retrieving response:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving response',
      result: null,
    });
  }
};

/**
 * Update response follow-up status
 */
const updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;
    const { status, notes, assignedTo } = req.body;

    const response = await SurveyResponse.findById(id).populate({
      path: 'survey',
      match: { owner },
    });

    if (!response || !response.survey) {
      return res.status(404).json({
        success: false,
        message: 'Response not found',
        result: null,
      });
    }

    if (status) {
      response.followUp.status = status;

      if (status === 'contacted') {
        response.followUp.contactedAt = new Date();
      }

      if (status === 'resolved') {
        response.followUp.resolvedAt = new Date();
      }
    }

    if (notes) {
      response.followUp.notes.push(notes);
    }

    if (assignedTo) {
      response.followUp.assignedTo = assignedTo;
    }

    await response.save();

    return res.status(200).json({
      success: true,
      message: 'Follow-up updated successfully',
      result: response,
    });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating follow-up',
      result: null,
    });
  }
};

/**
 * Delete a response
 */
const deleteResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.companyOwner._id;

    const response = await SurveyResponse.findById(id).populate({
      path: 'survey',
      match: { owner },
    });

    if (!response || !response.survey) {
      return res.status(404).json({
        success: false,
        message: 'Response not found',
        result: null,
      });
    }

    response.removed = true;
    await response.save();

    return res.status(200).json({
      success: true,
      message: 'Response deleted successfully',
      result: response,
    });
  } catch (error) {
    console.error('Error deleting response:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting response',
      result: null,
    });
  }
};

export = {
  getPublicSurvey,
  submitResponse,
  savePartialResponse,
  getResponse,
  updateFollowUp,
  deleteResponse,
};
