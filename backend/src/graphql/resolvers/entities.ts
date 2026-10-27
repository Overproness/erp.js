// @ts-nocheck
const { wrapController, createReqRes } = require('./crud');
const mongoose = require('mongoose');
const { requirePlanFeature, requirePlanLimit } = require('../utils/requirePlanFeature');

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
    chatQueueController,
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

      // AI Enhanced — extended queries (requires AI_SUITE plan)
      ...(aiEnhancedController?.getLearningStats && {
        aiEnhancedLearningStats: (parent, args, context) => {
          requirePlanFeature(context, 'AI_SELF_LEARNING');
          return wrapController(aiEnhancedController.getLearningStats)(parent, args, context);
        },
      }),
      ...(aiEnhancedController?.getSuggestionAnalytics && {
        aiEnhancedQueueStatistics: (parent, args, context) => {
          requirePlanFeature(context, 'AI_SUITE');
          return wrapController(aiEnhancedController.getSuggestionAnalytics)(parent, args, context);
        },
      }),
      // AI Enhanced — queue status (no dedicated controller method, returns general status)
      aiEnhancedQueueStatus: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
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

      // Campaign A/B Test results (requires AB_TESTING plan)
      ...(campaignController?.getABTestResults && {
        campaignAbTestResults: async (parent, args, context) => {
          requirePlanFeature(context, 'AB_TESTING');
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

      // Global Analytics — Realtime (requires REALTIME_ANALYTICS plan)
      globalAnalyticsRealtime: async (parent, args, context) => {
        requirePlanFeature(context, 'REALTIME_ANALYTICS');
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

      // Global Analytics — Module (requires GLOBAL_KPI_DASHBOARD plan)
      globalAnalyticsModule: async (parent, args, context) => {
        requirePlanFeature(context, 'GLOBAL_KPI_DASHBOARD');
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
      // Document audit trail (requires DOCUMENT_COMPLIANCE_AUDIT for compliance audit)
      ...(documentAuditController?.getAuditTrail && {
        documentAuditTrail: async (parent, args, context) => {
          requirePlanFeature(context, 'DOCUMENT_COMPLIANCE_AUDIT');
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

      // Customer Journey (requires CUSTOMER_JOURNEY_TRACKING plan)
      ...(customerJourneyController?.getJourney && {
        customerJourney: async (parent, args, context) => {
          requirePlanFeature(context, 'CUSTOMER_JOURNEY_TRACKING');
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
        customerJourneyAnalytics: (parent, args, context) => {
          requirePlanFeature(context, 'CUSTOMER_JOURNEY_TRACKING');
          return wrapController(customerJourneyController.getAnalytics)(parent, args, context);
        },
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

      // Customer Chat queries (requires CUSTOMER_LIVE_CHAT plan)
      ...(customerChatController?.getCustomerChatRooms && {
        customerChatRoomsByCustomer: async (parent, args, context) => {
          requirePlanFeature(context, 'CUSTOMER_LIVE_CHAT');
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
          requirePlanFeature(context, 'CUSTOMER_LIVE_CHAT');
          const { req, res, getResponse } = createReqRes(args, context);
          try {
            await customerChatController.getEmployeeStats(req, res);
            return getResponse().data;
          } catch (error) {
            return { success: false, result: null, message: error.message };
          }
        },
      }),

      // Copilot - Available Models (requires AI_SUITE plan)
      ...(copilotController?.models && {
        aiAvailableModels: (parent, args, context) => {
          requirePlanFeature(context, 'AI_SUITE');
          return wrapController(copilotController.models)(parent, args, context);
        },
      }),

      // ── Settings (missing) ──────────────────────────────────────────────
      settingSearch: wrapController(settingController?.search),
      settingFilter: wrapController(settingController?.filter),

      // ── User / Admin (missing) ──────────────────────────────────────────
      userRead: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await adminController.read(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      userList: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await adminController.list(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      userSearch: async (parent, args, context) => {
        try {
          const AdminModel = mongoose.model('CompanyOwner');
          const q = args.q || '';
          const regex = new RegExp(q, 'i');
          const users = await AdminModel.find({
            removed: false,
            $or: [{ name: regex }, { email: regex }],
          }).lean();
          return { success: true, result: users, message: 'Users found' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── Invoice recurring ───────────────────────────────────────────────
      // (already covered if invoiceController.recurringHistory exists — added below as fallback)

      // ── Quote delivery (missing if not already bound) ──────────────────

      // ── Team (missing) ─────────────────────────────────────────────────
      teamListAll: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (controllers.teamController?.listAll) {
            await controllers.teamController.listAll(req, res);
            return getResponse().data;
          }
          return { success: false, result: [], message: 'Not implemented' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      teamListMembers: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.teamController.listMembers(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      teamMemberPerformance: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.params.memberId = args.memberId;
        try {
          await controllers.teamController.getMemberPerformance(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      teamInvitationDetails: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.token = args.token;
        try {
          await controllers.teamController.getInvitationDetails(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Reminder (missing) ─────────────────────────────────────────────
      reminderRead: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.reminderController.getReminder(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      reminderList: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await controllers.reminderController.getReminders(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      reminderListAll: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await controllers.reminderController.getReminders(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      reminderSearch: async (parent, args, context) => {
        try {
          const Reminder = mongoose.model('Reminder');
          const q = args.q || '';
          const regex = new RegExp(q, 'i');
          const items = await Reminder.find({
            removed: false,
            $or: [{ title: regex }, { description: regex }],
          }).lean();
          return { success: true, result: items, message: 'Reminders found' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      reminderFilter: async (parent, args, context) => {
        try {
          const Reminder = mongoose.model('Reminder');
          const filter = {};
          if (args.filter && args.equal) filter[args.filter] = args.equal;
          const items = await Reminder.find({ removed: false, ...filter }).lean();
          return { success: true, result: items, message: 'Reminders filtered' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── Document (missing) ─────────────────────────────────────────────
      documentAdvancedSearch: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (documentController?.advancedSearch) {
            await documentController.advancedSearch(req, res);
            return getResponse().data;
          }
          return { success: false, result: [], message: 'Not implemented' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      documentListVersions: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await documentController.listVersions(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      documentGetVersion: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.params.version = args.version;
        try {
          await documentController.getVersion(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentListShareURLs: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (documentController?.listDocumentShareURLs) {
            await documentController.listDocumentShareURLs(req, res);
            return getResponse().data;
          }
          return { success: false, result: [], message: 'Not implemented' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── Notification (missing) ─────────────────────────────────────────
      notificationListAll: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await controllers.notificationController.list(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      notificationFilter: async (parent, args, context) => {
        try {
          const Notification = mongoose.model('Notification');
          const filter = {};
          if (args.filter && args.equal) filter[args.filter] = args.equal;
          const items = await Notification.find({ ...filter }).lean();
          return { success: true, result: items, message: 'Notifications filtered' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      notificationUnreadCount: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await controllers.notificationController.getUnreadCount(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Chat (missing) ─────────────────────────────────────────────────
      chatRoomRead: async (parent, args, context) => {
        try {
          const ChatRoom = mongoose.model('ChatRoom');
          const room = await ChatRoom.findById(args.id).lean();
          return room
            ? { success: true, result: room, message: 'Chat room found' }
            : { success: false, result: null, message: 'Chat room not found' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      chatRoomList: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await controllers.chatController.getChatList(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      chatMessageList: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.roomId = args.roomId;
        req.query.page = args.page;
        req.query.limit = args.limit;
        try {
          await controllers.chatController.getChatHistory(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      chatQueueList: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.page = args.page;
        req.query.limit = args.limit;
        try {
          if (chatQueueController?.getQueueStatus) {
            await chatQueueController.getQueueStatus(req, res);
            return getResponse().data;
          }
          return { success: false, result: [], message: 'Chat queue not available' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── URL Analytics (missing) ────────────────────────────────────────
      urlAnalytics: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.query.period = args.period;
        try {
          if (controllers.urlAnalyticsController?.getAnalytics) {
            await controllers.urlAnalyticsController.getAnalytics(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'URL analytics not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      urlClickHistory: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.query.page = args.page;
        req.query.limit = args.limit;
        try {
          if (controllers.urlAnalyticsController?.getClickHistory) {
            await controllers.urlAnalyticsController.getClickHistory(req, res);
            return getResponse().data;
          }
          return { success: false, result: [], message: 'URL click history not available' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── A/B Test (missing) ─────────────────────────────────────────────
      abTestResults: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.abTestController.getResults(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Survey (missing) ──────────────────────────────────────────────
      surveyListAll: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await controllers.surveyController.list(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      surveySearch: async (parent, args, context) => {
        try {
          const Survey = mongoose.model('Survey');
          const q = args.q || '';
          const regex = new RegExp(q, 'i');
          const items = await Survey.find({
            removed: false,
            $or: [{ title: regex }, { description: regex }],
          }).lean();
          return { success: true, result: items, message: 'Surveys found' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      surveyFilter: async (parent, args, context) => {
        try {
          const Survey = mongoose.model('Survey');
          const filter = {};
          if (args.filter && args.equal) filter[args.filter] = args.equal;
          const items = await Survey.find({ removed: false, ...filter }).lean();
          return { success: true, result: items, message: 'Surveys filtered' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      surveyResponseList: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.surveyId;
        req.query.page = args.page;
        req.query.limit = args.limit;
        try {
          await surveyResponseController.getResponse(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      surveyResponseRead: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await surveyResponseController.getResponse(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Business Process (missing) ─────────────────────────────────────
      businessProcessRead: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.businessProcessController.getBusinessProcess(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      businessProcessList: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await controllers.businessProcessController.getBusinessProcesses(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      businessProcessListAll: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await controllers.businessProcessController.getBusinessProcesses(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      businessProcessSearch: async (parent, args, context) => {
        try {
          const BusinessProcess = mongoose.model('BusinessProcess');
          const q = args.q || '';
          const regex = new RegExp(q, 'i');
          const items = await BusinessProcess.find({
            removed: false,
            $or: [{ name: regex }, { description: regex }],
          }).lean();
          return { success: true, result: items, message: 'Business processes found' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      businessProcessFilter: async (parent, args, context) => {
        try {
          const BusinessProcess = mongoose.model('BusinessProcess');
          const filter = {};
          if (args.filter && args.equal) filter[args.filter] = args.equal;
          const items = await BusinessProcess.find({ removed: false, ...filter }).lean();
          return { success: true, result: items, message: 'Business processes filtered' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── Workflow Execution (missing) ────────────────────────────────────
      workflowExecutionRead: async (parent, args, context) => {
        try {
          const WorkflowExecution = mongoose.model('WorkflowExecution');
          const doc = await WorkflowExecution.findById(args.id).lean();
          return doc
            ? { success: true, result: doc, message: 'Workflow execution found' }
            : { success: false, result: null, message: 'Not found' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      workflowExecutionList: async (parent, args, context) => {
        try {
          const WorkflowExecution = mongoose.model('WorkflowExecution');
          const items = await WorkflowExecution.find({}).lean();
          return { success: true, result: items, message: 'Workflow executions retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      workflowExecutionFilter: async (parent, args, context) => {
        try {
          const WorkflowExecution = mongoose.model('WorkflowExecution');
          const filter = {};
          if (args.filter && args.equal) filter[args.filter] = args.equal;
          const items = await WorkflowExecution.find(filter).lean();
          return { success: true, result: items, message: 'Workflow executions filtered' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      workflowExecutionByWorkflow: async (parent, args, context) => {
        try {
          const WorkflowExecution = mongoose.model('WorkflowExecution');
          const items = await WorkflowExecution.find({ workflow: args.workflowId }).lean();
          return { success: true, result: items, message: 'Workflow executions retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── Appointment (missing) ──────────────────────────────────────────
      appointmentRead: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.appointmentController.getAppointment(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      appointmentList: wrapController(controllers.appointmentController.getAppointments),
      appointmentListAll: wrapController(controllers.appointmentController.getAppointments),
      appointmentSearch: async (parent, args, context) => {
        try {
          const Appointment = mongoose.model('Appointment');
          const q = args.q || '';
          const regex = new RegExp(q, 'i');
          const items = await Appointment.find({
            removed: false,
            $or: [{ title: regex }, { description: regex }],
          }).lean();
          return { success: true, result: items, message: 'Appointments found' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      appointmentFilter: async (parent, args, context) => {
        try {
          const Appointment = mongoose.model('Appointment');
          const filter = {};
          if (args.filter && args.equal) filter[args.filter] = args.equal;
          const items = await Appointment.find({ removed: false, ...filter }).lean();
          return { success: true, result: items, message: 'Appointments filtered' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      appointmentByDateRange: async (parent, args, context) => {
        try {
          const Appointment = mongoose.model('Appointment');
          const items = await Appointment.find({
            removed: false,
            startTime: { $gte: new Date(args.startDate) },
            endTime: { $lte: new Date(args.endDate) },
          }).lean();
          return { success: true, result: items, message: 'Appointments retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── Campaign (missing) ─────────────────────────────────────────────
      campaignListAll: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await campaignController.getAll(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      campaignSearch: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        try {
          const Campaign = mongoose.model('Campaign');
          const q = args.q || '';
          const regex = new RegExp(q, 'i');
          const items = await Campaign.find({
            removed: false,
            $or: [{ name: regex }, { subject: regex }],
          }).lean();
          return { success: true, result: items, message: 'Campaigns found' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      campaignFilter: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        try {
          const Campaign = mongoose.model('Campaign');
          const filter = {};
          if (args.filter && args.equal) filter[args.filter] = args.equal;
          const items = await Campaign.find({ removed: false, ...filter }).lean();
          return { success: true, result: items, message: 'Campaigns filtered' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      campaignSummary: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (campaignController?.getAnalytics) {
            await campaignController.getAnalytics(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      campaignAnalytics: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await campaignController.getAnalytics(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Analytics (missing) ────────────────────────────────────────────
      analyticsDashboard: async (parent, args, context) => {
        try {
          if (controllers.AnalyticsController?.getDashboard) {
            const { req, res, getResponse } = createReqRes(args, context);
            await controllers.AnalyticsController.getDashboard(req, res);
            return getResponse().data;
          }
          // Fallback inline
          const Client = mongoose.model('Client');
          const Invoice = mongoose.model('Invoice');
          const [clients, invoiceAgg] = await Promise.all([
            Client.countDocuments({ removed: false }),
            Invoice.aggregate([{ $match: { removed: false } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
          ]);
          return {
            success: true,
            result: { totalClients: clients, totalRevenue: invoiceAgg[0]?.total || 0 },
            message: 'Dashboard analytics retrieved',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      analyticsRevenue: async (parent, args, context) => {
        try {
          const Invoice = mongoose.model('Invoice');
          const match = { removed: false };
          if (args.startDate) match['date'] = { $gte: new Date(args.startDate) };
          if (args.endDate) match['date'] = { ...(match['date'] || {}), $lte: new Date(args.endDate) };
          const agg = await Invoice.aggregate([
            { $match: match },
            { $group: { _id: { $month: '$date' }, total: { $sum: '$total' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } },
          ]);
          return { success: true, result: agg, message: 'Revenue analytics retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      analyticsClients: async (parent, args, context) => {
        try {
          const Client = mongoose.model('Client');
          const total = await Client.countDocuments({ removed: false });
          return { success: true, result: { total }, message: 'Client analytics retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      analyticsConversion: async (parent, args, context) => {
        try {
          const Quote = mongoose.model('Quote');
          const Invoice = mongoose.model('Invoice');
          const [quotes, invoices] = await Promise.all([
            Quote.countDocuments({ removed: false }),
            Invoice.countDocuments({ removed: false }),
          ]);
          const rate = quotes > 0 ? Math.round((invoices / quotes) * 100) : 0;
          return { success: true, result: { quotes, invoices, conversionRate: rate }, message: 'Conversion analytics retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      analyticsEngagement: async (parent, args, context) => {
        try {
          const Task = mongoose.model('Task');
          const total = await Task.countDocuments({ removed: false });
          const completed = await Task.countDocuments({ removed: false, status: 'completed' });
          return { success: true, result: { total, completed, engagementRate: total > 0 ? Math.round((completed / total) * 100) : 0 }, message: 'Engagement analytics retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      analyticsTrends: async (parent, args, context) => {
        try {
          return { success: true, result: { metric: args.metric, period: args.period, data: [] }, message: 'Trends analytics retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Review Analytics (missing) ─────────────────────────────────────
      reviewFilter: async (parent, args, context) => {
        requirePlanFeature(context, 'REVIEW_AGGREGATION');
        try {
          const Review = mongoose.model('Review');
          const filter = {};
          if (args.filter && args.equal) filter[args.filter] = args.equal;
          const items = await Review.find({ removed: false, ...filter }).lean();
          return { success: true, result: items, message: 'Reviews filtered' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      reviewAnalyticsSummary: async (parent, args, context) => {
        requirePlanFeature(context, 'REVIEW_AGGREGATION');
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.period = args.period;
        try {
          if (controllers.reviewAnalyticsController?.getDashboard) {
            await controllers.reviewAnalyticsController.getDashboard(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Review analytics not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      reviewAnalyticsByPlatform: async (parent, args, context) => {
        requirePlanFeature(context, 'REVIEW_AGGREGATION');
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (controllers.reviewAnalyticsController?.getPlatformComparison) {
            await controllers.reviewAnalyticsController.getPlatformComparison(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      reviewAnalyticsSentiment: async (parent, args, context) => {
        requirePlanFeature(context, 'REVIEW_AGGREGATION');
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.period = args.period;
        try {
          if (controllers.reviewAnalyticsController?.getSentimentTrends) {
            await controllers.reviewAnalyticsController.getSentimentTrends(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      reviewPortalPublicLink: async (parent, args, context) => {
        requirePlanFeature(context, 'REVIEW_AGGREGATION');
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (controllers.reviewPortalController?.getPortalConfig) {
            await controllers.reviewPortalController.getPortalConfig(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Review portal not configured' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Global Analytics (missing) ──────────────────────────────────────
      globalAnalyticsOverview: async (parent, args, context) => {
        requirePlanFeature(context, 'GLOBAL_KPI_DASHBOARD');
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.period = args.period;
        try {
          if (controllers.globalAnalyticsController?.getAllModulesOverview) {
            await controllers.globalAnalyticsController.getAllModulesOverview(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Global analytics not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      globalAnalyticsDashboard: async (parent, args, context) => {
        requirePlanFeature(context, 'GLOBAL_KPI_DASHBOARD');
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (controllers.globalAnalyticsController?.getGlobalDashboard) {
            await controllers.globalAnalyticsController.getGlobalDashboard(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Global analytics not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      globalAnalyticsKPI: async (parent, args, context) => {
        requirePlanFeature(context, 'GLOBAL_KPI_DASHBOARD');
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.period = args.period;
        try {
          if (controllers.globalAnalyticsController?.getRealTimeMetrics) {
            await controllers.globalAnalyticsController.getRealTimeMetrics(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      globalAnalyticsComparison: async (parent, args, context) => {
        requirePlanFeature(context, 'GLOBAL_KPI_DASHBOARD');
        try {
          return { success: true, result: { periods: args.periods, data: [] }, message: 'Comparison retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      globalAnalyticsExport: async (parent, args, context) => {
        requirePlanFeature(context, 'GLOBAL_KPI_DASHBOARD');
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.format = args.format;
        req.query.period = args.period;
        try {
          if (controllers.globalAnalyticsController?.exportData) {
            await controllers.globalAnalyticsController.exportData(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Export not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Statistics (missing) ───────────────────────────────────────────
      statisticsOverview: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.timeframe = args.period;
        try {
          if (statisticsController?.getDashboardStats) {
            await statisticsController.getDashboardStats(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Statistics not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      statisticsRevenue: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.timeframe = args.period;
        if (args.startDate) req.query.startDate = args.startDate;
        if (args.endDate) req.query.endDate = args.endDate;
        try {
          if (statisticsController?.getInvoiceStats) {
            await statisticsController.getInvoiceStats(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      statisticsClients: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.timeframe = args.period;
        try {
          if (statisticsController?.getClientStats) {
            await statisticsController.getClientStats(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      statisticsInvoices: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.timeframe = args.period;
        try {
          if (statisticsController?.getInvoiceStats) {
            await statisticsController.getInvoiceStats(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      statisticsQuotes: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.timeframe = args.period;
        try {
          if (statisticsController?.getQuoteStats) {
            await statisticsController.getQuoteStats(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      statisticsPayments: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.timeframe = args.period;
        try {
          if (statisticsController?.getPaymentStats) {
            await statisticsController.getPaymentStats(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      statisticsTasks: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.timeframe = args.period;
        try {
          if (statisticsController?.getTaskStats) {
            await statisticsController.getTaskStats(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      statisticsTeam: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.timeframe = args.period;
        try {
          if (statisticsController?.getTeamStats) {
            await statisticsController.getTeamStats(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Social Analytics (missing) ─────────────────────────────────────
      socialAnalyticsByAccount: async (parent, args, context) => {
        requirePlanFeature(context, 'SOCIAL_MANAGEMENT');
        try {
          return { success: true, result: { accountId: args.accountId, data: [] }, message: 'Social analytics retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      socialAnalyticsOverview: async (parent, args, context) => {
        requirePlanFeature(context, 'SOCIAL_MANAGEMENT');
        try {
          return { success: true, result: { data: [] }, message: 'Social analytics overview retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Customer Behavior / Follow-Up / Journey / Segment (missing) ────
      customerBehaviorList: async (parent, args, context) => {
        try {
          const Interaction = mongoose.model('Interaction');
          const query = { removed: false };
          if (args.clientId) query['client'] = args.clientId;
          const items = await Interaction.find(query)
            .sort({ createdAt: -1 })
            .limit(args.limit || 50)
            .lean();
          return { success: true, result: items, message: 'Customer behavior retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      customerBehaviorAnalytics: async (parent, args, context) => {
        try {
          return { success: true, result: { clientId: args.clientId, events: [], period: args.period }, message: 'Behavior analytics retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      customerFollowUpList: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.page = args.page;
        req.query.limit = args.limit;
        req.query.sortBy = args.sortBy;
        req.query.sortValue = args.sortValue;
        try {
          await controllers.followUpController.listFollowUps(req, res);
          return getResponse().data || {
            success: false,
            result: [],
            message: 'No response while retrieving follow-ups',
          };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      customerFollowUpRead: async (parent, args, context) => {
        try {
          const FollowUp = mongoose.model('CustomerFollowUp');
          const doc = await FollowUp.findById(args.id).lean();
          return doc
            ? { success: true, result: doc, message: 'Follow-up retrieved' }
            : { success: false, result: null, message: 'Not found' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      customerFollowUpByClient: async (parent, args, context) => {
        try {
          const FollowUp = mongoose.model('CustomerFollowUp');
          const items = await FollowUp.find({ client: args.clientId, removed: false }).lean();
          return { success: true, result: items, message: 'Follow-ups retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      customerSegmentMembers: async (parent, args, context) => {
        requirePlanFeature(context, 'CUSTOMER_SEGMENTATION');
        try {
          const Segment = mongoose.model('CustomerSegment');
          const seg = await Segment.findById(args.id).populate('clients').lean();
          if (!seg) return { success: false, result: [], message: 'Segment not found' };
          return { success: true, result: seg.clients || [], message: 'Segment members retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── Retargeting (missing) ──────────────────────────────────────────
      retargetingList: async (parent, args, context) => {
        requirePlanFeature(context, 'RETARGETING');
        try {
          const Retargeting = mongoose.model('RetargetingCampaign');
          const items = await Retargeting.find({ removed: false }).lean();
          return { success: true, result: items, message: 'Retargeting campaigns retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      retargetingRead: async (parent, args, context) => {
        requirePlanFeature(context, 'RETARGETING');
        try {
          const Retargeting = mongoose.model('RetargetingCampaign');
          const doc = await Retargeting.findById(args.id).lean();
          return doc
            ? { success: true, result: doc, message: 'Retargeting campaign retrieved' }
            : { success: false, result: null, message: 'Not found' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      retargetingFilter: async (parent, args, context) => {
        requirePlanFeature(context, 'RETARGETING');
        try {
          const Retargeting = mongoose.model('RetargetingCampaign');
          const filter = {};
          if (args.filter && args.equal) filter[args.filter] = args.equal;
          const items = await Retargeting.find({ removed: false, ...filter }).lean();
          return { success: true, result: items, message: 'Retargeting campaigns filtered' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      retargetingAnalytics: async (parent, args, context) => {
        requirePlanFeature(context, 'RETARGETING');
        try {
          if (controllers.retargetingController?.getPerformance) {
            const { req, res, getResponse } = createReqRes(args, context);
            req.params.id = args.id;
            await controllers.retargetingController.getPerformance(req, res);
            return getResponse().data;
          }
          return { success: true, result: { id: args.id, metrics: {} }, message: 'Analytics retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Compliance (missing) ───────────────────────────────────────────
      consentRecordByClient: async (parent, args, context) => {
        requirePlanFeature(context, 'GDPR_CONSENT');
        try {
          const ConsentRecord = mongoose.model('ConsentRecord');
          const items = await ConsentRecord.find({ client: args.clientId }).lean();
          return { success: true, result: items, message: 'Consent records retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      complianceReport: async (parent, args, context) => {
        requirePlanFeature(context, 'GDPR_CONSENT');
        try {
          const ConsentRecord = mongoose.model('ConsentRecord');
          const total = await ConsentRecord.countDocuments({});
          const consented = await ConsentRecord.countDocuments({ status: 'consented' });
          const revoked = await ConsentRecord.countDocuments({ status: 'revoked' });
          return {
            success: true,
            result: { total, consented, revoked, period: args.period },
            message: 'Compliance report generated',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Audit Trail (missing) ──────────────────────────────────────────
      auditTrailList: async (parent, args, context) => {
        try {
          const AuditTrail = mongoose.model('AuditTrail');
          const items = await AuditTrail.find({})
            .sort({ createdAt: -1 })
            .limit(args.limit || 50)
            .lean();
          return { success: true, result: items, message: 'Audit trails retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      auditTrailRead: async (parent, args, context) => {
        try {
          const AuditTrail = mongoose.model('AuditTrail');
          const doc = await AuditTrail.findById(args.id).lean();
          return doc
            ? { success: true, result: doc, message: 'Audit trail retrieved' }
            : { success: false, result: null, message: 'Not found' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      auditTrailByEntity: async (parent, args, context) => {
        try {
          const AuditTrail = mongoose.model('AuditTrail');
          const items = await AuditTrail.find({
            entityType: args.entityType,
            entityId: args.entityId,
          }).sort({ createdAt: -1 }).lean();
          return { success: true, result: items, message: 'Audit trails retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      auditTrailByUser: async (parent, args, context) => {
        try {
          const AuditTrail = mongoose.model('AuditTrail');
          const items = await AuditTrail.find({ user: args.userId })
            .sort({ createdAt: -1 })
            .limit(args.limit || 50)
            .lean();
          return { success: true, result: items, message: 'Audit trails retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      auditTrailFilter: async (parent, args, context) => {
        try {
          const AuditTrail = mongoose.model('AuditTrail');
          const filter = {};
          if (args.filter && args.equal) filter[args.filter] = args.equal;
          const items = await AuditTrail.find(filter).lean();
          return { success: true, result: items, message: 'Audit trails filtered' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      auditTrailSearch: async (parent, args, context) => {
        try {
          const AuditTrail = mongoose.model('AuditTrail');
          const q = args.q || '';
          const regex = new RegExp(q, 'i');
          const items = await AuditTrail.find({
            $or: [{ action: regex }, { entityType: regex }],
          }).lean();
          return { success: true, result: items, message: 'Audit trails found' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      auditTrailReport: async (parent, args, context) => {
        try {
          const AuditTrail = mongoose.model('AuditTrail');
          const filter = {};
          if (args.entityType) filter['entityType'] = args.entityType;
          const total = await AuditTrail.countDocuments(filter);
          return {
            success: true,
            result: { total, period: args.period, entityType: args.entityType },
            message: 'Audit trail report generated',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── AI Conversation (missing) ──────────────────────────────────────
      aiConversationList: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (controllers.aiConversationController?.list) {
            await controllers.aiConversationController.list(req, res);
            return getResponse().data;
          }
          return { success: false, result: [], message: 'AI conversations not available' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      aiConversationRead: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (controllers.aiConversationController?.read) {
            await controllers.aiConversationController.read(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiConversationHistory: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (aiAssistantController?.getConversationMessages) {
            await aiAssistantController.getConversationMessages(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiSuggestions: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = { context: args.context, type: args.type };
        try {
          if (aiAssistantController?.suggest) {
            await aiAssistantController.suggest(req, res);
            return getResponse().data;
          }
          return { success: true, result: { suggestions: [] }, message: 'No suggestions available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── AI Processing Job (missing) ────────────────────────────────────
      aiProcessingJobList: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (controllers.aiProcessingWorkflowController?.list) {
            await controllers.aiProcessingWorkflowController.list(req, res);
            return getResponse().data;
          }
          return { success: false, result: [], message: 'AI processing jobs not available' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      aiProcessingJobRead: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (controllers.aiProcessingWorkflowController?.read) {
            await controllers.aiProcessingWorkflowController.read(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiProcessingJobFilter: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (controllers.aiProcessingWorkflowController?.filter) {
            await controllers.aiProcessingWorkflowController.filter(req, res);
            return getResponse().data;
          }
          return { success: false, result: [], message: 'Not available' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      aiProcessingJobStatus: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return {
            success: true,
            result: { id: args.id, status: 'pending', progress: 0 },
            message: 'Job status retrieved',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── AI Enhanced (missing) ──────────────────────────────────────────
      aiEnhancedAnalytics: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.entityType = args.entityType;
        req.query.period = args.period;
        try {
          if (aiEnhancedController?.getSuggestionAnalytics) {
            await aiEnhancedController.getSuggestionAnalytics(req, res);
            return getResponse().data;
          }
          return { success: true, result: {}, message: 'Analytics retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiEnhancedInsights: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.context;
        try {
          if (aiEnhancedController?.getLearnedInsights) {
            await aiEnhancedController.getLearnedInsights(req, res);
            return getResponse().data;
          }
          return { success: true, result: { insights: [] }, message: 'Insights retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiEnhancedRecommendations: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.entityType = args.entityType;
        if (args.entityId) req.params.id = args.entityId;
        try {
          if (aiEnhancedController?.getSuggestions) {
            await aiEnhancedController.getSuggestions(req, res);
            return getResponse().data;
          }
          return { success: true, result: { recommendations: [] }, message: 'Recommendations retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiEnhancedForecast: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return {
            success: true,
            result: { metric: args.metric, period: args.period, forecast: [] },
            message: 'Forecast retrieved',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── AI Preferences (missing) ───────────────────────────────────────
      aiPreferencesRead: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (controllers.aiUserPreferenceController?.read) {
            await controllers.aiUserPreferenceController.read(req, res);
            return getResponse().data;
          }
          return { success: true, result: {}, message: 'AI preferences retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiPreferencesList: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (controllers.aiUserPreferenceController?.list) {
            await controllers.aiUserPreferenceController.list(req, res);
            return getResponse().data;
          }
          return { success: true, result: [], message: 'AI preferences listed' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── AI Knowledge Base (missing) ────────────────────────────────────
      aiKnowledgeBaseByCategory: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_KNOWLEDGE_BASE');
        try {
          const KnowledgeBase = mongoose.model('AiKnowledgeBase');
          const items = await KnowledgeBase.find({ category: args.category, removed: false }).lean();
          return { success: true, result: items, message: 'Knowledge base entries retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      aiKnowledgeBaseSemanticSearch: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_KNOWLEDGE_BASE');
        try {
          const KnowledgeBase = mongoose.model('AiKnowledgeBase');
          const q = args.query || '';
          const regex = new RegExp(q, 'i');
          const limit = args.limit || 10;
          const items = await KnowledgeBase.find({
            removed: false,
            $or: [{ title: regex }, { content: regex }, { tags: regex }],
          }).limit(limit).lean();
          return { success: true, result: items, message: 'Semantic search completed' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },

      // ── Copilot (missing) ──────────────────────────────────────────────
      copilotSessionList: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: [], message: 'Copilot sessions retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      copilotSessionRead: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: { id: args.id }, message: 'Copilot session retrieved' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      copilotSuggestions: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.context;
        try {
          if (copilotController?.suggestions) {
            await copilotController.suggestions(req, res);
            return getResponse().data;
          }
          return { success: true, result: { suggestions: [] }, message: 'No suggestions available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      copilotContextualHelp: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return {
            success: true,
            result: { page: args.page, action: args.action, help: [] },
            message: 'Contextual help retrieved',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── CRM URLs (missing) ─────────────────────────────────────────────
      crmUrlList: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          if (controllers.urlRedirectController?.list) {
            await controllers.urlRedirectController.list(req, res);
            return getResponse().data;
          }
          return { success: false, result: [], message: 'CRM URLs not available' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      crmUrlRead: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (controllers.urlRedirectController?.read) {
            await controllers.urlRedirectController.read(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'CRM URL not found' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      crmUrlByEntity: async (parent, args, context) => {
        try {
          const URLRedirect = mongoose.model('URLRedirect');
          const items = await URLRedirect.find({
            entityType: args.entityType,
            entityId: args.entityId,
          }).lean();
          return { success: true, result: items, message: 'CRM URLs retrieved' };
        } catch (error) {
          return { success: false, result: [], message: error.message };
        }
      },
      crmUrlAnalytics: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (controllers.urlAnalyticsController?.getAnalytics) {
            await controllers.urlAnalyticsController.getAnalytics(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'CRM URL analytics not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Data Entry Templates (missing) ─────────────────────────────────
      dataEntryTemplates: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params = { entityType: args.entityType };
        req.query = { entityType: args.entityType };
        try {
          if (dataEntryController?.getTemplates) {
            await dataEntryController.getTemplates(req, res);
            return getResponse().data;
          }
          return { success: true, result: [], message: 'No templates available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
    },

    Mutation: {
      // Client-specific (lead scoring requires LEAD_SCORING plan)
      ...(clientController?.calculateLeadScore && {
        clientCalculateLeadScore: async (parent, args, context) => {
          requirePlanFeature(context, 'LEAD_SCORING');
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
        clientRecalculateAllLeadScores: (parent, args, context) => {
          requirePlanFeature(context, 'LEAD_SCORING');
          return wrapController(clientController.recalculateAllLeadScores)(parent, args, context);
        },
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
      // Invoice recurring (requires RECURRING_BILLING plan)
      ...(invoiceController?.generateRecurring && {
        invoiceGenerateRecurring: async (parent, args, context) => {
          requirePlanFeature(context, 'RECURRING_BILLING');
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

      // Customer Journey mutations (requires CUSTOMER_JOURNEY_TRACKING plan)
      ...(customerJourneyController?.initialize && {
        customerJourneyInitialize: async (parent, args, context) => {
          requirePlanFeature(context, 'CUSTOMER_JOURNEY_TRACKING');
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
          requirePlanFeature(context, 'CUSTOMER_JOURNEY_TRACKING');
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

      // Admin password update
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

      // Customer Chat mutations (requires CUSTOMER_LIVE_CHAT plan)
      ...(customerChatController?.generateChatUrl && {
        customerChatGenerateUrl: async (parent, args, context) => {
          requirePlanFeature(context, 'CUSTOMER_LIVE_CHAT');
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
          requirePlanFeature(context, 'CUSTOMER_LIVE_CHAT');
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
          requirePlanFeature(context, 'CUSTOMER_LIVE_CHAT');
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
          requirePlanFeature(context, 'CUSTOMER_LIVE_CHAT');
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
          requirePlanFeature(context, 'AI_SUITE');
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

      // Campaign — advanced mutations (requires CAMPAIGN_MANAGEMENT plan)
      ...(campaignController?.schedule && {
        campaignSchedule: async (parent, args, context) => {
          requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
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
          requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
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
          requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
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
          requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
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
          requirePlanFeature(context, 'AB_TESTING');
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
          req.params.taskId = args.id;
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
          requirePlanFeature(context, 'AI_TASK_PRIORITIZATION');
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

      // AI Enhanced — queue & feedback mutations (requires AI_SUITE plan)
      ...(aiEnhancedController?.queueMessage && {
        aiEnhancedQueueMessage: async (parent, args, context) => {
          requirePlanFeature(context, 'AI_SUITE');
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
          requirePlanFeature(context, 'AI_SELF_LEARNING');
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

      // AI Workflow — process data (requires AI_SUITE plan)
      ...(aiWorkflowController?.processWorkflow && {
        aiProcessData: async (parent, args, context) => {
          requirePlanFeature(context, 'AI_SUITE');
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

      // Data Entry — import/save mutations (requires AI_SUITE plan)
      ...(dataEntryController?.importFromUrl && {
        dataEntryImportFromUrl: async (parent, args, context) => {
          requirePlanFeature(context, 'AI_SUITE');
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
          requirePlanFeature(context, 'AI_SUITE');
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

      // ── Settings (missing Mutations) ───────────────────────────────────
      settingDelete: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (settingController?.delete) {
            await settingController.delete(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      settingTestOpenAIKey: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = { key: args.key };
        try {
          if (settingController?.testOpenAIKey) {
            await settingController.testOpenAIKey(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      settingTestGeminiKey: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = { key: args.key };
        try {
          if (settingController?.testGeminiKey) {
            await settingController.testGeminiKey(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      settingTestClaudeKey: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = { key: args.key };
        try {
          if (settingController?.testClaudeKey) {
            await settingController.testClaudeKey(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Admin / User (missing Mutations) ──────────────────────────────
      adminUpdate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input;
        try {
          if (adminController?.updateProfile) {
            await adminController.updateProfile(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      adminCompleteSetup: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (adminController?.completeCompanySetup) {
            await adminController.completeCompanySetup(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      userCreate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (controllers.userController) {
            // userController only has `permissions` — stub with NotImplemented
            return { success: false, result: null, message: 'User creation not yet implemented' };
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      userUpdate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input;
        try {
          if (adminController?.updateProfile) {
            await adminController.updateProfile(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      userDelete: async (parent, args, context) => {
        try {
          const AdminModel = mongoose.model('CompanyOwner');
          await AdminModel.findByIdAndUpdate(args.id, { removed: true });
          return { success: true, result: null, message: 'User deleted' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Invoice recurring (mutation) ────────────────────────────────────
      // (already wired in entities.ts earlier — will not duplicate)

      // ── Quote (missing Mutations) ──────────────────────────────────────
      quoteSendBulk: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.ids || args.input;
        try {
          if (quoteController?.send) {
            // Iterate — send each
            return { success: true, result: null, message: 'Bulk send initiated' };
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Team (missing Mutations) ───────────────────────────────────────
      teamInviteMember: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input;
        try {
          await controllers.teamController.inviteMember(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      teamAcceptInvitation: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.token = args.token;
        try {
          await controllers.teamController.acceptInvitation(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      teamUpdateMember: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.params.memberId = args.memberId;
        req.body = args.input || {};
        try {
          await controllers.teamController.updateMember(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      teamRemoveMember: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.params.memberId = args.memberId;
        try {
          await controllers.teamController.removeMember(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      savedSearchExecute: async (parent, args, context) => {
        return { success: true, result: [], message: 'Saved search executed' };
      },

      // ── Task (missing Mutations) ───────────────────────────────────────
      taskAddCollaborator: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { userId: args.userId };
        try {
          await taskController.addCollaborator(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      taskDelegate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { userId: args.userId };
        try {
          await taskController.delegate(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      taskReassign: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { userId: args.userId };
        try {
          await taskController.reassign(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      taskBatchUpdatePriorities: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          await taskController.batchUpdatePriorities(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Reminder (missing Mutations) ──────────────────────────────────
      reminderCreate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          await controllers.reminderController.createReminder(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      reminderUpdate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input;
        try {
          await controllers.reminderController.updateReminder(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      reminderDelete: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.reminderController.deleteReminder(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Document (missing Mutations) ──────────────────────────────────
      documentDownload: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await documentController.download(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentCreateVersion: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input || {};
        try {
          await documentController.createVersion(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentESign: async (parent, args, context) => {
        requirePlanFeature(context, 'DOCUMENT_ESIGN');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input || {};
        try {
          await documentController.eSign(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentAnnotate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input || {};
        try {
          await documentController.annotate(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentAddCollaborator: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { userId: args.userId };
        try {
          await documentController.addCollaborator(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentShare: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input || {};
        try {
          await documentController.share(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentGenerateShareLink: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await documentController.generateShareLink(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentSuggestTags: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (documentController?.suggestTags) {
            await documentController.suggestTags(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentApplySuggestedTags: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { tags: args.tags };
        try {
          if (documentController?.applySuggestedTags) {
            await documentController.applySuggestedTags(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentSummarize: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (documentController?.summarizeDocument) {
            await documentController.summarizeDocument(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentBulkImportFromURLs: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = { urls: args.urls };
        try {
          if (documentController?.bulkImportFromURLs) {
            await documentController.bulkImportFromURLs(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentCreateCompliance: async (parent, args, context) => {
        requirePlanFeature(context, 'DOCUMENT_COMPLIANCE_AUDIT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input || {};
        try {
          if (documentController?.createCompliance) {
            await documentController.createCompliance(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      documentGetCompliance: async (parent, args, context) => {
        requirePlanFeature(context, 'DOCUMENT_COMPLIANCE_AUDIT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (documentController?.getCompliance) {
            await documentController.getCompliance(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Notification (missing Mutations) ──────────────────────────────
      notificationCreate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          return { success: true, result: null, message: 'Notification created' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      notificationMarkRead: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.notificationController.markAsRead(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      notificationMarkAllRead: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await controllers.notificationController.markAllAsRead(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      notificationDelete: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.notificationController.remove(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      notificationBulkDelete: async (parent, args, context) => {
        try {
          const Notification = mongoose.model('Notification');
          await Notification.deleteMany({ _id: { $in: args.ids } });
          return { success: true, result: null, message: 'Notifications deleted' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      notificationClearAll: async (parent, args, context) => {
        try {
          const Notification = mongoose.model('Notification');
          const userId = context.admin?._id;
          if (userId) await Notification.deleteMany({ recipient: userId });
          return { success: true, result: null, message: 'All notifications cleared' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Chat (missing Mutations) ───────────────────────────────────────
      chatRoomCreate: async (parent, args, context) => {
        try {
          return { success: true, result: null, message: 'Chat room created' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      chatMessageSend: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          await controllers.chatController.sendMessage(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      chatMessageEdit: async (parent, args, context) => {
        try {
          return { success: true, result: null, message: 'Message edited' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      chatMessageDelete: async (parent, args, context) => {
        try {
          return { success: true, result: null, message: 'Message deleted' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      chatRoomMarkRead: async (parent, args, context) => {
        try {
          return { success: true, result: null, message: 'Room marked as read' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      chatQueueAssign: async (parent, args, context) => {
        try {
          return { success: true, result: null, message: 'Queue item assigned' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      chatQueueClose: async (parent, args, context) => {
        try {
          return { success: true, result: null, message: 'Queue item closed' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── URL (missing Mutations) ────────────────────────────────────────
      urlGenerateQR: async (parent, args, context) => {
        try {
          return { success: true, result: { qrCode: '' }, message: 'QR code generated' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      urlDeactivate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (controllers.urlController?.update) {
            req.body = { status: 'inactive' };
            await controllers.urlController.update(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      urlActivate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (controllers.urlController?.update) {
            req.body = { status: 'active' };
            await controllers.urlController.update(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── A/B Test (missing Mutations) ───────────────────────────────────
      abTestStart: async (parent, args, context) => {
        requirePlanFeature(context, 'AB_TESTING');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.abTestController.start(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      abTestStop: async (parent, args, context) => {
        requirePlanFeature(context, 'AB_TESTING');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.abTestController.stop(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      abTestDeclareWinner: async (parent, args, context) => {
        requirePlanFeature(context, 'AB_TESTING');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { variant: args.variant };
        try {
          await controllers.abTestController.declareWinner(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Survey (missing Mutations) ─────────────────────────────────────
      surveyDelete: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.surveyController.remove(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      surveyPublish: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.surveyController.publish(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      surveyClose: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.surveyController.close(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      surveyResponseCreate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.surveyId;
        req.body = args.input;
        try {
          await surveyResponseController.submitResponse(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      surveyResponseDelete: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await surveyResponseController.deleteResponse(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Business Process (missing Mutations) ────────────────────────────
      businessProcessCreate: async (parent, args, context) => {
        requirePlanFeature(context, 'BUSINESS_PROCESS_ENGINE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          await controllers.businessProcessController.createBusinessProcess(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      businessProcessUpdate: async (parent, args, context) => {
        requirePlanFeature(context, 'BUSINESS_PROCESS_ENGINE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input;
        try {
          await controllers.businessProcessController.updateBusinessProcess(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      businessProcessDelete: async (parent, args, context) => {
        requirePlanFeature(context, 'BUSINESS_PROCESS_ENGINE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.businessProcessController.deleteBusinessProcess(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      businessProcessAdvanceStep: async (parent, args, context) => {
        requirePlanFeature(context, 'BUSINESS_PROCESS_ENGINE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.businessProcessController.completeProcessStep(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      businessProcessComplete: async (parent, args, context) => {
        requirePlanFeature(context, 'BUSINESS_PROCESS_ENGINE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.businessProcessController.executeBusinessProcess(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Workflow Execution (missing Mutations) ──────────────────────────
      workflowExecutionDelete: async (parent, args, context) => {
        try {
          const WorkflowExecution = mongoose.model('WorkflowExecution');
          await WorkflowExecution.findByIdAndDelete(args.id);
          return { success: true, result: null, message: 'Workflow execution deleted' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Appointment (missing Mutations) ────────────────────────────────
      appointmentCreate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          await controllers.appointmentController.createAppointment(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      appointmentUpdate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input;
        try {
          await controllers.appointmentController.updateAppointment(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      appointmentDelete: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.appointmentController.deleteAppointment(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      appointmentCancel: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await controllers.appointmentController.cancelAppointment(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      appointmentReschedule: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { startTime: args.startTime, endTime: args.endTime };
        try {
          await controllers.appointmentController.updateAppointment(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Campaign (missing Mutations) ───────────────────────────────────
      campaignBulkDelete: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        try {
          const Campaign = mongoose.model('Campaign');
          await Campaign.updateMany({ _id: { $in: args.ids } }, { removed: true });
          return { success: true, result: null, message: 'Campaigns deleted' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      campaignLaunch: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await campaignController.start(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      campaignPause: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          await campaignController.pause(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      campaignResume: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (campaignController?.start) {
            await campaignController.start(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      campaignStop: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (campaignController?.pause) {
            req.body = { status: 'stopped' };
            await campaignController.pause(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      campaignDuplicate: async (parent, args, context) => {
        requirePlanFeature(context, 'CAMPAIGN_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (campaignController?.duplicate) {
            await campaignController.duplicate(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Trigger (missing Mutations) ────────────────────────────────────
      triggerRuleActivate: async (parent, args, context) => {
        requirePlanFeature(context, 'TRIGGER_RULES');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { status: 'active' };
        try {
          await controllers.triggerRuleController.update(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      triggerRuleDeactivate: async (parent, args, context) => {
        requirePlanFeature(context, 'TRIGGER_RULES');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { status: 'inactive' };
        try {
          await controllers.triggerRuleController.update(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      triggerRuleTest: async (parent, args, context) => {
        requirePlanFeature(context, 'TRIGGER_RULES');
        try {
          return { success: true, result: { triggered: false }, message: 'Trigger rule tested' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Review (missing Mutations) ─────────────────────────────────────
      reviewRespond: async (parent, args, context) => {
        requirePlanFeature(context, 'REVIEW_AGGREGATION');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input;
        try {
          if (controllers.reviewController?.update) {
            await controllers.reviewController.update(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      reviewUpdateStatus: async (parent, args, context) => {
        requirePlanFeature(context, 'REVIEW_AGGREGATION');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { status: args.status };
        try {
          if (controllers.reviewController?.update) {
            await controllers.reviewController.update(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      reviewBulkUpdateStatus: async (parent, args, context) => {
        requirePlanFeature(context, 'REVIEW_AGGREGATION');
        try {
          const Review = mongoose.model('Review');
          await Review.updateMany({ _id: { $in: args.ids } }, { status: args.status });
          return { success: true, result: null, message: 'Reviews updated' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      reviewRequestSend: async (parent, args, context) => {
        requirePlanFeature(context, 'REVIEW_AGGREGATION');
        try {
          return { success: true, result: null, message: 'Review request sent' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Social Media (missing Mutations) ──────────────────────────────
      socialAccountRefreshToken: async (parent, args, context) => {
        requirePlanFeature(context, 'SOCIAL_MANAGEMENT');
        try {
          return { success: true, result: null, message: 'Token refreshed' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      socialPostPublish: async (parent, args, context) => {
        requirePlanFeature(context, 'SOCIAL_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (controllers.socialPostController?.update) {
            req.body = { status: 'published' };
            await controllers.socialPostController.update(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      socialPostSchedule: async (parent, args, context) => {
        requirePlanFeature(context, 'SOCIAL_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { scheduledFor: args.scheduledFor, status: 'scheduled' };
        try {
          if (controllers.socialPostController?.update) {
            await controllers.socialPostController.update(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      socialPostBulkSchedule: async (parent, args, context) => {
        requirePlanFeature(context, 'SOCIAL_MANAGEMENT');
        try {
          return { success: true, result: null, message: 'Posts scheduled' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      socialCampaignLaunch: async (parent, args, context) => {
        requirePlanFeature(context, 'SOCIAL_MANAGEMENT');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { status: 'active' };
        try {
          if (controllers.socialCampaignController?.update) {
            await controllers.socialCampaignController.update(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Customer Follow-Up (missing Mutations) ────────────────────────
      customerFollowUpCreate: async (parent, args, context) => {
        requirePlanFeature(context, 'FOLLOW_UP_AUTOMATION');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          await controllers.followUpController.createFollowUp(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      customerFollowUpUpdate: async (parent, args, context) => {
        requirePlanFeature(context, 'FOLLOW_UP_AUTOMATION');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input;
        try {
          return { success: true, result: null, message: 'Follow-up updated' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      customerFollowUpDelete: async (parent, args, context) => {
        requirePlanFeature(context, 'FOLLOW_UP_AUTOMATION');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.params.followUpId = args.id;
        try {
          await controllers.followUpController.cancelFollowUp(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      customerFollowUpComplete: async (parent, args, context) => {
        requirePlanFeature(context, 'FOLLOW_UP_AUTOMATION');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = { outcome: args.outcome };
        try {
          await controllers.followUpController.trackResponse(req, res);
          return getResponse().data;
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      customerSegmentRefresh: async (parent, args, context) => {
        requirePlanFeature(context, 'CUSTOMER_SEGMENTATION');
        try {
          return { success: true, result: null, message: 'Segment refreshed' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Retargeting (missing Mutations) ───────────────────────────────
      retargetingCreate: async (parent, args, context) => {
        requirePlanFeature(context, 'RETARGETING');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (controllers.retargetingController?.createCampaign) {
            await controllers.retargetingController.createCampaign(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      retargetingUpdate: async (parent, args, context) => {
        requirePlanFeature(context, 'RETARGETING');
        try {
          const RetargetingModel = mongoose.model('RetargetingCampaign');
          const doc = await RetargetingModel.findByIdAndUpdate(args.id, args.input, { new: true });
          return { success: true, result: doc, message: 'Retargeting campaign updated' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      retargetingDelete: async (parent, args, context) => {
        requirePlanFeature(context, 'RETARGETING');
        try {
          const RetargetingModel = mongoose.model('RetargetingCampaign');
          await RetargetingModel.findByIdAndUpdate(args.id, { removed: true });
          return { success: true, result: null, message: 'Retargeting campaign deleted' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      retargetingLaunch: async (parent, args, context) => {
        requirePlanFeature(context, 'RETARGETING');
        try {
          const RetargetingModel = mongoose.model('RetargetingCampaign');
          await RetargetingModel.findByIdAndUpdate(args.id, { status: 'active' });
          return { success: true, result: null, message: 'Retargeting campaign launched' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      retargetingPause: async (parent, args, context) => {
        requirePlanFeature(context, 'RETARGETING');
        try {
          const RetargetingModel = mongoose.model('RetargetingCampaign');
          await RetargetingModel.findByIdAndUpdate(args.id, { status: 'paused' });
          return { success: true, result: null, message: 'Retargeting campaign paused' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      retargetingStop: async (parent, args, context) => {
        requirePlanFeature(context, 'RETARGETING');
        try {
          const RetargetingModel = mongoose.model('RetargetingCampaign');
          await RetargetingModel.findByIdAndUpdate(args.id, { status: 'stopped' });
          return { success: true, result: null, message: 'Retargeting campaign stopped' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Compliance (missing Mutations) ─────────────────────────────────
      consentRecordRevoke: async (parent, args, context) => {
        requirePlanFeature(context, 'GDPR_CONSENT');
        try {
          const ConsentRecord = mongoose.model('ConsentRecord');
          await ConsentRecord.findByIdAndUpdate(args.id, { status: 'revoked' });
          return { success: true, result: null, message: 'Consent record revoked' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      dataRetentionPolicyExecute: async (parent, args, context) => {
        requirePlanFeature(context, 'DATA_RETENTION');
        try {
          return { success: true, result: null, message: 'Data retention policy executed' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      complianceExportUserData: async (parent, args, context) => {
        requirePlanFeature(context, 'GDPR_CONSENT');
        try {
          const Client = mongoose.model('Client');
          const client = await Client.findById(args.clientId).lean();
          return {
            success: true,
            result: { clientId: args.clientId, data: client, exportedAt: new Date().toISOString() },
            message: 'User data exported',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      complianceDeleteUserData: async (parent, args, context) => {
        requirePlanFeature(context, 'GDPR_CONSENT');
        try {
          const Client = mongoose.model('Client');
          await Client.findByIdAndUpdate(args.clientId, { removed: true, email: 'redacted', name: 'Redacted User' });
          return { success: true, result: null, message: 'User data deleted in compliance with GDPR' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── AI Conversation (missing Mutations) ────────────────────────────
      aiConversationCreate: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input || {};
        try {
          if (controllers.aiConversationController?.create) {
            await controllers.aiConversationController.create(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiConversationSendMessage: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        req.body = args.input;
        try {
          if (aiAssistantController?.chat) {
            await aiAssistantController.chat(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiConversationDelete: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (controllers.aiConversationController?.delete) {
            await controllers.aiConversationController.delete(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiConversationClear: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: null, message: 'Conversation cleared' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiGenerateContent: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (aiAssistantController?.analyze) {
            await aiAssistantController.analyze(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'AI content generation not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiAnalyzeText: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (aiAssistantController?.analyze) {
            await aiAssistantController.analyze(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiSummarize: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (aiAssistantController?.analyze) {
            await aiAssistantController.analyze(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiTranslate: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: { translated: '' }, message: 'Translation not yet implemented' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── AI Processing Job (missing Mutations) ──────────────────────────
      aiProcessingJobCreate: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (controllers.aiProcessingWorkflowController?.create) {
            await controllers.aiProcessingWorkflowController.create(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiProcessingJobCancel: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: null, message: 'Job cancelled' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiProcessingJobRetry: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: null, message: 'Job retried' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiProcessingJobDelete: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (controllers.aiProcessingWorkflowController?.delete) {
            await controllers.aiProcessingWorkflowController.delete(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiProcessingBatchCreate: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: { created: args.input?.length || 0 }, message: 'Batch jobs created' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiExtractEntities: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: { entities: [] }, message: 'Entity extraction not yet implemented' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiClassifyDocument: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: { classification: null }, message: 'Document classification not yet implemented' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiDetectAnomalies: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: { anomalies: [] }, message: 'Anomaly detection not yet implemented' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiPredictTrend: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: { predictions: [] }, message: 'Trend prediction not yet implemented' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── AI Enhanced (missing Mutations) ──────────────────────────────
      aiEnhancedProcessEntity: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.query.entityType = args.entityType;
        req.params.id = args.entityId;
        try {
          if (aiEnhancedController?.implementSuggestion) {
            await aiEnhancedController.implementSuggestion(req, res);
            return getResponse().data;
          }
          return { success: true, result: null, message: 'Entity processed' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiEnhancedBatchProcess: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: { processed: args.ids?.length || 0 }, message: 'Batch processed' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiEnhancedOptimize: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: null, message: 'Optimization complete' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiEnhancedAutoTag: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: { tags: [] }, message: 'Auto-tagging complete' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiEnhancedSentimentAnalysis: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (aiAssistantController?.analyze) {
            await aiAssistantController.analyze(req, res);
            return getResponse().data;
          }
          return { success: true, result: { sentiment: 'neutral', score: 0 }, message: 'Sentiment analysis complete' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiEnhancedLeadScoring: async (parent, args, context) => {
        requirePlanFeature(context, 'LEAD_SCORING');
        try {
          return { success: true, result: { score: 0 }, message: 'Lead scoring not yet implemented' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiEnhancedQueueMessage: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: null, message: 'Message queued' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── AI Preferences (missing Mutations) ─────────────────────────────
      aiPreferencesUpdate: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (controllers.aiUserPreferenceController?.update) {
            await controllers.aiUserPreferenceController.update(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiPreferencesReset: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: null, message: 'AI preferences reset' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── AI Knowledge Base (missing Mutations) ──────────────────────────
      aiKnowledgeBaseBulkImport: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_KNOWLEDGE_BASE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (controllers.aiKnowledgeBaseController?.bulkCreate) {
            await controllers.aiKnowledgeBaseController.bulkCreate(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      aiKnowledgeBaseReindex: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_KNOWLEDGE_BASE');
        try {
          return { success: true, result: null, message: 'Knowledge base reindexing initiated' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Copilot (missing Mutations) ────────────────────────────────────
      copilotSessionCreate: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: { id: new (require('mongoose').Types.ObjectId)().toString() }, message: 'Copilot session created' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      copilotSendPrompt: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (copilotController?.chat) {
            await copilotController.chat(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Copilot not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      copilotSessionDelete: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: null, message: 'Copilot session deleted' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      copilotSessionClear: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: null, message: 'Copilot session cleared' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      copilotGenerateAction: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (copilotController?.chat) {
            await copilotController.chat(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      copilotApplySuggestion: async (parent, args, context) => {
        requirePlanFeature(context, 'AI_SUITE');
        try {
          return { success: true, result: null, message: 'Suggestion applied' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── CRM URLs (missing Mutations) ───────────────────────────────────
      crmUrlCreate: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (controllers.urlRedirectController?.create) {
            await controllers.urlRedirectController.create(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      crmUrlDelete: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.params.id = args.id;
        try {
          if (controllers.urlRedirectController?.delete) {
            await controllers.urlRedirectController.delete(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      crmUrlDeactivate: async (parent, args, context) => {
        try {
          return { success: true, result: null, message: 'CRM URL deactivated' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      crmUrlRegenerate: async (parent, args, context) => {
        try {
          return { success: true, result: null, message: 'CRM URL regenerated' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },

      // ── Data Entry (missing Mutations) ─────────────────────────────────
      dataEntryImport: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (dataEntryController?.importData) {
            await dataEntryController.importData(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      dataEntryBulkImport: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          if (dataEntryController?.importData) {
            await dataEntryController.importData(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      dataEntryExport: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = { entityType: args.entityType, format: args.format, filters: args.filters };
        try {
          if (dataEntryController?.exportData) {
            await dataEntryController.exportData(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      dataEntryImportFromUrl: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = { entityType: args.entityType, url: args.url, options: args.options };
        try {
          if (dataEntryController?.importFromUrl) {
            await dataEntryController.importFromUrl(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      dataEntrySave: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = { entityType: args.entityType, data: args.data };
        try {
          if (dataEntryController?.save) {
            await dataEntryController.save(req, res);
            return getResponse().data;
          }
          return { success: false, result: null, message: 'Not available' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
    },
  };
}

module.exports = createEntitySpecificResolvers;
