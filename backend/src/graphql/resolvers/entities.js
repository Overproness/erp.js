const { wrapController, createReqRes } = require('./crud');

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
  } = controllers;

  return {
    Query: {
      // Statistics
      ...(statisticsController?.dashboard && {
        statisticsDashboard: wrapController(statisticsController.dashboard),
      }),
      ...(statisticsController?.overview && {
        statisticsOverview: wrapController(statisticsController.overview),
      }),

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
    },
  };
}

module.exports = createEntitySpecificResolvers;
