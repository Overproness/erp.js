// @ts-nocheck

import Survey from '../models/appModels/Survey';
import SurveyResponse from '../models/appModels/SurveyResponse';
import nlpService from './nlpService';
/**
 * Analyze feedback using AI
 */
const analyzeFeedback = async (responseId) => {
  try {
    const response = await SurveyResponse.findById(responseId).populate('survey');

    if (!response) {
      throw new Error('Response not found');
    }

    // Collect all text answers
    const textAnswers = response.answers
      .filter((a) => ['text', 'multiple_choice', 'single_choice'].includes(a.questionType))
      .filter((a) => a.value && typeof a.value === 'string')
      .map((a) => ({
        question: a.questionText,
        answer: a.value,
      }));

    if (textAnswers.length === 0) {
      return;
    }

    // Combine text for sentiment analysis
    const combinedText = textAnswers.map((a) => a.answer).join(' ');

    // Perform sentiment analysis
    const sentimentResult = await nlpService.analyzeSentiment(combinedText);

    // Update response with sentiment data
    response.sentiment = {
      overall: {
        score: sentimentResult.score || 0,
        category: sentimentResult.label || 'neutral',
      },
      byQuestion: textAnswers.map((ta) => ({
        questionId: response.answers.find((a) => a.questionText === ta.question)?.questionId,
        score: sentimentResult.score || 0,
        category: sentimentResult.label || 'neutral',
        keywords: [],
        emotions: [],
      })),
    };

    // Basic keyword extraction for insights using NLP
    const nlpResult = await nlpService.processText(combinedText, { keywordLimit: 10 });

    response.aiAnalysis = {
      processed: true,
      processedAt: new Date(),
      insights: [],
      summary: `Survey response analyzed with ${sentimentResult.label || 'neutral'} sentiment.`,
      themes: nlpResult.keywords || [],
      actionableItems: [],
    };

    response.markModified('sentiment');
    response.markModified('aiAnalysis');
    await response.save();

    return response;
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    throw error;
  }
};

/**
 * Get detailed analytics for a survey
 */
const getDetailedAnalytics = async (surveyId) => {
  try {
    const survey = await Survey.findById(surveyId);

    if (!survey) {
      throw new Error('Survey not found');
    }

    const responses = await SurveyResponse.find({
      survey: surveyId,
      removed: false,
    });

    const completedResponses = responses.filter((r) => r.status === 'completed');

    // Question-level analytics
    const questionAnalytics = survey.questions.map((question) => {
      const answers = completedResponses
        .map((r) => r.answers.find((a) => a.questionId === question.questionId))
        .filter((a) => a && !a.skipped);

      const analytics = {
        questionId: question.questionId,
        question: question.question,
        type: question.type,
        totalAnswers: answers.length,
        skipped: completedResponses.length - answers.length,
      };

      if (question.type === 'rating' || question.type === 'scale' || question.type === 'nps') {
        const values = answers.map((a) => parseFloat(a.value)).filter((v) => !isNaN(v));

        if (values.length > 0) {
          analytics.average = values.reduce((sum, v) => sum + v, 0) / values.length;
          analytics.min = Math.min(...values);
          analytics.max = Math.max(...values);
          analytics.distribution = {};

          values.forEach((v) => {
            analytics.distribution[v] = (analytics.distribution[v] || 0) + 1;
          });
        }
      } else if (question.type === 'multiple_choice' || question.type === 'single_choice') {
        analytics.distribution = {};

        answers.forEach((a) => {
          const value = Array.isArray(a.value) ? a.value : [a.value];
          value.forEach((v) => {
            analytics.distribution[v] = (analytics.distribution[v] || 0) + 1;
          });
        });
      } else if (question.type === 'boolean') {
        analytics.distribution = {
          true: answers.filter((a) => a.value === true || a.value === 'true').length,
          false: answers.filter((a) => a.value === false || a.value === 'false').length,
        };
      } else if (question.type === 'text') {
        // Text analytics
        const textValues = answers
          .map((a) => a.value)
          .filter((v) => typeof v === 'string' && v.length > 0);
        analytics.responseCount = textValues.length;
        analytics.averageLength =
          textValues.length > 0
            ? textValues.reduce((sum, v) => sum + v.length, 0) / textValues.length
            : 0;
      }

      return analytics;
    });

    // Sentiment distribution
    const sentimentDistribution = {
      positive: completedResponses.filter((r) => r.sentiment?.overall?.category === 'positive')
        .length,
      neutral: completedResponses.filter((r) => r.sentiment?.overall?.category === 'neutral')
        .length,
      negative: completedResponses.filter((r) => r.sentiment?.overall?.category === 'negative')
        .length,
    };

    // NPS distribution
    const npsDistribution = {
      promoters: completedResponses.filter((r) => r.nps?.category === 'promoter').length,
      passives: completedResponses.filter((r) => r.nps?.category === 'passive').length,
      detractors: completedResponses.filter((r) => r.nps?.category === 'detractor').length,
    };

    // Time-based trends
    const responsesByDate = {};
    completedResponses.forEach((r) => {
      const date = r.createdAt.toISOString().split('T')[0];
      responsesByDate[date] = (responsesByDate[date] || 0) + 1;
    });

    // Common themes from AI analysis
    const allThemes = completedResponses
      .filter((r) => r.aiAnalysis?.themes)
      .flatMap((r) => r.aiAnalysis.themes);

    const themeFrequency = {};
    allThemes.forEach((theme) => {
      themeFrequency[theme] = (themeFrequency[theme] || 0) + 1;
    });

    const topThemes = Object.entries(themeFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));

    // Actionable items summary
    const actionableItems = completedResponses
      .filter((r) => r.aiAnalysis?.actionableItems)
      .flatMap((r) => r.aiAnalysis.actionableItems);

    const actionItemsByPriority = {
      critical: actionableItems.filter((i) => i.priority === 'critical').length,
      high: actionableItems.filter((i) => i.priority === 'high').length,
      medium: actionableItems.filter((i) => i.priority === 'medium').length,
      low: actionableItems.filter((i) => i.priority === 'low').length,
    };

    return {
      summary: survey.analytics,
      questionAnalytics,
      sentimentDistribution,
      npsDistribution,
      responsesByDate,
      topThemes,
      actionItemsByPriority,
      topActionableItems: actionableItems
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        })
        .slice(0, 10),
    };
  } catch (error) {
    console.error('Error getting detailed analytics:', error);
    throw error;
  }
};

/**
 * Calculate NPS breakdown
 */
const calculateNPSBreakdown = async (surveyId) => {
  try {
    const responses = await SurveyResponse.find({
      survey: surveyId,
      status: 'completed',
      'nps.score': { $exists: true },
    });

    const total = responses.length;
    const promoters = responses.filter((r) => r.nps.category === 'promoter').length;
    const passives = responses.filter((r) => r.nps.category === 'passive').length;
    const detractors = responses.filter((r) => r.nps.category === 'detractor').length;

    const npsScore = total > 0 ? ((promoters - detractors) / total) * 100 : 0;

    // NPS over time
    const npsByDate = {};
    responses.forEach((r) => {
      const date = r.createdAt.toISOString().split('T')[0];
      if (!npsByDate[date]) {
        npsByDate[date] = { promoters: 0, passives: 0, detractors: 0, total: 0 };
      }
      npsByDate[date][r.nps.category + 's']++;
      npsByDate[date].total++;
    });

    const npsTimeline = Object.entries(npsByDate).map(([date, data]) => ({
      date,
      nps: ((data.promoters - data.detractors) / data.total) * 100,
      ...data,
    }));

    return {
      currentNPS: Math.round(npsScore),
      total,
      promoters,
      passives,
      detractors,
      percentages: {
        promoters: total > 0 ? Math.round((promoters / total) * 100) : 0,
        passives: total > 0 ? Math.round((passives / total) * 100) : 0,
        detractors: total > 0 ? Math.round((detractors / total) * 100) : 0,
      },
      timeline: npsTimeline,
    };
  } catch (error) {
    console.error('Error calculating NPS breakdown:', error);
    throw error;
  }
};

/**
 * Export survey results
 */
const exportSurveyResults = async (surveyId, format = 'csv') => {
  try {
    const survey = await Survey.findById(surveyId);
    const responses = await SurveyResponse.find({
      survey: surveyId,
      status: 'completed',
      removed: false,
    }).populate('respondent.customerId', 'name email phone');

    if (format === 'csv') {
      // Create CSV headers
      const headers = [
        'Response ID',
        'Date',
        'Respondent Name',
        'Respondent Email',
        'Status',
        'Time Spent (seconds)',
        'NPS Score',
        'NPS Category',
        'Sentiment',
        ...survey.questions.map((q) => q.question),
      ];

      // Create CSV rows
      const rows = responses.map((response) => {
        const row = [
          response._id.toString(),
          response.createdAt.toISOString(),
          response.respondent.name || 'Anonymous',
          response.respondent.email || '',
          response.status,
          response.timing.timeSpent || 0,
          response.nps?.score || '',
          response.nps?.category || '',
          response.sentiment?.overall?.category || '',
        ];

        // Add answers in order
        survey.questions.forEach((question) => {
          const answer = response.answers.find((a) => a.questionId === question.questionId);
          const value = answer
            ? Array.isArray(answer.value)
              ? answer.value.join(', ')
              : answer.value
            : '';
          row.push(value);
        });

        return row;
      });

      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return {
        format: 'csv',
        filename: `survey-${surveyId}-${Date.now()}.csv`,
        data: csv,
      };
    } else if (format === 'json') {
      return {
        format: 'json',
        filename: `survey-${surveyId}-${Date.now()}.json`,
        data: JSON.stringify(
          {
            survey: {
              id: survey._id,
              title: survey.title,
              description: survey.description,
            },
            responses: responses.map((r) => ({
              id: r._id,
              date: r.createdAt,
              respondent: {
                name: r.respondent.name,
                email: r.respondent.email,
              },
              answers: r.answers,
              nps: r.nps,
              sentiment: r.sentiment,
              timing: r.timing,
            })),
          },
          null,
          2
        ),
      };
    }

    throw new Error('Unsupported export format');
  } catch (error) {
    console.error('Error exporting survey results:', error);
    throw error;
  }
};

/**
 * Generate AI-powered suggestions for survey
 */
const generateAISuggestions = async (survey, responses) => {
  try {
    // Aggregate all text responses
    const allTextResponses = [];
    const sentimentScores = [];
    const allKeywords = [];

    for (const response of responses) {
      // Collect text answers
      const textAnswers = response.answers
        .filter((a) => a.value && typeof a.value === 'string')
        .map((a) => ({
          question: a.questionText,
          answer: a.value,
        }));

      allTextResponses.push(...textAnswers);

      // Collect sentiment data
      if (response.sentiment?.overall?.score !== undefined) {
        sentimentScores.push(response.sentiment.overall.score);
      }

      // Collect keywords from aiAnalysis
      if (response.aiAnalysis?.themes) {
        allKeywords.push(...response.aiAnalysis.themes);
      }
    }

    // Calculate overall sentiment
    const avgSentiment =
      sentimentScores.length > 0
        ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
        : 0;

    const sentimentLabel =
      avgSentiment > 0.1 ? 'positive' : avgSentiment < -0.1 ? 'negative' : 'neutral';

    // Analyze most common keywords
    const keywordFrequency = {};
    allKeywords.forEach((keyword) => {
      keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
    });

    const topKeywords = Object.entries(keywordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // Generate NLP-based insights
    const combinedText = allTextResponses.map((r) => r.answer).join(' ');
    const nlpResult = await nlpService.processText(combinedText, { keywordLimit: 15 });

    // Generate suggestions based on analysis
    const suggestions = [];

    // Sentiment-based suggestions
    if (sentimentLabel === 'negative') {
      suggestions.push({
        type: 'improvement',
        priority: 'high',
        title: 'Address Negative Feedback',
        description: `The overall sentiment is negative (${avgSentiment.toFixed(
          2
        )}). Consider reaching out to dissatisfied respondents.`,
        action: 'Review negative responses and create an action plan to address common concerns.',
      });
    } else if (sentimentLabel === 'positive') {
      suggestions.push({
        type: 'success',
        priority: 'medium',
        title: 'Leverage Positive Feedback',
        description: `The overall sentiment is positive (${avgSentiment.toFixed(
          2
        )}). Use this feedback for testimonials and marketing.`,
        action: 'Request permission to use positive feedback as testimonials.',
      });
    }

    // Response rate suggestions
    if (responses.length < 10) {
      suggestions.push({
        type: 'engagement',
        priority: 'high',
        title: 'Increase Response Rate',
        description:
          'You have received fewer than 10 responses. Consider promoting your survey more.',
        action: 'Share survey link via email, social media, or website to increase visibility.',
      });
    }

    // Common theme suggestions
    if (topKeywords.length > 0) {
      const mostCommonTheme = topKeywords[0];
      suggestions.push({
        type: 'insight',
        priority: 'medium',
        title: `Focus on "${mostCommonTheme.keyword}"`,
        description: `"${mostCommonTheme.keyword}" was mentioned ${mostCommonTheme.count} times in responses.`,
        action: `Investigate why "${mostCommonTheme.keyword}" is a recurring theme and take appropriate action.`,
      });
    }

    // Build insights summary
    const insights = [
      `Total responses analyzed: ${responses.length}`,
      `Overall sentiment: ${sentimentLabel} (score: ${avgSentiment.toFixed(2)})`,
      `Most common keywords: ${topKeywords
        .slice(0, 5)
        .map((k) => k.keyword)
        .join(', ')}`,
      `Average response length: ${
        nlpResult.wordCount ? (nlpResult.wordCount / allTextResponses.length).toFixed(0) : 0
      } words`,
    ];

    return {
      summary: `Analysis of ${
        responses.length
      } survey responses shows ${sentimentLabel} sentiment with an average score of ${avgSentiment.toFixed(
        2
      )}.`,
      sentiment: {
        overall: sentimentLabel,
        score: avgSentiment,
        distribution: {
          positive: sentimentScores.filter((s) => s > 0.1).length,
          neutral: sentimentScores.filter((s) => s >= -0.1 && s <= 0.1).length,
          negative: sentimentScores.filter((s) => s < -0.1).length,
        },
      },
      topKeywords,
      suggestions,
      insights,
      responseCount: responses.length,
      analyzedAt: new Date(),
    };
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    throw error;
  }
};

export = {
  analyzeFeedback,
  getDetailedAnalytics,
  calculateNPSBreakdown,
  exportSurveyResults,
  generateAISuggestions,
};
