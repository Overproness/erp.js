const mongoose = require('mongoose');
const Task = mongoose.model('Task');
const OpenAIHelper = require('@/helpers/openaiHelper');

/**
 * Get AI-powered priority suggestions for tasks
 * @route POST /api/task/ai/prioritize
 */
const aiPrioritize = async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tasks array is required',
      });
    }

    // Get current user ID from request
    const userId = req.admin?._id || req.user?._id;

    // Prepare task data for AI analysis
    const taskAnalysisData = tasks.map(task => ({
      taskId: task._id,
      taskName: task.taskName || task.name || 'Untitled Task',
      currentPriority: task.priority || 'medium',
      status: task.status || 'pending',
      dueDate: task.dueDate,
      startDate: task.startDate,
      progress: task.progress || 0,
      description: task.description || '',
      tags: task.tags || [],
      assignedTo: task.assignedTo ? task.assignedTo.name || 'Unassigned' : 'Unassigned',
      collaborators: task.collaborators?.length || 0,
      comments: task.comments?.length || 0,
      createdAt: task.createdAt,
    }));

    // Try to get AI-powered suggestions
    let suggestions;
    let aiPowered = false;
    
    try {
      // Create OpenAI helper
      const openaiHelper = await OpenAIHelper.createForUser(userId);
      
      if (openaiHelper.hasApiKey()) {
        // Create AI prompt for task prioritization
        const prompt = `
You are an expert task management AI assistant. Analyze the following tasks and suggest optimal priority levels (high, medium, or low) based on multiple factors.

Consider these factors when prioritizing:
1. **Due Date Urgency**: Tasks with closer deadlines should generally have higher priority
2. **Current Status**: Tasks that are in progress or overdue need attention
3. **Progress**: Tasks with low progress that are due soon need higher priority
4. **Complexity**: Based on description length and number of collaborators
5. **Dependencies**: Tasks that others may depend on
6. **Business Impact**: Tags and description can indicate importance

Current date: ${new Date().toISOString()}

Tasks to analyze:
${JSON.stringify(taskAnalysisData, null, 2)}

Respond with a JSON array containing objects with the following structure:
[
  {
    "taskId": "task_id_here",
    "taskName": "task name",
    "currentPriority": "current priority level",
    "suggestedPriority": "suggested priority level (high/medium/low)",
    "reasoning": "Brief explanation (max 100 chars) of why this priority is suggested"
  }
]

Important: 
- Only suggest priority changes when necessary
- Provide clear, concise reasoning
- Consider the entire context, not just one factor
- Return valid JSON only, no additional text
`;

        // Call OpenAI API
        const aiResponse = await openaiHelper.chatCompletion({
          messages: [{ role: 'user', content: prompt }],
          model: 'gpt-4',
          parameters: {
            temperature: 0.3,
            max_tokens: 2000,
          },
        });

        if (aiResponse.success) {
          const responseContent = aiResponse.data.choices[0].message.content;
          
          // Parse JSON response
          const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            suggestions = JSON.parse(jsonMatch[0]);
            aiPowered = true;
          }
        }
      }
    } catch (aiError) {
      console.error('AI service error:', aiError);
      // Fall through to rule-based system
    }

    // Fallback to rule-based prioritization if AI failed or unavailable
    if (!suggestions) {
      suggestions = generateRuleBasedPriorities(taskAnalysisData);
      aiPowered = false;
    }

    // Return suggestions
    return res.status(200).json({
      success: true,
      result: {
        suggestions,
        aiPowered,
        timestamp: new Date().toISOString(),
        message: aiPowered 
          ? 'AI-powered suggestions generated' 
          : 'Using rule-based prioritization (AI unavailable)',
      },
    });

  } catch (error) {
    console.error('Error in AI prioritize:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI priority suggestions',
      error: error.message,
    });
  }
};

/**
 * Fallback rule-based priority suggestions
 * Used when AI service is unavailable
 */
function generateRuleBasedPriorities(tasks) {
  const now = new Date();
  
  return tasks.map(task => {
    let suggestedPriority = task.currentPriority;
    let reasoning = 'Current priority maintained';
    
    // Calculate days until due date
    let daysUntilDue = null;
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    }
    
    // Rule 1: Overdue tasks get high priority
    if (daysUntilDue !== null && daysUntilDue < 0) {
      suggestedPriority = 'high';
      reasoning = 'Task is overdue';
    }
    // Rule 2: Due within 3 days with low progress
    else if (daysUntilDue !== null && daysUntilDue <= 3 && task.progress < 50) {
      suggestedPriority = 'high';
      reasoning = 'Due soon with low progress';
    }
    // Rule 3: Due within a week
    else if (daysUntilDue !== null && daysUntilDue <= 7) {
      suggestedPriority = task.currentPriority === 'low' ? 'medium' : task.currentPriority;
      reasoning = 'Due within a week';
    }
    // Rule 4: In progress tasks with low priority
    else if (task.status === 'in-progress' && task.currentPriority === 'low') {
      suggestedPriority = 'medium';
      reasoning = 'Active task needs attention';
    }
    // Rule 5: High priority tasks that are mostly complete
    else if (task.currentPriority === 'high' && task.progress > 80 && task.status !== 'overdue') {
      suggestedPriority = 'medium';
      reasoning = 'Nearly complete, can reduce priority';
    }
    // Rule 6: Tasks due far in the future with high priority
    else if (daysUntilDue !== null && daysUntilDue > 30 && task.currentPriority === 'high') {
      suggestedPriority = 'medium';
      reasoning = 'Due date is far, priority can be lowered';
    }
    
    return {
      taskId: task.taskId,
      taskName: task.taskName,
      currentPriority: task.currentPriority,
      suggestedPriority,
      reasoning,
    };
  });
}

module.exports = aiPrioritize;
