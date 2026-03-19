const mongoose = require('mongoose');

// Helper to create a mock Express req/res from GraphQL context
function createReqRes(args, context) {
  const req = {
    params: {},
    query: {},
    body: {},
    headers: context.req?.headers || {},
    admin: context.admin,
    companyID: context.admin?.companyID,
    ...context,
  };

  let responseData = null;
  let statusCode = 200;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    send(data) {
      responseData = data;
      return res;
    },
  };

  return {
    req,
    res,
    getResponse() {
      return { statusCode, data: responseData };
    },
  };
}

// Wraps an Express controller method to work with GraphQL
function wrapController(controllerMethod) {
  return async (parent, args, context) => {
    const { req, res, getResponse } = createReqRes(args, context);

    // Set params and body from args
    if (args.id) req.params.id = args.id;
    if (args.input) req.body = typeof args.input === 'string' ? JSON.parse(args.input) : args.input;
    if (args.pagination) {
      req.query.page = args.pagination.page;
      req.query.items = args.pagination.limit;
      req.query.sortBy = args.pagination.sortBy;
      req.query.sortValue = args.pagination.sortValue;
    }
    if (args.filter) {
      args.filter.forEach((f) => {
        req.query[f.field] = f.value;
      });
    }

    try {
      await controllerMethod(req, res);
      const response = getResponse();
      return response.data || { success: false, message: 'No response from controller' };
    } catch (error) {
      return {
        success: false,
        result: null,
        message: error.message || 'Internal server error',
      };
    }
  };
}

// Generates standard CRUD resolvers for a given entity
function generateCRUDResolvers(entityName, controller) {
  if (!controller) return { Query: {}, Mutation: {} };

  const queries = {};
  const mutations = {};

  // Standard Query operations
  if (controller.read) {
    queries[`${entityName}Read`] = wrapController(controller.read);
  }
  if (controller.list || controller.paginatedList) {
    queries[`${entityName}List`] = wrapController(controller.list || controller.paginatedList);
  }
  if (controller.listAll) {
    queries[`${entityName}ListAll`] = wrapController(controller.listAll);
  }
  if (controller.search) {
    queries[`${entityName}Search`] = async (parent, args, context) => {
      const { req, res, getResponse } = createReqRes(args, context);
      req.query.q = args.input?.q;
      req.query.page = args.input?.page;
      req.query.items = args.input?.limit;
      try {
        await controller.search(req, res);
        return getResponse().data || { items: [], pagination: null };
      } catch (error) {
        return { items: [], pagination: null };
      }
    };
  }
  if (controller.filter) {
    queries[`${entityName}Filter`] = wrapController(controller.filter);
  }
  if (controller.summary) {
    queries[`${entityName}Summary`] = wrapController(controller.summary);
  }

  // Standard Mutation operations
  if (controller.create) {
    mutations[`${entityName}Create`] = wrapController(controller.create);
  }
  if (controller.update) {
    mutations[`${entityName}Update`] = async (parent, args, context) => {
      const { req, res, getResponse } = createReqRes(args, context);
      req.params.id = args.id;
      req.body = typeof args.input === 'string' ? JSON.parse(args.input) : args.input;
      try {
        await controller.update(req, res);
        return getResponse().data || { success: false, message: 'Update failed' };
      } catch (error) {
        return { success: false, result: null, message: error.message };
      }
    };
  }
  if (controller.delete) {
    mutations[`${entityName}Delete`] = async (parent, args, context) => {
      const { req, res, getResponse } = createReqRes(args, context);
      req.params.id = args.id;
      try {
        await controller.delete(req, res);
        return getResponse().data || { success: false, message: 'Delete failed' };
      } catch (error) {
        return { success: false, result: null, message: error.message };
      }
    };
  }
  if (controller.bulkCreate) {
    mutations[`${entityName}BulkCreate`] = async (parent, args, context) => {
      const { req, res, getResponse } = createReqRes(args, context);
      req.body = { items: args.inputs };
      try {
        await controller.bulkCreate(req, res);
        return getResponse().data;
      } catch (error) {
        return { success: false, result: null, message: error.message };
      }
    };
  }
  if (controller.bulkUpdate) {
    mutations[`${entityName}BulkUpdate`] = wrapController(controller.bulkUpdate);
  }
  if (controller.bulkDelete) {
    mutations[`${entityName}BulkDelete`] = async (parent, args, context) => {
      const { req, res, getResponse } = createReqRes(args, context);
      req.body = { ids: args.input.ids };
      try {
        await controller.bulkDelete(req, res);
        return getResponse().data;
      } catch (error) {
        return { success: false, result: null, message: error.message };
      }
    };
  }

  return { Query: queries, Mutation: mutations };
}

module.exports = { generateCRUDResolvers, wrapController, createReqRes };
