const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const { taskController } = require('@/controllers/appControllers');
const {
  addComment,
  updateComment,
  deleteComment,
} = require('@/controllers/appControllers/taskController/taskCommentController');
const {
  updateProgress,
  updateWatchers,
  addAttachment,
  updateRelatedItems,
} = require('@/controllers/appControllers/taskController/taskProgressController');

router.route('/create').post(catchErrors(taskController.create));
router.route('/read/:id').get(catchErrors(taskController.read));
router.route('/update/:id').patch(catchErrors(taskController.update));
router.route('/delete/:id').delete(catchErrors(taskController.delete));
router.route('/search').get(catchErrors(taskController.search));
router.route('/list').get(catchErrors(taskController.list));
router.route('/listAll').get(catchErrors(taskController.listAll));
router.route('/filter').get(catchErrors(taskController.filter));
router.route('/summary').get(catchErrors(taskController.summary));

// AI-powered features
router.route('/ai/prioritize').post(catchErrors(taskController.aiPrioritize));
router.route('/batch/priorities').patch(catchErrors(taskController.batchUpdatePriorities));

// Progress Monitoring
router.route('/:taskId/progress').patch(catchErrors(updateProgress));
router.route('/:taskId/watchers').patch(catchErrors(updateWatchers));

// Team Collaboration
router.route('/:taskId/comments').post(catchErrors(addComment));
router.route('/:taskId/comments/:commentId').patch(catchErrors(updateComment));
router.route('/:taskId/comments/:commentId').delete(catchErrors(deleteComment));

// Module Integration
router.route('/:taskId/attachments').post(catchErrors(addAttachment));
router.route('/:taskId/related-items').patch(catchErrors(updateRelatedItems));

module.exports = router;
