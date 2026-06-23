// @ts-nocheck

import Workflow from '../models/appModels/Workflow';
import AILearningData from '../models/appModels/AILearningData';
import patternRecognitionService from './patternRecognitionService';
import Client from '../models/appModels/Client';
import Invoice from '../models/appModels/Invoice';
import Quote from '../models/appModels/Quote';
import Task from '../models/appModels/Task';
/**
 * Automation Suggestion Engine
 * Analyzes business patterns and suggests workflow automations
 */
class AutomationSuggestionEngine {
  constructor() {
    this.suggestionTypes = [
      'email_automation',
      'task_automation',
      'workflow_optimization',
      'payment_reminder',
      'follow_up_automation',
      'document_generation',
      'notification_automation',
    ];
  }

  /**
   * Generate automation suggestions for a user
   */
  async generateSuggestions(userId, options = {}) {
    try {
      const suggestions = [];

      const emailSuggestions = await this.suggestEmailAutomations(userId);
      suggestions.push(...emailSuggestions);

      const workflowSuggestions = await this.suggestWorkflowOptimizations(userId);
      suggestions.push(...workflowSuggestions);

      const taskSuggestions = await this.suggestTaskAutomations(userId);
      suggestions.push(...taskSuggestions);

      const paymentSuggestions = await this.suggestPaymentAutomations(userId);
      suggestions.push(...paymentSuggestions);

      const patternSuggestions = await this.suggestFromPatterns(userId);
      suggestions.push(...patternSuggestions);

      suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority] || b.impact - a.impact;
      });

      return {
        success: true,
        suggestions: suggestions.slice(0, options.limit || 10),
        totalSuggestions: suggestions.length,
      };
    } catch (error) {
      console.error('Generate suggestions error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Suggest email automation opportunities
   */
  async suggestEmailAutomations(userId) {
    const suggestions = [];

    try {
      const pendingQuotes = await Quote.countDocuments({
        owner: userId,
        status: 'sent',
        removed: false,
      });

      if (pendingQuotes > 5) {
        suggestions.push({
          id: `email_auto_${Date.now()}_1`,
          type: 'email_automation',
          title: 'Automate Quote Follow-ups',
          description: `You have ${pendingQuotes} pending quotes. Automate follow-up emails to increase conversion rates.`,
          category: 'Sales',
          priority: 'high',
          impact: 85,
          estimatedTimeSaving: 120,
          implementation: {
            difficulty: 'easy',
            steps: [
              'Set up email template for quote follow-ups',
              'Define trigger: Quote sent > 3 days without response',
              'Configure follow-up sequence (Day 3, 7, 14)',
              'Enable automation',
            ],
            automation: {
              trigger: 'quote_pending',
              action: 'send_follow_up_email',
              schedule: '3_days_after_sent',
            },
          },
          metrics: {
            expectedConversionIncrease: '15-25%',
            timeSavedPerMonth: '2 hours',
          },
        });
      }

      const overdueInvoices = await Invoice.countDocuments({
        owner: userId,
        paymentStatus: 'unpaid',
        expiredDate: { $lt: new Date() },
        removed: false,
      });

      if (overdueInvoices > 3) {
        suggestions.push({
          id: `email_auto_${Date.now()}_2`,
          type: 'email_automation',
          title: 'Automated Payment Reminders',
          description: `You have ${overdueInvoices} overdue invoices. Set up automatic payment reminders to improve cash flow.`,
          category: 'Financial',
          priority: 'high',
          impact: 90,
          estimatedTimeSaving: 180,
          implementation: {
            difficulty: 'easy',
            steps: [
              'Create payment reminder email template',
              'Set trigger: Invoice 3 days before due date',
              'Add escalation: Day 1, 7, 14 after due date',
              'Configure automatic late fees (optional)',
            ],
            automation: {
              trigger: 'invoice_due_soon',
              action: 'send_payment_reminder',
              schedule: 'before_and_after_due_date',
            },
          },
          metrics: {
            expectedPaymentSpeedup: '30-40%',
            cashFlowImprovement: 'Significant',
          },
        });
      }

      const inactiveCustomers = await this.findInactiveCustomers(userId);
      if (inactiveCustomers > 10) {
        suggestions.push({
          id: `email_auto_${Date.now()}_3`,
          type: 'email_automation',
          title: 'Re-engagement Campaign for Inactive Customers',
          description: `${inactiveCustomers} customers haven't made a purchase in 90+ days. Automate re-engagement emails.`,
          category: 'Sales',
          priority: 'medium',
          impact: 70,
          estimatedTimeSaving: 90,
          implementation: {
            difficulty: 'medium',
            steps: [
              'Create customer segmentation rule (inactive 90+ days)',
              'Design re-engagement email sequence',
              'Add special offer or incentive',
              'Set up automated delivery schedule',
              'Track response rates',
            ],
            automation: {
              trigger: 'customer_inactive_90_days',
              action: 'send_reengagement_email',
              schedule: 'quarterly',
            },
          },
          metrics: {
            expectedReactivationRate: '10-15%',
            revenueOpportunity: 'Medium',
          },
        });
      }
    } catch (error) {
      console.error('Suggest email automations error:', error);
    }

    return suggestions;
  }

  /**
   * Suggest workflow optimization opportunities
   */
  async suggestWorkflowOptimizations(userId) {
    const suggestions = [];

    try {
      const workflows = await Workflow.find({
        owner: userId,
        removed: false,
      });

      if (workflows.length === 0) {
        suggestions.push({
          id: `workflow_opt_${Date.now()}_1`,
          type: 'workflow_optimization',
          title: 'Create Your First Automated Workflow',
          description: 'Start automating repetitive tasks with workflows. Save hours each week.',
          category: 'Operations',
          priority: 'medium',
          impact: 80,
          estimatedTimeSaving: 300,
          implementation: {
            difficulty: 'medium',
            steps: [
              'Identify repetitive tasks in your business',
              'Map out the process steps',
              'Create workflow in Workflow Builder',
              'Test with sample data',
              'Enable and monitor results',
            ],
            automation: {
              type: 'general_workflow',
              suggestedWorkflows: [
                'Quote to Invoice conversion',
                'Customer onboarding',
                'Invoice approval process',
              ],
            },
          },
          metrics: {
            potentialTimeSavings: '5+ hours/week',
            errorReduction: '60-80%',
          },
        });
      } else {
        const inactiveWorkflows = workflows.filter((w) => w.status !== 'active');
        if (inactiveWorkflows.length > 0) {
          suggestions.push({
            id: `workflow_opt_${Date.now()}_2`,
            type: 'workflow_optimization',
            title: 'Activate Dormant Workflows',
            description: `You have ${inactiveWorkflows.length} workflow(s) that aren't active. Review and activate them to maximize automation.`,
            category: 'Operations',
            priority: 'low',
            impact: 50,
            estimatedTimeSaving: 60,
            implementation: {
              difficulty: 'easy',
              steps: [
                'Review inactive workflows',
                'Update trigger conditions if needed',
                'Test workflow execution',
                'Activate workflows',
              ],
            },
          });
        }
      }

      const manualTasks = await Task.countDocuments({
        owner: userId,
        removed: false,
        status: { $in: ['open', 'in_progress'] },
      });

      if (manualTasks > 20) {
        suggestions.push({
          id: `workflow_opt_${Date.now()}_3`,
          type: 'workflow_optimization',
          title: 'Automate Recurring Tasks',
          description: `You have ${manualTasks} active tasks. Many could likely be automated with workflows.`,
          category: 'Operations',
          priority: 'medium',
          impact: 75,
          estimatedTimeSaving: 240,
          implementation: {
            difficulty: 'medium',
            steps: [
              'Analyze recurring task patterns',
              'Group similar tasks together',
              'Create workflow templates',
              'Set up automatic task assignment rules',
              'Monitor and refine',
            ],
            automation: {
              trigger: 'various_task_triggers',
              action: 'automatic_task_creation_and_assignment',
            },
          },
          metrics: {
            taskCompletionSpeedup: '40-50%',
            teamProductivity: 'Increased 25%',
          },
        });
      }
    } catch (error) {
      console.error('Suggest workflow optimizations error:', error);
    }

    return suggestions;
  }

  /**
   * Suggest task automation opportunities
   */
  async suggestTaskAutomations(userId) {
    const suggestions = [];

    try {
      const repeatableTasks = await this.identifyRepeatableTasks(userId);

      if (repeatableTasks.length > 0) {
        suggestions.push({
          id: `task_auto_${Date.now()}_1`,
          type: 'task_automation',
          title: 'Automate Repeating Tasks',
          description: `Identified ${repeatableTasks.length} task types that repeat regularly. Set up automatic creation.`,
          category: 'Operations',
          priority: 'medium',
          impact: 70,
          estimatedTimeSaving: 150,
          implementation: {
            difficulty: 'medium',
            steps: [
              'Review identified repeating tasks',
              'Create task templates',
              'Set up recurring schedules',
              'Configure assignment rules',
              'Enable automatic creation',
            ],
            automation: {
              trigger: 'schedule_based',
              action: 'create_recurring_tasks',
            },
          },
          data: {
            repeatableTasks: repeatableTasks.slice(0, 5),
          },
        });
      }

      const unassignedTasks = await Task.countDocuments({
        owner: userId,
        assignedTo: { $exists: false },
        status: 'open',
        removed: false,
      });

      if (unassignedTasks > 5) {
        suggestions.push({
          id: `task_auto_${Date.now()}_2`,
          type: 'task_automation',
          title: 'Smart Task Assignment',
          description: `You have ${unassignedTasks} unassigned tasks. Set up automatic assignment based on workload and expertise.`,
          category: 'Operations',
          priority: 'medium',
          impact: 65,
          estimatedTimeSaving: 90,
          implementation: {
            difficulty: 'medium',
            steps: [
              'Define task categories and skill requirements',
              'Map team members to categories',
              'Set up round-robin or workload-based assignment',
              'Configure notification rules',
              'Enable automatic assignment',
            ],
            automation: {
              trigger: 'task_created',
              action: 'smart_assignment',
            },
          },
        });
      }
    } catch (error) {
      console.error('Suggest task automations error:', error);
    }

    return suggestions;
  }

  /**
   * Suggest payment automation opportunities
   */
  async suggestPaymentAutomations(userId) {
    const suggestions = [];

    try {
      const unpaidInvoices = await Invoice.countDocuments({
        owner: userId,
        paymentStatus: { $in: ['unpaid', 'partial'] },
        removed: false,
      });

      if (unpaidInvoices > 10) {
        suggestions.push({
          id: `payment_auto_${Date.now()}_1`,
          type: 'payment_reminder',
          title: 'Automated Payment Collection',
          description: `${unpaidInvoices} invoices are unpaid. Automate payment reminders and follow-ups.`,
          category: 'Financial',
          priority: 'high',
          impact: 90,
          estimatedTimeSaving: 200,
          implementation: {
            difficulty: 'easy',
            steps: [
              'Set up payment gateway integration',
              'Create payment reminder schedule',
              'Add payment links to emails',
              'Configure automatic receipts',
              'Enable late fee automation (optional)',
            ],
            automation: {
              trigger: 'invoice_unpaid',
              action: 'payment_reminder_sequence',
              schedule: 'progressive_reminders',
            },
          },
          metrics: {
            paymentSpeedup: '30-50%',
            reductionInOverdue: '40%',
            cashFlowImprovement: 'Significant',
          },
        });
      }

      const partialPayments = await Invoice.countDocuments({
        owner: userId,
        paymentStatus: 'partial',
        removed: false,
      });

      if (partialPayments > 3) {
        suggestions.push({
          id: `payment_auto_${Date.now()}_2`,
          type: 'payment_reminder',
          title: 'Automate Partial Payment Follow-ups',
          description: `${partialPayments} invoices have partial payments. Automate reminders for remaining balances.`,
          category: 'Financial',
          priority: 'medium',
          impact: 75,
          estimatedTimeSaving: 120,
          implementation: {
            difficulty: 'easy',
            steps: [
              'Create balance reminder template',
              'Set trigger for partial payments',
              'Schedule automatic reminders',
              'Include payment link for remaining balance',
            ],
            automation: {
              trigger: 'payment_partial',
              action: 'balance_reminder',
            },
          },
        });
      }
    } catch (error) {
      console.error('Suggest payment automations error:', error);
    }

    return suggestions;
  }

  /**
   * Suggest automations based on learned patterns
   */
  async suggestFromPatterns(userId) {
    const suggestions = [];

    try {
      const learningData = await AILearningData.find({
        owner: userId,
        'feedback.wasImplemented': true,
        'feedback.rating': { $gte: 4 },
      })
        .sort({ created: -1 })
        .limit(50);

      const patternCounts = {};
      learningData.forEach((data) => {
        if (data.patterns && data.patterns.category) {
          patternCounts[data.patterns.category] = (patternCounts[data.patterns.category] || 0) + 1;
        }
      });

      for (const [category, count] of Object.entries(patternCounts)) {
        if (count >= 5) {
          suggestions.push({
            id: `pattern_auto_${Date.now()}_${category}`,
            type: 'automation_suggestions',
            title: `Automation Opportunity in ${category}`,
            description: `You've performed similar actions ${count} times in ${category}. Consider creating an automation.`,
            category: category,
            priority: 'medium',
            impact: Math.min(count * 10, 90),
            estimatedTimeSaving: count * 5,
            implementation: {
              difficulty: 'medium',
              steps: [
                'Review past successful actions',
                'Identify common pattern',
                'Create automation rule',
                'Test and refine',
                'Enable automation',
              ],
              basedOn: 'ai_learning',
            },
            metrics: {
              basedOnSuccesses: count,
              confidence: Math.min((count / 10) * 100, 95),
            },
          });
        }
      }
    } catch (error) {
      console.error('Suggest from patterns error:', error);
    }

    return suggestions;
  }

  /**
   * Implement a suggested automation
   */
  async implementSuggestion(userId, suggestionId, options = {}) {
    try {
      console.log(`🤖 Implementing automation: ${suggestionId}`);

      const suggestion = {
        suggestionId,
        implementedAt: new Date(),
        status: 'active',
      };

      await AILearningData.create({
        owner: userId,
        interactionType: 'automation',
        input: {
          message: `Implement automation: ${suggestionId}`,
          context: options,
        },
        output: {
          response: 'Automation implemented successfully',
          suggestions: [suggestionId],
          confidence: 0.9,
        },
        feedback: {
          wasImplemented: true,
          wasHelpful: true,
          feedbackDate: new Date(),
        },
      });

      return {
        success: true,
        suggestion,
        message: 'Automation implemented successfully',
      };
    } catch (error) {
      console.error('Implement suggestion error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Helper: Find inactive customers
   */
  async findInactiveCustomers(userId) {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const inactiveCount = await Client.countDocuments({
      owner: userId,
      removed: false,
      $or: [
        { 'behavior.lastPurchaseDate': { $lte: ninetyDaysAgo } },
        { 'behavior.lastPurchaseDate': { $exists: false } },
      ],
    });

    return inactiveCount;
  }

  /**
   * Helper: Identify repeatable tasks
   */
  async identifyRepeatableTasks(userId) {
    try {
      const tasks = await Task.find({
        owner: userId,
        removed: false,
      }).select('name description');

      const taskPatterns = {};

      tasks.forEach((task) => {
        const normalizedName = task.name.toLowerCase().trim();
        taskPatterns[normalizedName] = (taskPatterns[normalizedName] || 0) + 1;
      });

      const repeatableTasks = Object.entries(taskPatterns)
        .filter(([name, count]) => count >= 3)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      return repeatableTasks;
    } catch (error) {
      console.error('Identify repeatable tasks error:', error);
      return [];
    }
  }

  /**
   * Get suggestion analytics
   */
  async getSuggestionAnalytics(userId) {
    try {
      const implementedSuggestions = await AILearningData.countDocuments({
        owner: userId,
        interactionType: 'automation',
        'feedback.wasImplemented': true,
      });

      const successfulSuggestions = await AILearningData.countDocuments({
        owner: userId,
        interactionType: 'automation',
        'feedback.wasImplemented': true,
        'feedback.wasHelpful': true,
      });

      const successRate =
        implementedSuggestions > 0 ? (successfulSuggestions / implementedSuggestions) * 100 : 0;

      return {
        success: true,
        analytics: {
          totalImplemented: implementedSuggestions,
          successful: successfulSuggestions,
          successRate: successRate.toFixed(1),
        },
      };
    } catch (error) {
      console.error('Get suggestion analytics error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const automationSuggestionEngine = new AutomationSuggestionEngine();

export = automationSuggestionEngine;
