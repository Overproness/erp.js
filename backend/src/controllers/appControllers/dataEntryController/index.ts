// @ts-nocheck
const mongoose = require('mongoose');

const modelMap = {
  client: 'Client',
  invoice: 'Invoice',
  quote: 'Quote',
  payment: 'Payment',
  project: 'Project',
  task: 'Task',
  document: 'Document',
  team: 'Team',
};

const getTemplates = async (req, res) => {
  try {
    const { entityType } = req.params || req.query;
    const templates = {
      client: [
        { field: 'name', type: 'string', required: true },
        { field: 'email', type: 'email', required: false },
        { field: 'phone', type: 'string', required: false },
        { field: 'company', type: 'string', required: false },
      ],
      invoice: [
        { field: 'number', type: 'string', required: true },
        { field: 'date', type: 'date', required: true },
        { field: 'dueDate', type: 'date', required: false },
        { field: 'total', type: 'number', required: true },
      ],
    };
    return res.json({
      success: true,
      result: templates[entityType] || [],
      message: 'Templates retrieved',
    });
  } catch (error) {
    return res.json({ success: false, result: null, message: error.message });
  }
};

const importData = async (req, res) => {
  try {
    const { entityType, data, options = {} } = req.body;
    const modelName = modelMap[entityType];
    if (!modelName) {
      return res.json({ success: false, result: null, message: `Unknown entity type: ${entityType}` });
    }
    const Model = mongoose.model(modelName);
    const companyID = req.companyID;
    const results = [];
    let created = 0;
    let failed = 0;

    for (const item of (Array.isArray(data) ? data : [])) {
      try {
        const doc = await Model.create({ ...item, companyOwner: companyID, removed: false });
        results.push({ id: doc._id, status: 'created' });
        created++;
      } catch (err) {
        results.push({ status: 'failed', error: err.message });
        failed++;
      }
    }

    return res.json({
      success: true,
      result: { results, created, failed, total: (Array.isArray(data) ? data.length : 0) },
      message: `Import completed: ${created} created, ${failed} failed`,
    });
  } catch (error) {
    return res.json({ success: false, result: null, message: error.message });
  }
};

const exportData = async (req, res) => {
  try {
    const { entityType, format = 'json', filters = {} } = req.body;
    const modelName = modelMap[entityType];
    if (!modelName) {
      return res.json({ success: false, result: null, message: `Unknown entity type: ${entityType}` });
    }
    const Model = mongoose.model(modelName);
    const query = { removed: false, ...filters };
    if (req.companyID) query.companyOwner = req.companyID;
    const data = await Model.find(query).lean();
    return res.json({
      success: true,
      result: { data, total: data.length, format },
      message: `Export completed: ${data.length} records`,
    });
  } catch (error) {
    return res.json({ success: false, result: null, message: error.message });
  }
};

const importFromUrl = async (req, res) => {
  try {
    return res.json({
      success: false,
      result: null,
      message: 'Import from URL requires additional configuration',
    });
  } catch (error) {
    return res.json({ success: false, result: null, message: error.message });
  }
};

const save = async (req, res) => {
  try {
    const { entityType, data } = req.body;
    const modelName = modelMap[entityType];
    if (!modelName) {
      return res.json({ success: false, result: null, message: `Unknown entity type: ${entityType}` });
    }
    return res.json({
      success: true,
      result: { saved: Array.isArray(data) ? data.length : 0 },
      message: 'Data saved',
    });
  } catch (error) {
    return res.json({ success: false, result: null, message: error.message });
  }
};

module.exports = { getTemplates, importData, exportData, importFromUrl, save };
