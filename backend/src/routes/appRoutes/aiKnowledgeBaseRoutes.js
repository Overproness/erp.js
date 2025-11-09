const express = require('express');
const router = express.Router();

const { checkAuth } = require('../../middlewares/auth');
const aiKnowledgeBaseController = require('../../controllers/appControllers/aiKnowledgeBaseController');

router.use(checkAuth);

router.route('/').get(aiKnowledgeBaseController.list).post(aiKnowledgeBaseController.create);

router.route('/search').get(aiKnowledgeBaseController.search);

router
  .route('/:id')
  .get(aiKnowledgeBaseController.read)
  .patch(aiKnowledgeBaseController.update)
  .delete(aiKnowledgeBaseController.delete);

router.route('/:id/feedback').post(aiKnowledgeBaseController.addFeedback);

module.exports = router;
