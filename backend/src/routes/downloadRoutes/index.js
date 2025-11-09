const express = require('express');
const router = express.Router();

const { catchErrors } = require('@/handlers/errorHandlers');
const documentController = require('@/controllers/appControllers/documentController');

router.get('/document/download/:id', catchErrors(documentController.download));

module.exports = router;
