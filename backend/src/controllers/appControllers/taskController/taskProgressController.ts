// @ts-nocheck
const mongoose = require('mongoose');
const Task = mongoose.model('Task');

const updateProgress = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { progress, timeSpent } = req.body;
    const updatedBy = req.admin._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update progress
    if (progress !== undefined) {
      task.progress = progress;
      if (progress === 100 && !task.completedDate) {
        task.completedDate = new Date();
        task.status = 'completed';
      } else if (progress < 100 && task.status === 'completed') {
        task.completedDate = null;
        task.status = 'in_progress';
      }
    }

    // Update time spent
    if (timeSpent !== undefined) {
      task.timeSpent = (task.timeSpent || 0) + timeSpent;
    }

    // Set start date on first progress update
    if (!task.startDate && (progress > 0 || timeSpent > 0)) {
      task.startDate = new Date();
    }

    // Log the activity
    task.activityLog.push({
      action: 'progress_updated',
      performedBy: updatedBy,
      details: { progress, timeSpent }
    });    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate('activityLog.performedBy', 'name');

    res.status(200).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateWatchers = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { watchers, action } = req.body;
    const updatedBy = req.admin._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (action === 'add') {
      // Add new watchers, avoiding duplicates
      const newWatchers = watchers.filter(w => !task.watchers.includes(w));
      task.watchers.push(...newWatchers);
    } else if (action === 'remove') {
      // Remove specified watchers
      task.watchers = task.watchers.filter(w => !watchers.includes(w.toString()));
    }

    task.activityLog.push({
      action: `watchers_${action}ed`,
      performedBy: updatedBy,
      details: { watchers }
    });

    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate('watchers', 'name email')
      .populate('activityLog.performedBy', 'name');

    res.status(200).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const commentedBy = req.admin._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.comments.push({
      content,
      commentedBy,
      createdAt: new Date()
    });

    // Add commenter as watcher if not already watching
    if (!task.watchers.includes(commentedBy)) {
      task.watchers.push(commentedBy);
    }

    // Log activity
    task.activityLog.push({
      action: 'comment_added',
      performedBy: commentedBy,
      details: { commentId: task.comments[task.comments.length - 1]._id }
    });

    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate('comments.commentedBy', 'name')
      .populate('watchers', 'name email')
      .populate('activityLog.performedBy', 'name');

    res.status(200).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { filename, path } = req.body;
    const uploadedBy = req.admin._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.attachments.push({
      filename,
      path,
      uploadedBy,
      uploadedAt: new Date()
    });

    // Log activity
    task.activityLog.push({
      action: 'attachment_added',
      performedBy: uploadedBy,
      details: { filename }
    });

    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate('attachments.uploadedBy', 'name')
      .populate('activityLog.performedBy', 'name');

    res.status(200).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRelatedItems = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { relatedItems } = req.body;
    const updatedBy = req.admin._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.relatedTo = relatedItems;

    // Log activity
    task.activityLog.push({
      action: 'related_items_updated',
      performedBy: updatedBy,
      details: { relatedItems }
    });

    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate('activityLog.performedBy', 'name');

    res.status(200).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateProgress,
  updateWatchers,
  addComment,
  addAttachment,
  updateRelatedItems
};
