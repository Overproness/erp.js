// @ts-nocheck
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { requireFeature } = require('../middlewares/planMiddleware');

// Import data entry services
const enhancedOCRService = require('../services/dataEntry/enhancedOCRService');
const enhancedSpreadsheetService = require('../services/dataEntry/enhancedSpreadsheetService');
const urlImportService = require('../services/dataEntry/urlImportService');
const dataValidationService = require('../services/dataEntry/dataValidationService');
const { getAllSchemas, getModuleSchema } = require('../services/dataEntry/moduleSchemas');

// Import models
const models = require('../models');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/dataEntry');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, CSV, and Excel files are allowed.'));
    }
  },
});

/**
 * @route   GET /api/data-entry/modules
 * @desc    Get all available modules with their schemas
 * @access  Private
 */
// Apply AI_SUITE plan guard to all OCR/data-entry routes
router.use(requireFeature('AI_SUITE'));

router.get('/modules', async (req, res) => {
  try {
    const modules = getAllSchemas();
    const moduleDetails = modules.map((moduleName) => {
      const schema = getModuleSchema(moduleName);
      return {
        name: moduleName,
        displayName: schema.name,
        model: schema.model,
        fieldCount: Object.keys(schema.fields).length,
      };
    });

    res.json({
      success: true,
      modules: moduleDetails,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/data-entry/modules/:moduleName/schema
 * @desc    Get schema for a specific module
 * @access  Private
 */
router.get('/modules/:moduleName/schema', async (req, res) => {
  try {
    const { moduleName } = req.params;
    const schema = getModuleSchema(moduleName);

    res.json({
      success: true,
      schema: schema,
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    res.status(404).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/data-entry/ocr/:moduleName
 * @desc    Extract and process data from image/PDF using OCR
 * @access  Private
 */
router.post('/ocr/:moduleName', upload.single('file'), async (req, res) => {
  try {
    const { moduleName } = req.params;
    const file = req.file;

    console.log('OCR Route - Module:', moduleName);
    console.log('OCR Route - req.file:', file);
    console.log('OCR Route - req.files:', req.files);
    console.log('OCR Route - req.body:', req.body);

    if (!file) {
      console.error('No file received by multer');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Process file with OCR
    const userId = req.companyOwner?._id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required',
      });
    }

    const result = await enhancedOCRService.extractForModule(file.path, moduleName, userId);

    // Clean up uploaded file
    await fs.unlink(file.path).catch((err) => console.error('Failed to delete file:', err));

    res.json(result);
  } catch (error) {
    console.error('OCR processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/data-entry/ocr/:moduleName/batch
 * @desc    Batch process multiple images/PDFs
 * @access  Private
 */
router.post('/ocr/:moduleName/batch', upload.array('files', 10), async (req, res) => {
  try {
    const { moduleName } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const filePaths = files.map((f) => f.path);
    const result = await enhancedOCRService.batchExtract(filePaths, moduleName);

    // Clean up uploaded files
    for (const filePath of filePaths) {
      await fs.unlink(filePath).catch((err) => console.error('Failed to delete file:', err));
    }

    res.json(result);
  } catch (error) {
    console.error('Batch OCR processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/data-entry/spreadsheet/:moduleName
 * @desc    Import data from CSV/Excel file
 * @access  Private
 */
router.post('/spreadsheet/:moduleName', upload.single('file'), async (req, res) => {
  try {
    const { moduleName } = req.params;
    const file = req.file;
    const options = req.body.options ? JSON.parse(req.body.options) : {};

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Process spreadsheet
    const result = await enhancedSpreadsheetService.importForModule(file.path, moduleName, options);

    // Clean up uploaded file
    await fs.unlink(file.path).catch((err) => console.error('Failed to delete file:', err));

    res.json(result);
  } catch (error) {
    console.error('Spreadsheet import error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/data-entry/spreadsheet/:moduleName/preview
 * @desc    Get preview of spreadsheet data
 * @access  Private
 */
router.post('/spreadsheet/:moduleName/preview', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const rows = parseInt(req.body.rows) || 5;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const preview = await enhancedSpreadsheetService.getPreview(file.path, rows);

    // Clean up uploaded file
    await fs.unlink(file.path).catch((err) => console.error('Failed to delete file:', err));

    res.json(preview);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/data-entry/url/:moduleName
 * @desc    Import data from URL
 * @access  Private
 */
router.post('/url/:moduleName', async (req, res) => {
  try {
    const { moduleName } = req.params;
    const { url, options } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
      });
    }

    const result = await urlImportService.importFromURL(url, moduleName, options || {});
    res.json(result);
  } catch (error) {
    console.error('URL import error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/data-entry/url/:moduleName/batch
 * @desc    Import data from multiple URLs
 * @access  Private
 */
router.post('/url/:moduleName/batch', async (req, res) => {
  try {
    const { moduleName } = req.params;
    const { urls, options } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'URLs array is required',
      });
    }

    const result = await urlImportService.batchImport(urls, moduleName, options || {});
    res.json(result);
  } catch (error) {
    console.error('Batch URL import error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/data-entry/validate/:moduleName
 * @desc    Validate and enhance bulk data
 * @access  Private
 */
router.post('/validate/:moduleName', async (req, res) => {
  try {
    const { moduleName } = req.params;
    const { data, options } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Data array is required',
      });
    }

    const result = await dataValidationService.validateBulk(data, moduleName, options || {});
    res.json(result);
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/data-entry/complete-fields/:moduleName
 * @desc    Auto-complete missing fields using AI
 * @access  Private
 */
router.post('/complete-fields/:moduleName', async (req, res) => {
  try {
    const { moduleName } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data object is required',
      });
    }

    const result = await dataValidationService.completeFields(data, moduleName);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Field completion error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/data-entry/save/:moduleName
 * @desc    Save validated data to database
 * @access  Private
 */
router.post('/save/:moduleName', async (req, res) => {
  try {
    const { moduleName } = req.params;
    const { data } = req.body;
    const userId = req.user ? req.user._id : req.body.userId;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Data array is required',
      });
    }

    const schema = getModuleSchema(moduleName);
    const Model = models[schema.model];

    if (!Model) {
      return res.status(400).json({
        success: false,
        error: `Model ${schema.model} not found`,
      });
    }

    const results = {
      success: true,
      saved: 0,
      failed: 0,
      items: [],
    };

    for (const item of data) {
      try {
        // Add common fields
        const dataToSave = {
          ...item,
          createdBy: userId,
          created: new Date(),
        };

        const savedItem = await Model.create(dataToSave);
        results.saved++;
        results.items.push({
          success: true,
          id: savedItem._id,
          data: savedItem,
        });
      } catch (error) {
        results.failed++;
        results.items.push({
          success: false,
          error: error.message,
          data: item,
        });
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
