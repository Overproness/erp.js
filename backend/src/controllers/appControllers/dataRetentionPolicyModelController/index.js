const mongoose = require('mongoose');
const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');

// Base CRUD operations
const methods = createCRUDController('DataRetentionPolicy');

// Add any custom methods here if needed

module.exports = methods;
