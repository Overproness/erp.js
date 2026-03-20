// @ts-nocheck
const copilotService = require('../../../services/copilotService');
const { catchErrors } = require('../../../handlers/errorHandlers');
const { getCurrentUserId } = require('../../../utils/authUtils');
const Client = require('../../../models/appModels/Client');

/**
 * Get AI-powered customer insights and recommendations
 * Analyzes customer data and provides actionable recommendations
 */
const customerInsights = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = getCurrentUserId(req);

    if (!customerId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Customer ID is required',
      });
    }

    // Fetch customer data
    const customer = await Client.findById(customerId).exec();

    if (!customer) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Customer not found',
      });
    }

    // Prepare customer data context
    const customerContext = {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      customerType: customer.customerType,
      enabled: customer.enabled,
      demographics: customer.demographics || {},
      customerValue: customer.customerValue || {},
      behavior: customer.behavior || {},
      interaction: customer.interaction || {},
      leadScore: customer.leadScore || null,
      qualification: customer.qualification || null,
      created: customer.created,
    };

    // Create AI prompt for customer insights
    const prompt = `Analyze the following customer data and provide actionable insights and recommendations:

Customer Profile:
- Name: ${customerContext.name}
- Email: ${customerContext.email}
- Phone: ${customerContext.phone}
- Company: ${customerContext.company || 'N/A'}
- Customer Type: ${customerContext.customerType}
- Status: ${customerContext.enabled ? 'Active' : 'Inactive'}
- Customer Since: ${new Date(customerContext.created).toLocaleDateString()}

Demographics:
${JSON.stringify(customerContext.demographics, null, 2)}

Customer Value:
${JSON.stringify(customerContext.customerValue, null, 2)}

Behavior:
${JSON.stringify(customerContext.behavior, null, 2)}

Latest Interaction:
${JSON.stringify(customerContext.interaction, null, 2)}

Lead Score: ${customerContext.leadScore?.totalScore || 'Not calculated'}
Qualification: ${customerContext.qualification?.status || 'Not qualified'}

Based on this data, provide:
1. Key Insights (3-5 bullet points about this customer's profile, behavior, and value)
2. Recommendations (3-5 actionable recommendations for engaging with this customer)
3. Risk Assessment (any potential risks or concerns)
4. Opportunities (growth opportunities or upsell potential)

Format your response as a JSON object with the following structure:
{
  "insights": ["insight 1", "insight 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...],
  "risks": ["risk 1", "risk 2", ...],
  "opportunities": ["opportunity 1", "opportunity 2", ...]
}`;

    // Process with copilot service
    // Use 'default' assistantId to let it use or create a default assistant
    const result = await copilotService.processChat('default', prompt, userId, {
      module: 'customer',
      entityId: customerId,
      data: customerContext,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        result: null,
        message: result.error || 'Failed to generate customer insights',
      });
    }

    // Parse AI response
    let parsedInsights;
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedInsights = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: parse the text response
        parsedInsights = {
          insights: extractBulletPoints(result.message, 'insights', 'key insights'),
          recommendations: extractBulletPoints(result.message, 'recommendations'),
          risks: extractBulletPoints(result.message, 'risks', 'risk assessment'),
          opportunities: extractBulletPoints(result.message, 'opportunities'),
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Return raw response if parsing fails
      parsedInsights = {
        insights: [result.message],
        recommendations: [],
        risks: [],
        opportunities: [],
      };
    }

    return res.status(200).json({
      success: true,
      result: {
        customerName: customer.name,
        customerId: customerId,
        insights: parsedInsights.insights || [],
        recommendations: parsedInsights.recommendations || [],
        risks: parsedInsights.risks || [],
        opportunities: parsedInsights.opportunities || [],
        rawResponse: result.message,
        conversationId: result.conversationId,
        usage: result.usage,
        cost: result.cost,
      },
      message: 'Customer insights generated successfully',
    });
  } catch (error) {
    console.error('Customer insights controller error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Helper function to extract bullet points from text
 */
function extractBulletPoints(text, ...keywords) {
  const lines = text.split('\n');
  const bulletPoints = [];
  let capturing = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if this line contains any of the keywords (case insensitive)
    const hasKeyword = keywords.some((keyword) =>
      trimmedLine.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      capturing = true;
      continue;
    }

    // Stop capturing if we hit another section header (contains a colon at the end)
    if (capturing && trimmedLine.endsWith(':') && trimmedLine !== ':') {
      break;
    }

    // Capture bullet points
    if (
      capturing &&
      (trimmedLine.startsWith('-') || trimmedLine.startsWith('*') || /^\d+\./.test(trimmedLine))
    ) {
      const cleaned = trimmedLine.replace(/^[-*]\s*|\d+\.\s*/, '').trim();
      if (cleaned) {
        bulletPoints.push(cleaned);
      }
    }
  }

  return bulletPoints;
}

module.exports = catchErrors(customerInsights);
