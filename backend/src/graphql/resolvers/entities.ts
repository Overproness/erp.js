// @ts-nocheck
const { wrapController, createReqRes } = require('./crud');
const mongoose = require('mongoose');

function createEntitySpecificResolvers(controllers) {
  const {
    clientController,
    invoiceController,
    quoteController,
    paymentController,
    documentController,
    documentAuditController,
    documentVersionController,
    workflowController,
    customerJourneyController,
    interactionController,
    statisticsController,
    chatController,
    customerChatController,
    surveyController,
    surveyResponseController,
    reviewPortalController,
    aiAssistantController,
    copilotController,
    aiEnhancedController,
    followUpController,
    urlRedirectController,
    segmentController,
    retargetingController,
    triggerRuleController,
    settingController,
    adminController,
    campaignController,
    taskCommentController,
    taskController,
    dataEntryController,
    aiWorkflowController,
  } = controllers;

  return {
    Query: {
      // Statistics — generic entity statistics
      statisticsGet: async (parent, args, context) => {
        try {
          const { entity, period, startDate, endDate } = args;
          const methodMap = {
            dashboard: 'dashboard',
            client: 'getClientStats',
            invoice: 'getInvoiceStats',
            quote: 'getQuoteStats',
            payment: 'getPaymentStats',
            team: 'getTeamStats',
            task: 'getTaskStats',
            document: 'getDocumentStats',
            paymentMode: 'getPaymentModeStats',
            workflow: 'getWorkflowStats',
            taxes: 'getTaxStats',
          };
          const method = methodMap[entity] || `get${entity.charAt(0).toUpperCase() + entity.slice(1)}Stats`;
          if (statisticsController?.[method]) {
            const { req, res, getResponse } = createReqRes(args, context);
            req.query.timeframe = period;
            if (startDate) req.query.startDate = startDate;
            if (endDate) req.query.endDate = endDate;
            await statisticsController[method](req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: `Statistics method not found for entity: ${entity}` };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // Statistics
      ...(statisticsController?.dashboard && {
        statisticsDashboard: wrapController(statisticsController.dashboard),
      }),
      ...(statisticsController?.overview && {
        statisticsOverview: wrapController(statisticsController.overview),
      }),

      // Statistics — extended entity stats
      ...(statisticsController?.getDocumentStats && {
        statisticsDocuments: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.query.timeframe = args.period;
          try {
            await statisticsController.getDocumentStats(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(statisticsController?.getPaymentModeStats && {
        statisticsPaymentModes: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.query.timeframe = args.period;
          try {
            await statisticsController.getPaymentModeStats(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(statisticsController?.getWorkflowStats && {
        statisticsWorkflows: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.query.timeframe = args.period;
          try {
            await statisticsController.getWorkflowStats(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(statisticsController?.getTaxStats && {
        statisticsTaxes: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.query.timeframe = args.period;
          try {
            await statisticsController.getTaxStats(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // AI Enhanced — extended queries
      ...(aiEnhancedController?.getLearningStats && {
        aiEnhancedLearningStats: wrapController(aiEnhancedController.getLearningStats),
      }),
      ...(aiEnhancedController?.getSuggestionAnalytics && {
        aiEnhancedQueueStatistics: wrapController(aiEnhancedController.getSuggestionAnalytics),
      }),
      // AI Enhanced — queue status (no dedicated controller method, returns general status)
      aiEnhancedQueueStatus: async () => {
        try {
          return {
            success: true,
            result: { status: 'active', pendingMessages: 0, processingMessages: 0 },
            message: 'Queue status retrieved',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // Campaign A/B Test results
      ...(campaignController?.getABTestResults && {
        campaignAbTestResults: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await campaignController.getABTestResults(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Analytics Overview (aggregates from existing models)
      analyticsOverview: async (parent, args) => {
        try {
          const { startDate, endDate } = args;
          const dateFilter = {};
          if (startDate) dateFilter.$gte = new Date(startDate);
          if (endDate) dateFilter.$lte = new Date(endDate);
          const hasDateFilter = Object.keys(dateFilter).length > 0;

          const Client = mongoose.model('Client');
          const Invoice = mongoose.model('Invoice');
          const Task = mongoose.model('Task');
          const Document = mongoose.model('Document');

          const [clientCount, newClients, invoiceAgg, taskAgg, docCount] = await Promise.all([
            Client.countDocuments({ removed: false }),
            Client.countDocuments({
              removed: false,
              ...(hasDateFilter ? { created: dateFilter } : {}),
            }),
            Invoice.aggregate([
              { $match: { removed: false } },
              {
                $group: {
                  _id: null,
                  revenue: { $sum: '$total' },
                  count: { $sum: 1 },
                },
              },
            ]),
            Task.aggregate([
              { $match: { removed: false } },
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  completed: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                  },
                },
              },
            ]),
            Document.countDocuments({ removed: false }),
          ]);

          const inv = invoiceAgg[0] || { revenue: 0, count: 0 };
          const tsk = taskAgg[0] || { total: 0, completed: 0 };
          const completionRate = tsk.total > 0 ? Math.round((tsk.completed / tsk.total) * 100) : 0;

          return {
            success: true,
            result: {
              sales: { revenue: inv.revenue, invoiceCount: inv.count },
              crm: { totalCustomers: clientCount, newCustomers: newClients },
              marketing: { activeCampaigns: 0 },
              reputation: { avgRating: 0 },
              tasks: { completionRate, total: tsk.total, completed: tsk.completed },
              documents: { count: docCount },
            },
            message: 'Analytics overview retrieved successfully',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // Global Analytics — Realtime
      globalAnalyticsRealtime: async () => {
        try {
          const Client = mongoose.model('Client');
          const Invoice = mongoose.model('Invoice');
          const Task = mongoose.model('Task');

          const now = new Date();
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

          const [activeClients, recentInvoices, activeTasks] = await Promise.all([
            Client.countDocuments({ removed: false, updatedAt: { $gte: oneHourAgo } }),
            Invoice.countDocuments({ removed: false, updatedAt: { $gte: oneHourAgo } }),
            Task.countDocuments({ removed: false, status: { $ne: 'completed' } }),
          ]);

          return {
            success: true,
            result: { activeClients, recentInvoices, activeTasks, timestamp: now.toISOString() },
            message: 'Real-time analytics retrieved',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // Global Analytics — Module
      globalAnalyticsModule: async (parent, args) => {
        try {
          const { module: moduleName } = args;
          const modelMap = {
            crm: 'Client',
            sales: 'Invoice',
            tasks: 'Task',
            documents: 'Document',
            marketing: 'Campaign',
          };
          const modelName = modelMap[moduleName];
          if (!modelName) {
            return { success: true, result: { total: 0, module: moduleName }, message: 'Module not found' };
          }
          const Model = mongoose.model(modelName);
          const total = await Model.countDocuments({ removed: false });
          return {
            success: true,
            result: { total, module: moduleName },
            message: `${moduleName} analytics retrieved`,
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // Invoice recurring
      ...(invoiceController?.recurringHistory && {
        invoiceRecurringHistory: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await invoiceController.recurringHistory(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Quote delivery
      ...(quoteController?.deliveryHistory && {
        quoteDeliveryHistory: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await quoteController.deliveryHistory(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(quoteController?.deliveryStatus && {
        quoteDeliveryStatus: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await quoteController.deliveryStatus(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Document
      ...(documentAuditController?.getAuditTrail && {
        documentAuditTrail: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await documentAuditController.getAuditTrail(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(documentController?.getContent && {
        documentGetContent: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await documentController.getContent(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Customer Journey
      ...(customerJourneyController?.getJourney && {
        customerJourney: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.clientId = args.clientId;
          try {
            await customerJourneyController.getJourney(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(customerJourneyController?.getAnalytics && {
        customerJourneyAnalytics: wrapController(customerJourneyController.getAnalytics),
      }),

      // Settings
      ...(settingController && {
        settingRead: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await settingController.read(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
        settingList: wrapController(settingController.list),
        settingListAll: wrapController(settingController.listAll),
      }),
      ...(settingController?.readBySettingKey && {
        settingReadByKey: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.settingKey = args.settingKey;
          try {
            await settingController.readBySettingKey(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(settingController?.listBySettingKey && {
        settingListByKey: wrapController(settingController.listBySettingKey),
      }),

      // Admin
      ...(adminController?.read && {
        adminRead: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await adminController.read(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(adminController?.list && {
        adminList: wrapController(adminController.list),
      }),
      ...(adminController?.read && {
        userProfile: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = context.user?._id || context.user?.id;
          try {
            await adminController.read(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      userPermissions: async (parent, args, context) => {
        try {
          const user = context.user;
          if (!user) {
            return { success: false, result: null, message: 'Authentication required' };
          }
          const isOwner = user.role === 'owner' || user.userType === 'CompanyOwner';
          return {
            success: true,
            result: {
              permissions: user.permissions || {},
              isOwner,
              role: user.role,
              email: user.email,
              name: user.name,
              userId: user._id || user.id,
            },
            message: 'Permissions retrieved',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // Survey
      ...(surveyController?.getAnalytics && {
        surveyAnalytics: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await surveyController.getAnalytics(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Customer Chat queries
      ...(customerChatController?.getCustomerChatRooms && {
        customerChatRoomsByCustomer: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.query.page = args.page;
          req.query.limit = args.limit;
          try {
            await customerChatController.getCustomerChatRooms(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(customerChatController?.getEmployeeStats && {
        customerChatStats: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          try {
            await customerChatController.getEmployeeStats(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Copilot - Available Models
      ...(copilotController?.models && {
        aiAvailableModels: wrapController(copilotController.models),
      }),
    },

    Mutation: {
      // Client-specific
      ...(clientController?.calculateLeadScore && {
        clientCalculateLeadScore: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await clientController.calculateLeadScore(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(clientController?.recalculateAllLeadScores && {
        clientRecalculateAllLeadScores: wrapController(clientController.recalculateAllLeadScores),
      }),

      // Invoice-specific
      ...(invoiceController?.mail && {
        invoiceMail: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.body = args.input;
          try {
            await invoiceController.mail(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(invoiceController?.generateRecurring && {
        invoiceGenerateRecurring: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await invoiceController.generateRecurring(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Quote-specific
      ...(quoteController?.mail && {
        quoteMail: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.body = args.input;
          try {
            await quoteController.mail(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(quoteController?.convert && {
        quoteConvert: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await quoteController.convert(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(quoteController?.send && {
        quoteSend: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await quoteController.send(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Payment-specific
      ...(paymentController?.mail && {
        paymentMail: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.body = args.input;
          try {
            await paymentController.mail(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Settings
      ...(settingController?.create && {
        settingCreate: wrapController(settingController.create),
      }),
      ...(settingController?.update && {
        settingUpdate: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.body = args.input;
          try {
            await settingController.update(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(settingController?.updateBySettingKey && {
        settingUpdateByKey: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.settingKey = args.settingKey;
          req.body = args.input;
          try {
            await settingController.updateBySettingKey(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(settingController?.updateManySetting && {
        settingUpdateMany: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.body = args.input;
          try {
            await settingController.updateManySetting(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Customer Journey
      ...(customerJourneyController?.initialize && {
        customerJourneyInitialize: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.clientId = args.clientId;
          try {
            await customerJourneyController.initialize(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(customerJourneyController?.transition && {
        customerJourneyTransition: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.clientId = args.clientId;
          req.body = args.input;
          try {
            await customerJourneyController.transition(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Admin password update (admin resets another user's password)
      ...(adminController?.updatePassword && {
        adminPasswordUpdate: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.body = args.input;
          try {
            await adminController.updatePassword(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Update own profile password
      ...(adminController?.updateProfilePassword && {
        updateProfilePassword: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.body = args.input;
          try {
            await adminController.updateProfilePassword(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Update own profile
      ...(adminController?.updateProfile && {
        updateProfile: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.body = args.input;
          try {
            await adminController.updateProfile(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Customer Chat
      ...(customerChatController?.generateChatUrl && {
        customerChatGenerateUrl: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await customerChatController.generateChatUrl(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(customerChatController?.closeChatRoom && {
        customerChatRoomClose: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.roomId = args.roomId;
          try {
            await customerChatController.closeChatRoom(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(customerChatController?.archiveChatRoom && {
        customerChatRoomArchive: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.roomId = args.roomId;
          try {
            await customerChatController.archiveChatRoom(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(customerChatController?.deleteChatRoom && {
        customerChatRoomDelete: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.roomId = args.roomId;
          try {
            await customerChatController.deleteChatRoom(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Document — mutations
      ...(documentController?.edit && {
        documentEdit: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.body = typeof args.input === 'string' ? JSON.parse(args.input) : args.input;
          try {
            await documentController.edit(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(documentController?.revertToOriginal && {
        documentRevertToOriginal: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await documentController.revertToOriginal(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(documentController?.revertToVersion && {
        documentRevertToVersion: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.body = { versionNumber: args.version };
          try {
            await documentController.revertToVersion(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(documentController?.analyze && {
        documentAnalyze: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await documentController.analyze(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Campaign — advanced mutations
      ...(campaignController?.schedule && {
        campaignSchedule: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.body = args.input;
          try {
            await campaignController.schedule(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(campaignController?.optimize && {
        campaignOptimize: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await campaignController.optimize(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(campaignController?.bulkUpdate && {
        campaignBulkUpdate: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.body = { ids: args.ids, update: args.input };
          try {
            await campaignController.bulkUpdate(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(campaignController?.generateReport && {
        campaignGenerateReport: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await campaignController.generateReport(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(campaignController?.updateABTestMetrics && {
        campaignUpdateAbTestMetrics: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.body = args.input;
          try {
            await campaignController.updateABTestMetrics(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Task — add comment
      ...(taskCommentController?.addComment && {
        taskAddComment: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          req.body = { content: args.content };
          try {
            await taskCommentController.addComment(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(taskController?.aiPrioritize && {
        taskAiPrioritize: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.params.id = args.id;
          try {
            await taskController.aiPrioritize(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // AI Enhanced — queue & feedback mutations
      ...(aiEnhancedController?.queueMessage && {
        aiEnhancedQueueMessage: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.body = args.input;
          try {
            await aiEnhancedController.queueMessage(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(aiEnhancedController?.recordFeedback && {
        aiEnhancedRecordFeedback: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.body = args.input;
          try {
            await aiEnhancedController.recordFeedback(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // AI Workflow — process data
      ...(aiWorkflowController?.processWorkflow && {
        aiProcessData: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.body = typeof args.input === 'string' ? JSON.parse(args.input) : args.input;
          try {
            await aiWorkflowController.processWorkflow(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Data Entry — import/save mutations
      ...(dataEntryController?.importFromUrl && {
        dataEntryImportFromUrl: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.body = { url: args.url, options: args.options };
          try {
            await dataEntryController.importFromUrl(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      ...(dataEntryController?.save && {
        dataEntrySave: async (parent, args, context) => {
          const { req, res, getResponse } = createReqRes(args, context);
          req.body = args.input;
          try {
            await dataEntryController.save(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),
      // Data entry validation
      dataEntryValidate: async (parent, args, context) => {
        try {
          const { data, module: moduleName, options } = args.input || {};
          if (!data || !moduleName) {
            return { success: false, result: null, message: 'Data and module are required' };
          }
          const errors = [];
          const validated = data.map((item, idx) => {
            const issues = [];
            if (!item || typeof item !== 'object') {
              issues.push({ field: 'row', message: `Row ${idx + 1} is not a valid object` });
            }
            if (issues.length > 0) errors.push({ row: idx + 1, issues });
            return { ...item, _valid: issues.length === 0 };
          });
          return {
            success: true,
            result: { validatedData: validated, errors, totalErrors: errors.length, totalValid: validated.filter(v => v._valid).length },
            message: errors.length > 0 ? `Found ${errors.length} validation issues` : 'All data is valid',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
    },
  };
}

module.exports = createEntitySpecificResolvers;
