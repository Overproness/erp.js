// @ts-nocheck

import OpenAI from 'openai';
import AiExtractionTemplate from '@/models/appModels/AiExtractionTemplate';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const extractData = async (req, res) => {
  try {
    const { text, template, fields } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Text is required for data extraction',
      });
    }

    let extractionTemplate = null;
    let extractionFields = fields || [];

    // If template ID is provided, fetch the template
    if (template && typeof template === 'string') {
      extractionTemplate = await AiExtractionTemplate.findOne({
        _id: template,
        owner: req.admin._id,
        removed: false,
        enabled: true,
      });

      if (!extractionTemplate) {
        return res.status(404).json({
          success: false,
          result: null,
          message: 'Extraction template not found',
        });
      }

      extractionFields = extractionTemplate.fields;
    } else if (template && typeof template === 'object') {
      // Template provided as object
      extractionFields = template.fields || [];
    }

    if (extractionFields.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'No extraction fields specified',
      });
    }

    const startTime = Date.now();

    // Build extraction prompt
    const systemPrompt = `You are an expert data extraction AI. Your job is to extract specific fields from unstructured text with high accuracy. 

Rules:
1. Extract ONLY the requested fields
2. Return data in valid JSON format
3. Use null for missing or unclear values
4. Maintain data types as specified
5. Be conservative - if unsure, use null rather than guessing
6. For currency values, extract only the number (no currency symbols)
7. For dates, use ISO format (YYYY-MM-DD) when possible`;

    // Build field descriptions for the prompt
    const fieldDescriptions = extractionFields.map(field => {
      let desc = `"${field.key}" (${field.type})`;
      if (field.required) desc += ' [REQUIRED]';
      if (field.label) desc += ` - ${field.label}`;
      return desc;
    }).join('\n');

    const userPrompt = `Extract the following fields from the provided text:

${fieldDescriptions}

Text to extract from:
"""
${text}
"""

Return the extracted data as a JSON object with the exact field keys specified above. If a field cannot be found or is unclear, use null as the value.`;

    // Call OpenAI for data extraction
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const extractedContent = response.choices[0]?.message?.content || '{}';
    let extractedData = {};

    try {
      extractedData = JSON.parse(extractedContent);
    } catch (parseError) {
      console.error('Failed to parse extracted JSON:', parseError);
      return res.status(500).json({
        success: false,
        result: null,
        message: 'Failed to parse extracted data',
      });
    }

    const processingTime = Date.now() - startTime;

    // Validate and calculate confidence for each field
    const validatedResults = [];
    let overallConfidence = 0;
    let validFieldCount = 0;

    for (const field of extractionFields) {
      const extractedValue = extractedData[field.key];
      let confidence = 0;
      let isValid = true;
      let validationError = null;

      if (extractedValue !== null && extractedValue !== undefined) {
        // Calculate confidence based on field type and content
        confidence = calculateFieldConfidence(field, extractedValue, text);
        
        // Validate field based on type and constraints
        const validation = validateField(field, extractedValue);
        isValid = validation.isValid;
        validationError = validation.error;
        
        if (isValid) {
          validFieldCount++;
          overallConfidence += confidence;
        }
      } else if (field.required) {
        confidence = 0;
        isValid = false;
        validationError = 'Required field is missing';
      } else {
        confidence = 85; // High confidence for correctly identified missing optional fields
        validFieldCount++;
        overallConfidence += confidence;
      }

      validatedResults.push({
        field: field.key,
        label: field.label,
        type: field.type,
        value: extractedValue,
        confidence: Math.round(confidence),
        isValid,
        validationError,
        required: field.required || false,
      });
    }

    // Calculate overall confidence
    const finalConfidence = validFieldCount > 0 ? Math.round(overallConfidence / validFieldCount) : 0;

    // Update template usage count if template was used
    if (extractionTemplate) {
      extractionTemplate.usage_count += 1;
      await extractionTemplate.save();
    }

    const result = {
      extractedData: validatedResults,
      overallConfidence: finalConfidence,
      validFieldCount,
      totalFields: extractionFields.length,
      processingTime,
      tokensUsed: response.usage?.total_tokens || 0,
      cost: calculateCost(response.usage?.total_tokens || 0),
      template: extractionTemplate ? {
        id: extractionTemplate._id,
        name: extractionTemplate.name,
        category: extractionTemplate.category,
      } : null,
      processedAt: new Date().toISOString(),
      processedBy: req.admin._id,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'Data extraction completed successfully',
    });

  } catch (error) {
    console.error('Data Extraction Error:', error);
    
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Data extraction failed',
      error: error.message,
    });
  }
};

// Helper function to calculate field confidence
function calculateFieldConfidence(field, value, originalText) {
  let confidence = 60; // Base confidence
  
  // Check if value exists in original text (fuzzy match)
  const valueStr = String(value).toLowerCase();
  const textLower = originalText.toLowerCase();
  
  if (textLower.includes(valueStr)) {
    confidence += 25;
  }
  
  // Type-specific confidence adjustments
  switch (field.type) {
    case 'currency':
      if (/^\d+(\.\d{2})?$/.test(value)) confidence += 10;
      break;
    case 'date':
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) confidence += 15;
      break;
    case 'datetime':
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) confidence += 15;
      break;
    case 'number':
      if (!isNaN(value)) confidence += 10;
      break;
    case 'text':
      if (value && value.length > 0) confidence += 5;
      break;
  }
  
  // Field-specific confidence boosts
  if (field.key.includes('email') && /@/.test(value)) confidence += 15;
  if (field.key.includes('phone') && /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(value)) confidence += 15;
  
  return Math.min(confidence, 95);
}

// Helper function to validate field
function validateField(field, value) {
  const validation = { isValid: true, error: null };
  
  if (value === null || value === undefined) {
    if (field.required) {
      validation.isValid = false;
      validation.error = 'Required field is missing';
    }
    return validation;
  }
  
  // Type validation
  switch (field.type) {
    case 'number':
    case 'currency':
      if (isNaN(value)) {
        validation.isValid = false;
        validation.error = 'Value is not a valid number';
      }
      break;
    case 'date':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) && isNaN(Date.parse(value))) {
        validation.isValid = false;
        validation.error = 'Invalid date format';
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean' && !['true', 'false', '1', '0'].includes(String(value).toLowerCase())) {
        validation.isValid = false;
        validation.error = 'Value is not a valid boolean';
      }
      break;
  }
  
  // Field-specific validation
  if (field.validation) {
    const val = field.validation;
    const valueStr = String(value);
    
    if (val.pattern && !new RegExp(val.pattern).test(valueStr)) {
      validation.isValid = false;
      validation.error = 'Value does not match required pattern';
    }
    
    if (val.minLength && valueStr.length < val.minLength) {
      validation.isValid = false;
      validation.error = `Value must be at least ${val.minLength} characters`;
    }
    
    if (val.maxLength && valueStr.length > val.maxLength) {
      validation.isValid = false;
      validation.error = `Value must be no more than ${val.maxLength} characters`;
    }
  }
  
  return validation;
}

// Helper function to calculate API cost
function calculateCost(tokens) {
  const costPer1000Tokens = 0.03; // GPT-4 pricing
  return (tokens / 1000) * costPer1000Tokens;
}

export = extractData;
