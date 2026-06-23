// @ts-nocheck



import { catchErrors } from '@/handlers/errorHandlers';
import mongoose from 'mongoose';
import ABTest from '@/models/appModels/ABTest';
import URL from '@/models/appModels/URL';
import URLClick from '@/models/appModels/URLClick';
import createCRUDController from '@/controllers/middlewaresControllers/createCRUDController';
import abTestService from '@/services/abTestService';
const Model = mongoose.model('ABTest');

// Create base CRUD controller
const crudController = createCRUDController('ABTest');

// Add this helper at the top after imports
function getOwnerId(req) {
  return (
    req.companyOwner?._id?.toString() ||
    req.admin?._id?.toString() ||
    req.user?._id?.toString() ||
    req.companyOwner?.id?.toString() ||
    req.admin?.id?.toString() ||
    req.user?.id?.toString() ||
    null
  );
}

// Create new A/B test
const create = catchErrors(async (req, res) => {
  const {
    testName,
    description,
    hypothesis,
    controlUrl,
    variants,
    controlTrafficAllocation,
    testType,
    startDate,
    endDate,
    duration,
    primaryMetric,
    secondaryMetrics,
    conversionGoal,
    minimumSampleSize,
    confidenceLevel,
    minimumDetectableEffect,
    targetAudience,
    excludeBots,
    excludeInternalTraffic,
    qualityThreshold,
    notes
  } = req.body;

  const ownerId = getOwnerId(req);

  // Validate control URL exists and user owns it
  const controlUrlDoc = await URL.findById(controlUrl);
  if (!controlUrlDoc) {
    return res.status(404).json({
      success: false,
      message: 'Control URL not found'
    });
  }

  if (controlUrlDoc.owner.toString() !== ownerId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to control URL'
    });
  }

  // Validate variant URLs
  if (variants && variants.length > 0) {
    for (const variant of variants) {
      const variantUrl = await URL.findById(variant.url);
      if (!variantUrl) {
        return res.status(404).json({
          success: false,
          message: `Variant URL ${variant.name} not found`
        });
      }
      if (variantUrl.owner.toString() !== ownerId) {
        return res.status(403).json({
          success: false,
          message: `Access denied to variant URL ${variant.name}`
        });
      }
    }
  }

  // Validate traffic allocation
  const totalAllocation = controlTrafficAllocation + 
    (variants?.reduce((sum, v) => sum + v.trafficAllocation, 0) || 0);
  
  if (Math.abs(totalAllocation - 100) > 0.1) {
    return res.status(400).json({
      success: false,
      message: 'Total traffic allocation must equal 100%'
    });
  }

  // Calculate end date if duration is provided
  let calculatedEndDate = endDate;
  if (!endDate && duration && startDate) {
    calculatedEndDate = new Date(new Date(startDate).getTime() + (duration * 24 * 60 * 60 * 1000));
  }

  const testData = {
    testName,
    description,
    hypothesis,
    controlUrl,
    variants: variants || [],
    controlTrafficAllocation,
    testType: testType || 'split_url',
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: calculatedEndDate ? new Date(calculatedEndDate) : undefined,
    duration,
    primaryMetric: primaryMetric || 'click_rate',
    secondaryMetrics: secondaryMetrics || [],
    conversionGoal,
    minimumSampleSize: minimumSampleSize || 100,
    confidenceLevel: confidenceLevel || 95,
    minimumDetectableEffect: minimumDetectableEffect || 5,
    targetAudience: targetAudience || {},
    excludeBots: excludeBots !== false,
    excludeInternalTraffic: excludeInternalTraffic !== false,
    qualityThreshold: qualityThreshold || 90,
    notes: notes ? [{ 
      note: notes, 
      author: ownerId, 
      createdAt: new Date() 
    }] : [],
    owner: ownerId,
    createdBy: ownerId,
    status: 'draft'
  };

  const result = await new Model(testData).save();

  return res.status(201).json({
    success: true,
    result: await Model.findById(result._id)
      .populate('controlUrl', 'shortCode title originalUrl')
      .populate('variants.url', 'shortCode title originalUrl')
      .populate('owner', 'name email')
      .populate('createdBy', 'name email'),
    message: 'A/B test created successfully'
  });
});

// Start A/B test campaign
const start = catchErrors(async (req, res) => {
  const { id } = req.params;
  const { startDate } = req.body;

  const ownerId = getOwnerId(req);

  const test = await Model.findById(id);
  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'A/B test not found'
    });
  }

  if (test.owner.toString() !== ownerId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (test.status !== 'draft') {
    return res.status(400).json({
      success: false,
      message: 'Only draft tests can be started'
    });
  }

  // Validate test configuration
  if (!test.controlUrl || test.variants.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Test must have control URL and at least one variant'
    });
  }

  const updateData = {
    status: 'active',
    startDate: startDate ? new Date(startDate) : new Date(),
    updatedBy: ownerId
  };

  // Calculate end date if duration is set
  if (test.duration && !test.endDate) {
    updateData.endDate = new Date(updateData.startDate.getTime() + (test.duration * 24 * 60 * 60 * 1000));
  }

  const result = await Model.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('controlUrl variants.url owner createdBy');

  // Update URLs to reference this test
  await URL.findByIdAndUpdate(test.controlUrl, {
    abTestGroup: 'control',
    abTestId: test._id
  });

  for (const variant of test.variants) {
    await URL.findByIdAndUpdate(variant.url, {
      abTestGroup: variant.name,
      abTestId: test._id
    });
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'A/B test started successfully'
  });
});

// Stop A/B test
const stop = catchErrors(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const ownerId = getOwnerId(req);

  const test = await Model.findById(id);
  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'A/B test not found'
    });
  }

  if (test.owner.toString() !== ownerId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (test.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Only active tests can be stopped'
    });
  }

  // Calculate final results before stopping
  const finalResults = await abTestService.calculateFinalResults(test);

  const result = await Model.findByIdAndUpdate(id, {
    status: 'completed',
    endDate: new Date(),
    results: finalResults,
    updatedBy: ownerId,
    ...(reason && {
      $push: {
        notes: {
          note: `Test stopped: ${reason}`,
          author: ownerId,
          createdAt: new Date()
        }
      }
    })
  }, {
    new: true,
    runValidators: true
  }).populate('controlUrl variants.url owner createdBy');

  // Remove test references from URLs
  await URL.findByIdAndUpdate(test.controlUrl, {
    $unset: { abTestGroup: 1, abTestId: 1 }
  });

  for (const variant of test.variants) {
    await URL.findByIdAndUpdate(variant.url, {
      $unset: { abTestGroup: 1, abTestId: 1 }
    });
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'A/B test stopped successfully'
  });
});

// Get test results and statistics
const getResults = catchErrors(async (req, res) => {
  const { id } = req.params;
  const { includeRawData = false } = req.query;

  const ownerId = getOwnerId(req);

  const test = await Model.findById(id)
    .populate('controlUrl', 'shortCode title originalUrl totalClicks')
    .populate('variants.url', 'shortCode title originalUrl totalClicks')
    .populate('owner', 'name email');

  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'A/B test not found'
    });
  }

  if (test.owner._id.toString() !== ownerId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Get current results
  const results = await abTestService.calculateCurrentResults(test);
  
  // Calculate statistical significance
  const significance = await abTestService.calculateStatisticalSignificance(test, results);

  let rawData = null;
  if (includeRawData === 'true') {
    rawData = await URLClick.find({
      $or: [
        { url: test.controlUrl._id },
        { url: { $in: test.variants.map(v => v.url._id) } }
      ],
      clickedAt: {
        $gte: test.startDate,
        ...(test.endDate && { $lte: test.endDate })
      }
    }).sort({ clickedAt: -1 });
  }

  return res.status(200).json({
    success: true,
    result: {
      test: {
        ...test.toObject(),
        results,
        significance
      },
      rawData
    }
  });
});

// Declare winning variant
const declareWinner = catchErrors(async (req, res) => {
  const { id } = req.params;
  const { winner, notes } = req.body;

  const ownerId = getOwnerId(req);

  const test = await Model.findById(id);
  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'A/B test not found'
    });
  }

  if (test.owner.toString() !== ownerId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (test.status !== 'active' && test.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot declare winner for inactive test'
    });
  }

  // Validate winner
  const validWinners = ['control', 'inconclusive', ...test.variants.map(v => v.name)];
  if (!validWinners.includes(winner)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid winner selection'
    });
  }

  const updateData = {
    winner,
    winnerDeclaredAt: new Date(),
    updatedBy: ownerId,
    ...(notes && {
      $push: {
        notes: {
          note: `Winner declared: ${winner}. ${notes}`,
          author: ownerId,
          createdAt: new Date()
        }
      }
    })
  };

  // If test is still active, stop it
  if (test.status === 'active') {
    updateData.status = 'completed';
    updateData.endDate = new Date();
  }

  const result = await Model.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('controlUrl variants.url owner createdBy');

  return res.status(200).json({
    success: true,
    result,
    message: `Winner declared: ${winner}`
  });
});

// Get performance metrics
const getPerformanceMetrics = catchErrors(async (req, res) => {
  const { id } = req.params;
  const { metric = 'click_rate', timeframe = '24h' } = req.query;

  const ownerId = getOwnerId(req);

  const test = await Model.findById(id)
    .populate('controlUrl variants.url');

  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'A/B test not found'
    });
  }

  if (test.owner.toString() !== ownerId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Calculate timeframe
  let startTime = test.startDate;
  if (timeframe !== 'all') {
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720; // 24h, 7d, 30d
    startTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
    if (startTime < test.startDate) startTime = test.startDate;
  }

  const endTime = test.endDate || new Date();

  // Get performance data
  const performanceData = await abTestService.calculatePerformanceMetrics(test, {
    metric,
    startTime,
    endTime
  });

  return res.status(200).json({
    success: true,
    result: {
      test: {
        id: test._id,
        testName: test.testName,
        status: test.status,
        startDate: test.startDate,
        endDate: test.endDate
      },
      metric,
      timeframe,
      data: performanceData
    }
  });
});

// Enhanced list with filtering
const list = catchErrors(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    status,
    primaryMetric,
    dateFrom,
    dateTo,
    search
  } = req.query;

  const ownerId = getOwnerId(req);

  const filter = {
    owner: ownerId
  };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (primaryMetric) {
    filter.primaryMetric = primaryMetric;
  }

  if (search) {
    filter.$or = [
      { testName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { hypothesis: { $regex: search, $options: 'i' } }
    ];
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: 'controlUrl', select: 'shortCode title totalClicks' },
      { path: 'variants.url', select: 'shortCode title totalClicks' },
      { path: 'owner', select: 'name email' }
    ]
  };

  const result = await Model.paginate(filter, options);

  return res.status(200).json({
    success: true,
    result: result.docs,
    pagination: {
      page: result.page,
      pages: result.totalPages,
      count: result.totalDocs,
      limit: result.limit
    }
  });
});

// Get test summary statistics
const summary = catchErrors(async (req, res) => {
  const ownerId = getOwnerId(req);

  const [
    totalTests,
    activeTests,
    completedTests,
    draftTests,
    recentTests,
    topPerformingTests
  ] = await Promise.all([
    Model.countDocuments({ owner: ownerId }),
    Model.countDocuments({ owner: ownerId, status: 'active' }),
    Model.countDocuments({ owner: ownerId, status: 'completed' }),
    Model.countDocuments({ owner: ownerId, status: 'draft' }),
    Model.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('controlUrl', 'shortCode title')
      .select('testName status createdAt startDate endDate'),
    Model.find({ 
      owner: ownerId, 
      status: 'completed',
      'results.control.conversionRate': { $exists: true }
    })
      .sort({ 'results.control.conversionRate': -1 })
      .limit(5)
      .populate('controlUrl', 'shortCode title')
      .select('testName winner results.control.conversionRate')
  ]);

  return res.status(200).json({
    success: true,
    result: {
      totalTests,
      activeTests,
      completedTests,
      draftTests,
      recentTests,
      topPerformingTests
    }
  });
});

export = {
  ...crudController,
  create,
  start,
  stop,
  getResults,
  declareWinner,
  getPerformanceMetrics,
  list,
  summary
};
