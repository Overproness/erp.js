const AiExtractionTemplate = require('@/models/appModels/AiExtractionTemplate');

const createTemplate = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      fields,
      documentType,
      validationRules,
      enabled = true
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Template name is required',
      });
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Template fields are required',
      });
    }

    // Validate field structure
    const invalidFields = fields.filter(field => 
      !field.key || !field.label || !field.type
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'All fields must have key, label, and type properties',
      });
    }

    // Check if template with same name exists for this user
    const existingTemplate = await AiExtractionTemplate.findOne({
      name: name.trim(),
      owner: req.admin._id,
      removed: false,
    });

    if (existingTemplate) {
      return res.status(409).json({
        success: false,
        result: null,
        message: 'Template with this name already exists',
      });
    }

    // Create the template
    const templateData = {
      name: name.trim(),
      description: description?.trim() || '',
      category: category || 'general',
      documentType: documentType || 'document',
      fields: fields.map(field => ({
        key: field.key.trim(),
        label: field.label.trim(),
        type: field.type,
        required: field.required || false,
        validation: field.validation || {},
        defaultValue: field.defaultValue || null,
        options: field.options || [],
        description: field.description || '',
      })),
      validationRules: validationRules || {},
      enabled,
      owner: req.admin._id,
      usage_count: 0,
      created: new Date(),
      updated: new Date(),
    };

    const template = new AiExtractionTemplate(templateData);
    await template.save();

    // Populate owner info
    await template.populate('owner', 'name email');

    return res.status(201).json({
      success: true,
      result: template,
      message: 'Extraction template created successfully',
    });

  } catch (error) {
    console.error('Create Template Error:', error);
    
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Failed to create extraction template',
      error: error.message,
    });
  }
};

module.exports = createTemplate;
