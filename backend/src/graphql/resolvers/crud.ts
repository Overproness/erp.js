import mongoose from 'mongoose';
import { GraphQLContext } from '../../types/context';
import { MutationResponse } from '../../types/common';

interface MockRequest {
  params: Record<string, any>;
  query: Record<string, any>;
  body: Record<string, any>;
  headers: Record<string, any>;
  admin: any;
  companyID: string;
  [key: string]: any;
}

interface MockResponse {
  status(code: number): MockResponse;
  json(data: any): MockResponse;
  send(data: any): MockResponse;
}

interface ReqResResult {
  req: MockRequest;
  res: MockResponse;
  getResponse(): { statusCode: number; data: any };
}

function createReqRes(args: any, context: GraphQLContext): ReqResResult {
  const req: MockRequest = {
    params: {},
    query: {},
    body: {},
    headers: context.req?.headers || {},
    ...context,
    admin: context.admin,
    companyID: context.admin?.companyID || '',
  };

  let responseData: any = null;
  let statusCode = 200;

  const res: MockResponse = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    send(data: any) {
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

function wrapController(controllerMethod: Function) {
  return async (parent: any, args: any, context: GraphQLContext) => {
    const { req, res, getResponse } = createReqRes(args, context);

    if (args.id) req.params.id = args.id;
    if (args.input) req.body = typeof args.input === 'string' ? JSON.parse(args.input) : args.input;
    if (args.pagination) {
      req.query.page = args.pagination.page;
      req.query.items = args.pagination.limit;
      req.query.sortBy = args.pagination.sortBy;
      req.query.sortValue = args.pagination.sortValue;
    }
    if (args.filter) {
      args.filter.forEach((f: { field: string; value: string }) => {
        req.query[f.field] = f.value;
      });
    }

    try {
      await controllerMethod(req, res);
      const response = getResponse();
      return response.data || { success: false, message: 'No response from controller' };
    } catch (error: any) {
      return {
        success: false,
        result: null,
        message: error.message || 'Internal server error',
      };
    }
  };
}

interface CRUDController {
  read?: Function;
  list?: Function;
  paginatedList?: Function;
  listAll?: Function;
  search?: Function;
  filter?: Function;
  summary?: Function;
  create?: Function;
  update?: Function;
  delete?: Function;
  bulkCreate?: Function;
  bulkUpdate?: Function;
  bulkDelete?: Function;
}

function generateCRUDResolvers(entityName: string, controller: CRUDController) {
  if (!controller) return { Query: {}, Mutation: {} };

  const queries: Record<string, Function> = {};
  const mutations: Record<string, Function> = {};

  if (controller.read) {
    queries[`${entityName}Read`] = wrapController(controller.read);
  }
  if (controller.list || controller.paginatedList) {
    queries[`${entityName}List`] = wrapController(controller.list || controller.paginatedList!);
  }
  if (controller.listAll) {
    queries[`${entityName}ListAll`] = wrapController(controller.listAll);
  }
  if (controller.search) {
    queries[`${entityName}Search`] = async (parent: any, args: any, context: GraphQLContext) => {
      const { req, res, getResponse } = createReqRes(args, context);
      req.query.q = args.input?.q;
      req.query.page = args.input?.page;
      req.query.items = args.input?.limit;
      try {
        await controller.search!(req, res);
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

  if (controller.create) {
    mutations[`${entityName}Create`] = wrapController(controller.create);
  }
  if (controller.update) {
    mutations[`${entityName}Update`] = async (parent: any, args: any, context: GraphQLContext) => {
      const { req, res, getResponse } = createReqRes(args, context);
      req.params.id = args.id;
      req.body = typeof args.input === 'string' ? JSON.parse(args.input) : args.input;
      try {
        await controller.update!(req, res);
        return getResponse().data || { success: false, message: 'Update failed' };
      } catch (error: any) {
        return { success: false, result: null, message: error.message };
      }
    };
  }
  if (controller.delete) {
    mutations[`${entityName}Delete`] = async (parent: any, args: any, context: GraphQLContext) => {
      const { req, res, getResponse } = createReqRes(args, context);
      req.params.id = args.id;
      try {
        await controller.delete!(req, res);
        return getResponse().data || { success: false, message: 'Delete failed' };
      } catch (error: any) {
        return { success: false, result: null, message: error.message };
      }
    };
  }
  if (controller.bulkCreate) {
    mutations[`${entityName}BulkCreate`] = async (parent: any, args: any, context: GraphQLContext) => {
      const { req, res, getResponse } = createReqRes(args, context);
      req.body = { items: args.inputs };
      try {
        await controller.bulkCreate!(req, res);
        return getResponse().data;
      } catch (error: any) {
        return { success: false, result: null, message: error.message };
      }
    };
  }
  if (controller.bulkUpdate) {
    mutations[`${entityName}BulkUpdate`] = wrapController(controller.bulkUpdate);
  }
  if (controller.bulkDelete) {
    mutations[`${entityName}BulkDelete`] = async (parent: any, args: any, context: GraphQLContext) => {
      const { req, res, getResponse } = createReqRes(args, context);
      req.body = { ids: args.input.ids };
      try {
        await controller.bulkDelete!(req, res);
        return getResponse().data;
      } catch (error: any) {
        return { success: false, result: null, message: error.message };
      }
    };
  }

  return { Query: queries, Mutation: mutations };
}

export { generateCRUDResolvers, wrapController, createReqRes };
export type { CRUDController, MockRequest, MockResponse, ReqResResult };
