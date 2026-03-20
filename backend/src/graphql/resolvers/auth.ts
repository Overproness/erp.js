// @ts-nocheck
const { wrapController, createReqRes } = require('./crud');

function createAuthResolvers(authController) {
  return {
    Query: {
      verifyToken: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          await authController.isValidAuthToken(req, res, () => {});
          return {
            success: true,
            result: req.admin || null,
            message: 'Token is valid',
          };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
    },
    Mutation: {
      login: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          const loginHandler = require('../../controllers/coreControllers/adminAuth/login');
          await loginHandler(req, res);
          return getResponse().data || { success: false, result: null, message: 'Login failed' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      register: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          const registerHandler = require('../../controllers/coreControllers/adminAuth/register');
          await registerHandler(req, res);
          return (
            getResponse().data || { success: false, result: null, message: 'Registration failed' }
          );
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      forgetPassword: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          const forgetPasswordHandler = require('../../controllers/coreControllers/adminAuth/forgetPassword');
          await forgetPasswordHandler(req, res);
          return getResponse().data || { success: false, result: null, message: 'Failed' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      resetPassword: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        req.body = args.input;
        try {
          const resetPasswordHandler = require('../../controllers/coreControllers/adminAuth/resetPassword');
          await resetPasswordHandler(req, res);
          return getResponse().data || { success: false, result: null, message: 'Failed' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
      logout: async (parent, args, context) => {
        const { req, res, getResponse } = createReqRes(args, context);
        try {
          const logoutHandler = require('../../controllers/coreControllers/adminAuth/logout');
          await logoutHandler(req, res);
          return getResponse().data || { success: false, result: null, message: 'Logout failed' };
        } catch (error) {
          return { success: false, result: null, message: error.message };
        }
      },
    },
  };
}

module.exports = createAuthResolvers;
