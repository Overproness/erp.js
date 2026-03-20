// @ts-nocheck
const mongoose = require('mongoose');
const Task = mongoose.model('Task');

const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const author = req.admin._id;    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Task not found' 
      });
    }

    task.comments.push({ content, author });

    // Add commenter as watcher if not already watching
    if (!task.watchers.includes(author)) {
      task.watchers.push(author);
    }

    task.activityLog.push({
      action: 'comment_added',
      performedBy: author,
      details: { commentId: task.comments[task.comments.length - 1]._id }
    });

    await task.save();
    
    const populatedTask = await Task.findById(taskId)
      .populate('comments.author', 'name email')
      .populate('watchers', 'name email')
      .populate('activityLog.performedBy', 'name');

    res.status(200).json({
      success: true,
      result: populatedTask,
      message: 'Comment added successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    const { content } = req.body;
    const author = req.admin._id;    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Task not found' 
      });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found' 
      });
    }

    if (comment.author.toString() !== author.toString() && req.admin.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this comment' 
      });
    }

    comment.content = content;
    comment.updated = new Date();

    task.activityLog.push({
      action: 'comment_updated',
      performedBy: author,
      details: { commentId }
    });

    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate('comments.author', 'name email')
      .populate('watchers', 'name email')
      .populate('activityLog.performedBy', 'name');

    res.status(200).json({
      success: true,
      result: populatedTask,
      message: 'Comment updated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    const author = req.admin._id;    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ 
        success: false,
        message: 'Task not found' 
      });
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ 
        success: false,
        message: 'Comment not found' 
      });
    }

    if (comment.author.toString() !== author.toString() && req.admin.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this comment' 
      });
    }

    comment.remove();
    task.activityLog.push({
      action: 'comment_deleted',
      performedBy: author,
      details: { commentId }
    });

    await task.save();

    const populatedTask = await Task.findById(taskId)
      .populate('comments.author', 'name email')
      .populate('watchers', 'name email')
      .populate('activityLog.performedBy', 'name');

    res.status(200).json({
      success: true,
      result: populatedTask,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addComment,
  updateComment,
  deleteComment,
};
