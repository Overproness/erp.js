// @ts-nocheck
const login = require('./login');
const register = require('./register'); // Add this line
const logout = require('./logout');
const isValidAuthToken = require('./isValidAuthToken');
const forgetPassword = require('./forgetPassword');
const resetPassword = require('./resetPassword');
const verifyToken = require('./verifyToken');

const createAuthMiddleware = (userModel) => {
  const authMethods = {};

  // Add register method
  authMethods.register = (req, res) =>
    register(req, res, {
      userModel,
    });

  authMethods.isValidAuthToken = (req, res, next) => {
    console.log('=== createAuthMiddleware.isValidAuthToken wrapper called ===');
    return isValidAuthToken(req, res, next, {
      userModel,
    });
  };

  authMethods.login = (req, res) =>
    login(req, res, {
      userModel,
    });

  authMethods.forgetPassword = (req, res) =>
    forgetPassword(req, res, {
      userModel,
    });

  authMethods.resetPassword = (req, res) =>
    resetPassword(req, res, {
      userModel,
    });

  authMethods.logout = (req, res) =>
    logout(req, res, {
      userModel,
    });

  authMethods.verifyToken = (req, res) =>
    verifyToken(req, res, {
      userModel,
    });

  return authMethods;
};

module.exports = createAuthMiddleware;
