import { GraphQLContext } from '../../types/context';

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
  const isTeamUser = Boolean((context.admin as any)?.isUser);
  const req: MockRequest = {
    params: {},
    query: {},
    body: {},
    headers: context.req?.headers || {},
    ...context,
    admin: context.admin,
    plan: (context as any).plan ?? 'starter',
    subscription: (context as any).subscription ?? null,
    companyOwner: context.admin && !isTeamUser ? {
      _id: context.admin._id,
      companyID: context.admin.companyID,
      email: (context.admin as any).email,
    } : undefined,
    user: context.admin && isTeamUser ? {
      _id: context.admin._id,
      companyID: context.admin.companyID,
      permissions: (context.admin as any).permissions || {
        canCreateClients: true,
        canViewClients: true,
        canUpdateClients: true,
        canDeleteClients: true,
      },
    } : undefined,
    userPermissions: (context.admin as any)?.permissions,
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

function normalizePagination(rawPag: any, itemsLength: number = 0) {
  if (!rawPag && itemsLength === 0) return null;
  const page = parseInt(rawPag?.page ?? rawPag?.current ?? 1, 10) || 1;
  const count = parseInt(rawPag?.count ?? rawPag?.total ?? itemsLength, 10) || itemsLength;
  const limit = parseInt(rawPag?.limit ?? rawPag?.pageSize ?? rawPag?.items ?? 10, 10) || 10;
  const pages = parseInt(rawPag?.pages ?? rawPag?.totalPages ?? Math.ceil(count / limit) ?? 1, 10) || 1;
  const total = parseInt(rawPag?.total ?? rawPag?.count ?? count, 10) || count;
  return { page, count, pages, total };
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
    } else {
      // Handle flat pagination args (used by typed schemas)
      if (args.page != null) req.query.page = args.page;
      if (args.limit != null) req.query.items = args.limit;
      if (args.sortBy != null) req.query.sortBy = args.sortBy;
      if (args.sortValue != null) req.query.sortValue = args.sortValue;
    }
    if (args.filter) {
      args.filter.forEach((f: { field: string; value: string }) => {
        req.query[f.field] = f.value;
      });
    }

    try {
      await controllerMethod(req, res);
      const response = getResponse();
      const data = response.data || { success: false, message: 'No response from controller' };
      // Controllers return result as { items: [...], pagination: {...} }
      // but ListResponse expects result to be [JSON]. Unwrap items array only for paginated lists.
      if (
        data.result &&
        !Array.isArray(data.result) &&
        Array.isArray(data.result.items) &&
        Boolean(data.result.pagination || data.pagination)
      ) {
        return {
          success: data.success,
          result: data.result.items,
          pagination: normalizePagination(data.result.pagination || data.pagination, data.result.items.length),
          message: data.message,
        };
      }
      if (data.pagination || (data.result && !Array.isArray(data.result) && data.result.pagination)) {
        const rawPag = data.pagination || data.result?.pagination;
        const items = Array.isArray(data.result) ? data.result : Array.isArray(data.result?.items) ? data.result.items : [];
        return {
          ...data,
          result: items.length > 0 || Array.isArray(data.result) ? items : data.result,
          pagination: normalizePagination(rawPag, items.length),
        };
      }
      return data;
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
      req.query.q = args.q;
      req.query.fields = args.fields;
      req.query.page = args.page;
      req.query.items = args.limit;
      try {
        await controller.search!(req, res);
        const data = getResponse().data;
        if (!data) return { success: false, result: [], message: 'No response' };
        // The search controller returns result as { items: [...], pagination: {...} }
        // but ListResponse expects result to be [JSON]. Unwrap items array only for paginated lists.
        if (
          data.result &&
          !Array.isArray(data.result) &&
          Array.isArray(data.result.items) &&
          Boolean(data.result.pagination || data.pagination)
        ) {
          return {
            success: data.success,
            result: data.result.items,
            pagination: normalizePagination(data.result.pagination || data.pagination, data.result.items.length),
            message: data.message,
          };
        }
        if (data.pagination) {
          const itemsLen = Array.isArray(data.result) ? data.result.length : 0;
          return {
            ...data,
            pagination: normalizePagination(data.pagination, itemsLen),
          };
        }
        return data;
      } catch (error: any) {
        return { success: false, result: [], message: error.message || 'Search failed' };
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

export { createReqRes, generateCRUDResolvers, wrapController };
export type { CRUDController, MockRequest, MockResponse, ReqResResult };

