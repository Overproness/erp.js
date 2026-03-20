// @ts-nocheck
const mongoose = require('mongoose');
const Task = mongoose.model('Task');

/**
 * Batch update task priorities
 * @route PATCH /api/task/batch/priorities
 */
const batchUpdatePriorities = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required',
      });
    }

    // Validate update objects
    for (const update of updates) {
      if (!update.taskId || !update.priority) {
        return res.status(400).json({
          success: false,
          message: 'Each update must have taskId and priority',
        });
      }

      // Validate priority value
      if (!['low', 'medium', 'high'].includes(update.priority)) {
        return res.status(400).json({
          success: false,
          message: `Invalid priority value: ${update.priority}. Must be low, medium, or high`,
        });
      }
    }

    // Perform batch update
    const updatePromises = updates.map(async (update) => {
      try {
        const result = await Task.findByIdAndUpdate(
          update.taskId,
          {
            priority: update.priority,
            updatedAt: Date.now(),
          },
          { new: true, runValidators: true }
        );

        return {
          taskId: update.taskId,
          success: !!result,
          priority: update.priority,
        };
      } catch (error) {
        console.error(`Error updating task ${update.taskId}:`, error);
        return {
          taskId: update.taskId,
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.all(updatePromises);

    // Count successful updates
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return res.status(200).json({
      success: true,
      result: {
        totalUpdates: results.length,
        successCount,
        failCount,
        details: results,
      },
      message: `Successfully updated ${successCount} task priorities`,
    });
  } catch (error) {
    console.error('Error in batch update priorities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to batch update priorities',
      error: error.message,
    });
  }
};

module.exports = batchUpdatePriorities;
