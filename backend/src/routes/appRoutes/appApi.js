// const express = require('express');
// const { catchErrors } = require('@/handlers/errorHandlers');
// const rateLimitMiddleware = require('@/middlewares/rateLimitMiddleware');
// const router = express.Router();

// const appControllers = require('@/controllers/appControllers');
// const { routesList } = require('@/models/utils');

// const routerApp = (entity, controller) => {
//   // Check if controller exists and has the required methods
//   if (!controller) {
//     console.error(`Controller for ${entity} is undefined`);
//     return;
//   }

//   // Skip document and team entities as we're handling them separately with their own route files
//   if (entity === 'document' || entity === 'team') {
//     return;
//   }

//   // CLIENT SEARCH ROUTE - MOVED TO HIGHEST PRIORITY TO AVOID CONFLICTS
//   if (entity === 'client') {
//     console.log('=== REGISTERING CLIENT SEARCH ROUTE AT HIGHEST PRIORITY ===');
//     router
//       .route(`/${entity}/search`)
//       .get(rateLimitMiddleware.createRateLimit('search'), catchErrors(controller['search']));
//     console.log(`Registered CLIENT search route: /${entity}/search`);
//   }

//   // Register all specific routes FIRST before parameterized routes to avoid conflicts

//   // Special routes for non-client entities
//   if (entity !== 'client') {
//     router
//       .route(`/${entity}/search`)
//       .get(controller['search']);
//     console.log(`Registered search route: /${entity}/search with controller:`, typeof controller['search']);
//   }

//   router.route(`/${entity}/list`).get(catchErrors(controller['list']));
//   router.route(`/${entity}/listAll`).get(catchErrors(controller['listAll']));
//   router.route(`/${entity}/filter`).get(catchErrors(controller['filter']));
//   console.log(`Registered filter route: /${entity}/filter with controller:`, typeof controller['filter']);

//   // Add root-level list route (e.g., /api/client for listing clients)
//   router
//     .route(`/${entity}`)
//     .get(rateLimitMiddleware.createRateLimit('search'), catchErrors(controller['list']));
//   // Add root-level create route (e.g., POST /api/invoice) that forwards to create controller
//   router
//     .route(`/${entity}`)
//     .post(rateLimitMiddleware.createRateLimit('create'), catchErrors(controller['create']));

//   router
//     .route(`/${entity}/create`)
//     .post(rateLimitMiddleware.createRateLimit('create'), catchErrors(controller['create']));

//   router.route(`/${entity}/read/:id`).get(rateLimitMiddleware.apiRateLimit, catchErrors(controller['read']));
//   router.route(`/${entity}/update/:id`).patch(rateLimitMiddleware.apiRateLimit, catchErrors(controller['update']));
//   router.route(`/${entity}/delete/:id`).delete(rateLimitMiddleware.apiRateLimit, catchErrors(controller['delete']));

//   // Special handling for summary routes - very important for tests!
//   if (controller['summary']) {
//     router.route(`/${entity}/summary`).get(catchErrors(controller['summary']));
//     console.log(`✅ Registered summary route: /${entity}/summary with controller:`, typeof controller['summary']);
//   } else {
//     console.error(`❌ ERROR: Missing summary controller for ${entity}`);
//   }

//   // Add bulk update route for entities that support it
//   if (controller['bulkUpdate']) {
//     router.route(`/${entity}/bulk-update`).patch(catchErrors(controller['bulkUpdate']));
//   }

//   // Add export route for entities that support it
//   if (controller['export']) {
//     console.log(`✅ Registered export route: /${entity}/export with controller: ${typeof controller['export']}`);
//     router.route(`/${entity}/export`).get(catchErrors(controller['export']));
//   } else if (entity === 'client') {
//     console.log(`❌ No export method found for client controller`);
//   }

//   if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
//     router.route(`/${entity}/mail`).post(catchErrors(controller['mail']));
//   }

//   if (entity === 'quote') {
//     router.route(`/${entity}/convert/:id`).get(catchErrors(controller['convert']));
//   }

//   // Add direct ID route (e.g., GET /api/client/123) - MOVED TO END TO AVOID CONFLICTS WITH SPECIFIC ROUTES
//   router.route(`/${entity}/:id`).get(rateLimitMiddleware.apiRateLimit, catchErrors(controller['read']));
// };

// // console.log('🚀 ~ routesList.forEach ~ routesList:', routesList);
// routesList.forEach(({ entity, controllerName }) => {
//   console.log(`Setting up routes for ${entity} with controller ${controllerName}`);
//   const controller = appControllers[controllerName];

//   if (!controller) {
//     console.error(`Controller ${controllerName} not found in appControllers`);
//   } else {
//     if (entity === 'client') {
//       console.log('CLIENT CONTROLLER METHODS:', Object.keys(controller));
//       console.log('CLIENT CONTROLLER search method:', typeof controller['search']);
//       console.log('CLIENT CONTROLLER filter method:', typeof controller['filter']);
//     }
//     routerApp(entity, controller);
//   }
// });

// module.exports = router;

const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const rateLimitMiddleware = require('@/middlewares/rateLimitMiddleware');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');

const routerApp = (entity, controller) => {
  // Check if controller exists and has the required methods
  if (!controller) {
    console.error(`Controller for ${entity} is undefined`);
    return;
  }

  // Verify controller has required methods
  const requiredMethods = ['list', 'listAll', 'create', 'read', 'update', 'delete'];
  const missingMethods = requiredMethods.filter(
    (method) => typeof controller[method] !== 'function'
  );

  if (missingMethods.length > 0) {
    console.error(`Controller for ${entity} is missing methods: ${missingMethods.join(', ')}`);
    return;
  }

  // Skip document and team entities as we're handling them separately with their own route files
  if (entity === 'document' || entity === 'team') {
    return;
  }

  // CLIENT SEARCH ROUTE - MOVED TO HIGHEST PRIORITY TO AVOID CONFLICTS
  if (entity === 'client') {
    console.log('=== REGISTERING CLIENT SEARCH ROUTE AT HIGHEST PRIORITY ===');
    router
      .route(`/${entity}/search`)
      .get(rateLimitMiddleware.createRateLimit('search'), catchErrors(controller['search']));
    console.log(`Registered CLIENT search route: /${entity}/search`);
  }

  // Register all specific routes FIRST before parameterized routes to avoid conflicts

  // Special routes for non-client entities
  if (entity !== 'client') {
    router.route(`/${entity}/search`).get(controller['search']);
    console.log(
      `Registered search route: /${entity}/search with controller:`,
      typeof controller['search']
    );
  }

  router.route(`/${entity}/list`).get(catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(catchErrors(controller['filter']));
  console.log(
    `Registered filter route: /${entity}/filter with controller:`,
    typeof controller['filter']
  );

  // Add root-level list route (e.g., /api/client for listing clients)
  router
    .route(`/${entity}`)
    .get(
      rateLimitMiddleware.createRateLimit('search'),
      
      catchErrors(controller['list'])
    );
  // Add root-level create route (e.g., POST /api/invoice) that forwards to create controller
  router
    .route(`/${entity}`)
    .post(
      rateLimitMiddleware.createRateLimit('create'),
      
      catchErrors(controller['create'])
    );

  router
    .route(`/${entity}/create`)
    .post(
      rateLimitMiddleware.createRateLimit('create'),
      
      catchErrors(controller['create'])
    );

  router
    .route(`/${entity}/read/:id`)
    .get(rateLimitMiddleware.apiRateLimit, catchErrors(controller['read']));
  router
    .route(`/${entity}/update/:id`)
    .patch(
      rateLimitMiddleware.apiRateLimit,
      
      catchErrors(controller['update'])
    );
  router
    .route(`/${entity}/delete/:id`)
    .delete(
      rateLimitMiddleware.apiRateLimit,
      
      catchErrors(controller['delete'])
    );

  // Special handling for summary routes - very important for tests!
  if (controller['summary']) {
    router
      .route(`/${entity}/summary`)
      .get(catchErrors(controller['summary']));
    console.log(
      `✅ Registered summary route: /${entity}/summary with controller:`,
      typeof controller['summary']
    );
  } else {
    console.error(`❌ ERROR: Missing summary controller for ${entity}`);
  }

  // Add bulk update route for entities that support it
  if (controller['bulkUpdate']) {
    router
      .route(`/${entity}/bulk-update`)
      .patch(catchErrors(controller['bulkUpdate']));
  }

  // Add export route for entities that support it
  if (controller['export']) {
    console.log(
      `✅ Registered export route: /${entity}/export with controller: ${typeof controller[
        'export'
      ]}`
    );
    router.route(`/${entity}/export`).get(catchErrors(controller['export']));
  } else if (entity === 'client') {
    console.log(`❌ No export method found for client controller`);
  }

  if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(catchErrors(controller['mail']));
  }

  if (entity === 'quote') {
    router
      .route(`/${entity}/convert/:id`)
      .get(catchErrors(controller['convert']));
  }

  // Add direct ID route (e.g., GET /api/client/123) - MOVED TO END TO AVOID CONFLICTS WITH SPECIFIC ROUTES
  router
    .route(`/${entity}/:id`)
    .get(rateLimitMiddleware.apiRateLimit, catchErrors(controller['read']));
};

// console.log('🚀 ~ routesList.forEach ~ routesList:', routesList);
routesList.forEach(({ entity, controllerName }) => {
  console.log(`Setting up routes for ${entity} with controller ${controllerName}`);
  const controller = appControllers[controllerName];

  if (!controller) {
    console.error(`Controller ${controllerName} not found in appControllers`);
    return; // Skip this controller entirely
  }

  if (entity === 'client') {
    console.log('CLIENT CONTROLLER METHODS:', Object.keys(controller));
    console.log('CLIENT CONTROLLER search method:', typeof controller['search']);
    console.log('CLIENT CONTROLLER filter method:', typeof controller['filter']);
  }
  routerApp(entity, controller);
});

// Include statistics routes
const statisticsRoutes = require('./statisticsRoutes');
router.use('/stats', statisticsRoutes);

module.exports = router;
