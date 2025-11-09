const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const processOCR = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'No file uploaded',
      });
    }

    const file = req.files.file;
    const { language = 'en', mode = 'automatic' } = req.body;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Unsupported file type. Please upload an image file (JPEG, PNG, WebP, or GIF).',
      });
    }

    // Validate file size (max 20MB for OpenAI Vision)
    if (file.size > 20 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'File size too large. Maximum size is 20MB.',
      });
    }

    const startTime = Date.now();

    // Convert file to base64 for OpenAI Vision API
    const base64Image = file.data.toString('base64');
    const imageUrl = `data:${file.mimetype};base64,${base64Image}`;

    // Build system prompt based on language and mode
    const systemPrompt = buildOCRSystemPrompt(language, mode);

    // Call OpenAI Vision API for OCR
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all text from this image. Maintain the original structure and formatting as much as possible."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: mode === 'enhanced' ? 'high' : 'auto'
              }
            }
          ]
        }
      ],
      max_tokens: mode === 'enhanced' ? 4000 : 2000,
      temperature: 0.1,
    });

    const extractedText = response.choices[0]?.message?.content || '';
    const processingTime = Date.now() - startTime;

    // Calculate confidence based on response quality
    const confidence = calculateOCRConfidence(extractedText, response);

    // Detect document type
    const documentType = detectDocumentType(extractedText);

    // Extract metadata
    const metadata = await extractImageMetadata(file);

    // Save processed file (optional)
    const savedFilePath = await saveProcessedFile(file, req.admin._id);

    const result = {
      id: Date.now(),
      filename: file.name,
      originalSize: file.size,
      mimetype: file.mimetype,
      extractedText,
      confidence: Math.round(confidence),
      language,
      mode,
      documentType,
      metadata: {
        ...metadata,
        processingTime,
        tokensUsed: response.usage?.total_tokens || 0,
        cost: calculateCost(response.usage?.total_tokens || 0),
        model: 'gpt-4-vision-preview',
        pageCount: 1, // Single image
        wordCount: extractedText.split(/\s+/).length,
        characterCount: extractedText.length,
      },
      processedAt: new Date().toISOString(),
      processedBy: req.admin._id,
      filePath: savedFilePath,
    };

    return res.status(200).json({
      success: true,
      result,
      message: 'OCR processing completed successfully',
    });

  } catch (error) {
    console.error('OCR Processing Error:', error);
    
    return res.status(500).json({
      success: false,
      result: null,
      message: 'OCR processing failed',
      error: error.message,
    });
  }
};

// Build system prompt based on language and processing mode
function buildOCRSystemPrompt(language, mode) {
  const languageInstructions = {
    'en': 'Extract text in English',
    'es': 'Extract text in Spanish (Español)',
    'fr': 'Extract text in French (Français)',
    'de': 'Extract text in German (Deutsch)',
    'ar': 'Extract text in Arabic (العربية)',
    'ja': 'Extract text in Japanese (日本語)',
    'zh': 'Extract text in Chinese (中文)',
  };

  const modeInstructions = {
    'automatic': 'Focus on speed and general accuracy',
    'enhanced': 'Focus on maximum accuracy, preserve all formatting, structure, and special characters',
    'fast': 'Focus on speed, extract main text content quickly',
  };

  return `You are an expert OCR (Optical Character Recognition) AI. Your task is to extract text from images with high accuracy.

Instructions:
1. ${languageInstructions[language] || 'Extract text in the detected language'}
2. ${modeInstructions[mode] || 'Focus on general accuracy'}
3. Preserve original formatting, line breaks, and structure when possible
4. Extract ALL visible text including headers, footers, captions, and watermarks
5. Maintain tables, lists, and hierarchical structures
6. For handwritten text, do your best to interpret unclear characters
7. If text is unclear or ambiguous, include [UNCLEAR] notation
8. For non-text elements like images or diagrams, include [IMAGE] or [DIAGRAM] notation
9. Preserve numerical data exactly as shown
10. Maintain proper spacing and indentation

Quality guidelines:
- Be thorough and systematic
- Double-check numbers, dates, and proper nouns
- Preserve document structure and hierarchy
- Indicate any uncertainty with appropriate notation`;
}

// Calculate OCR confidence based on various factors
function calculateOCRConfidence(extractedText, response) {
  let confidence = 70; // Base confidence

  // Text length factor
  if (extractedText.length > 100) confidence += 10;
  if (extractedText.length > 500) confidence += 5;

  // Token usage factor (more tokens usually means more detailed extraction)
  const tokensUsed = response.usage?.total_tokens || 0;
  if (tokensUsed > 1000) confidence += 5;
  if (tokensUsed > 2000) confidence += 5;

  // Structure indicators
  if (extractedText.includes('\n')) confidence += 3; // Has line breaks
  if (/\d/.test(extractedText)) confidence += 2; // Contains numbers
  if (/[A-Z]/.test(extractedText)) confidence += 2; // Contains uppercase
  if (/[@#$%&*]/.test(extractedText)) confidence += 2; // Contains special chars

  // Quality indicators
  if (!extractedText.includes('[UNCLEAR]')) confidence += 10;
  if (extractedText.split(' ').length > 20) confidence += 5; // Reasonable word count

  // Cap at 95% (never 100% confidence for AI processing)
  return Math.min(confidence, 95);
}

// Detect document type based on extracted text
function detectDocumentType(text) {
  const textLower = text.toLowerCase();
  
  // Invoice indicators
  if (textLower.includes('invoice') || textLower.includes('bill') || 
      textLower.includes('total amount') || textLower.includes('tax')) {
    return 'invoice';
  }
  
  // Receipt indicators
  if (textLower.includes('receipt') || textLower.includes('transaction') ||
      textLower.includes('thank you for your purchase')) {
    return 'receipt';
  }
  
  // Contract indicators
  if (textLower.includes('contract') || textLower.includes('agreement') ||
      textLower.includes('terms and conditions')) {
    return 'contract';
  }
  
  // Business card indicators
  if (textLower.includes('email') && textLower.includes('phone') &&
      text.split('\n').length < 10) {
    return 'business_card';
  }
  
  // Form indicators
  if (textLower.includes('form') || textLower.includes('application') ||
      textLower.includes('signature')) {
    return 'form';
  }
  
  // Identity document indicators
  if (textLower.includes('passport') || textLower.includes('driver') ||
      textLower.includes('id card') || textLower.includes('license')) {
    return 'identity_document';
  }
  
  return 'document'; // Generic document type
}

// Extract image metadata
async function extractImageMetadata(file) {
  try {
    return {
      size: file.size,
      mimetype: file.mimetype,
      encoding: file.encoding || 'unknown',
      truncated: file.truncated || false,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return {
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}

// Save processed file to uploads directory
async function saveProcessedFile(file, ownerId) {
  try {
    const uploadsDir = path.join(process.cwd(), 'src', 'uploads', 'ocr', ownerId.toString());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const filePath = path.join(uploadsDir, filename);
    
    // Save file
    await file.mv(filePath);
    
    return {
      filename,
      path: filePath,
      relativePath: `/uploads/ocr/${ownerId}/${filename}`,
    };
  } catch (error) {
    console.error('Error saving file:', error);
    return null;
  }
}

// Calculate API cost
function calculateCost(tokens) {
  // GPT-4 Vision pricing (approximate)
  const costPer1000Tokens = 0.03;
  return (tokens / 1000) * costPer1000Tokens;
}

module.exports = processOCR;
