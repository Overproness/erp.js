const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const AiExtractionTemplate = require('../../../models/appModels/AiExtractionTemplate');
const { catchErrors } = require('../../../handlers/errorHandlers');

const methods = createCRUDController('AiExtractionTemplate');

// Override create to add default templates for new users
const create = catchErrors(async (req, res) => {
  const { name, description, category, fields, extractionRules } = req.body;

  const templateData = {
    name,
    description,
    category,
    fields,
    extractionRules,
    owner: req.companyOwner._id,
  };

  const template = new AiExtractionTemplate(templateData);
  const savedTemplate = await template.save();

  res.status(201).json({
    success: true,
    result: savedTemplate,
    message: 'Extraction template created successfully',
  });
});

// Get templates by category
const getByCategory = catchErrors(async (req, res) => {
  const { category } = req.params;

  const templates = await AiExtractionTemplate.find({
    owner: req.companyOwner._id,
    category,
    removed: false,
    enabled: true,
  }).sort({ usage_count: -1, created: -1 });

  res.status(200).json({
    success: true,
    result: templates,
    message: 'Templates retrieved successfully',
  });
});

// Increment usage count
const incrementUsage = catchErrors(async (req, res) => {
  const { id } = req.params;

  const template = await AiExtractionTemplate.findOneAndUpdate(
    { _id: id, owner: req.companyOwner._id },
    { $inc: { usage_count: 1 } },
    { new: true }
  );

  if (!template) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Template not found',
    });
  }

  res.status(200).json({
    success: true,
    result: template,
    message: 'Usage count updated',
  });
});

// Create default templates for a new user
const createDefaultTemplates = catchErrors(async (ownerId) => {
  const defaultTemplates = [
    {
      name: 'Invoice Template',
      description: 'Standard invoice data extraction',
      category: 'invoice',
      fields: [
        { key: 'invoice_number', label: 'Invoice Number', type: 'text', required: true },
        { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'vendor', label: 'Vendor', type: 'text', required: true },
        { key: 'total_amount', label: 'Total Amount', type: 'currency', required: true },
        { key: 'tax_amount', label: 'Tax Amount', type: 'currency' },
        { key: 'due_date', label: 'Due Date', type: 'date' },
      ],
      isDefault: true,
      owner: ownerId,
    },
    {
      name: 'Receipt Template',
      description: 'Standard receipt data extraction',
      category: 'receipt',
      fields: [
        { key: 'store_name', label: 'Store Name', type: 'text', required: true },
        { key: 'transaction_id', label: 'Transaction ID', type: 'text' },
        { key: 'date_time', label: 'Date & Time', type: 'datetime', required: true },
        { key: 'items', label: 'Items', type: 'array' },
        { key: 'subtotal', label: 'Subtotal', type: 'currency' },
        { key: 'total', label: 'Total', type: 'currency', required: true },
      ],
      isDefault: true,
      owner: ownerId,
    },
  ];

  await AiExtractionTemplate.insertMany(defaultTemplates);
});

module.exports = {
  ...methods,
  create,
  getByCategory,
  incrementUsage,
  createDefaultTemplates,
};
