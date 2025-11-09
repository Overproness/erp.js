const AiProcessingWorkflow = require('@/models/appModels/AiProcessingWorkflow');
const processOCR = require('./processOCR');
const extractData = require('./extractData');

const processWorkflow = async (req, res) => {
  try {
    const { workflowId, inputData, files } = req.body;

    if (!workflowId) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Workflow ID is required',
      });
    }

    // Fetch the workflow
    const workflow = await AiProcessingWorkflow.findOne({
      _id: workflowId,
      owner: req.admin._id,
      enabled: true,
      removed: false,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Workflow not found or not accessible',
      });
    }

    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let currentData = inputData || {};
    const stepResults = [];
    const errors = [];

    // Execute workflow steps
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const stepStartTime = Date.now();

      try {
        console.log(`Executing step ${i + 1}: ${step.type}`);
        
        let stepResult = null;

        switch (step.type) {
          case 'ocr_processing':
            stepResult = await executeOCRStep(step, currentData, files, req);
            break;

          case 'data_extraction':
            stepResult = await executeDataExtractionStep(step, currentData, req);
            break;

          case 'validation':
            stepResult = await executeValidationStep(step, currentData);
            break;

          case 'transformation':
            stepResult = await executeTransformationStep(step, currentData);
            break;

          case 'integration':
            stepResult = await executeIntegrationStep(step, currentData, req);
            break;

          case 'notification':
            stepResult = await executeNotificationStep(step, currentData, req);
            break;

          default:
            throw new Error(`Unsupported step type: ${step.type}`);
        }

        const stepExecutionTime = Date.now() - stepStartTime;

        stepResults.push({
          stepIndex: i,
          stepName: step.name,
          stepType: step.type,
          status: 'success',
          executionTime: stepExecutionTime,
          input: step.config.logInput ? currentData : '[INPUT_HIDDEN]',
          output: stepResult,
          timestamp: new Date().toISOString(),
        });

        // Update current data with step output
        if (stepResult && typeof stepResult === 'object') {
          currentData = { ...currentData, ...stepResult };
        }

      } catch (stepError) {
        console.error(`Step ${i + 1} failed:`, stepError);
        
        const stepExecutionTime = Date.now() - stepStartTime;
        
        errors.push({
          stepIndex: i,
          stepName: step.name,
          stepType: step.type,
          error: stepError.message,
          executionTime: stepExecutionTime,
          timestamp: new Date().toISOString(),
        });

        stepResults.push({
          stepIndex: i,
          stepName: step.name,
          stepType: step.type,
          status: 'failed',
          error: stepError.message,
          executionTime: stepExecutionTime,
          timestamp: new Date().toISOString(),
        });

        // Check if workflow should continue on error
        if (!step.config?.continueOnError) {
          break;
        }
      }
    }

    const totalExecutionTime = Date.now() - startTime;
    const isSuccessful = errors.length === 0;

    // Update workflow statistics
    await AiProcessingWorkflow.findByIdAndUpdate(workflowId, {
      $inc: { 
        execution_count: 1,
        success_count: isSuccessful ? 1 : 0,
        error_count: isSuccessful ? 0 : 1
      },
      last_executed: new Date(),
      $push: {
        recent_executions: {
          $each: [{
            execution_id: executionId,
            status: isSuccessful ? 'success' : 'failed',
            execution_time: totalExecutionTime,
            steps_completed: stepResults.filter(r => r.status === 'success').length,
            total_steps: workflow.steps.length,
            executed_at: new Date(),
          }],
          $slice: -10 // Keep only last 10 executions
        }
      }
    });

    const result = {
      workflowId,
      executionId,
      status: isSuccessful ? 'success' : 'failed',
      totalExecutionTime,
      stepsCompleted: stepResults.filter(r => r.status === 'success').length,
      totalSteps: workflow.steps.length,
      stepResults,
      errors,
      finalData: currentData,
      executedAt: new Date().toISOString(),
      executedBy: req.admin._id,
    };

    return res.status(200).json({
      success: true,
      result,
      message: isSuccessful ? 'Workflow executed successfully' : 'Workflow completed with errors',
    });

  } catch (error) {
    console.error('Process Workflow Error:', error);
    
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Workflow execution failed',
      error: error.message,
    });
  }
};

// Step execution functions
async function executeOCRStep(step, data, files, req) {
  if (!files || files.length === 0) {
    throw new Error('No files provided for OCR processing');
  }

  const results = [];
  for (const file of files) {
    // Simulate OCR processing
    const mockOCRResult = {
      filename: file.name,
      extractedText: `Mock extracted text from ${file.name}`,
      confidence: Math.floor(Math.random() * 20) + 80,
      language: step.config?.language || 'en',
    };
    results.push(mockOCRResult);
  }

  return {
    ocr_results: results,
    extracted_texts: results.map(r => r.extractedText),
  };
}

async function executeDataExtractionStep(step, data, req) {
  const template = step.config?.template;
  const inputText = data.extracted_texts?.join('\n') || data.inputText || '';

  if (!template || !inputText) {
    throw new Error('Template and input text are required for data extraction');
  }

  // Mock data extraction
  const mockExtractedData = {
    invoice_number: 'INV-2024-001',
    date: new Date().toISOString().split('T')[0],
    total_amount: (Math.random() * 1000 + 100).toFixed(2),
    vendor: 'Sample Vendor',
  };

  return {
    extracted_data: mockExtractedData,
    extraction_confidence: Math.floor(Math.random() * 20) + 80,
  };
}

async function executeValidationStep(step, data) {
  const rules = step.config?.validationRules || [];
  const dataToValidate = data.extracted_data || data;

  const validationResults = [];
  for (const rule of rules) {
    const isValid = validateRule(rule, dataToValidate);
    validationResults.push({
      rule: rule.name,
      field: rule.field,
      isValid,
      value: dataToValidate[rule.field],
    });
  }

  const allValid = validationResults.every(r => r.isValid);

  return {
    validation_results: validationResults,
    is_valid: allValid,
  };
}

async function executeTransformationStep(step, data) {
  const transformations = step.config?.transformations || [];
  let transformedData = { ...data };

  for (const transformation of transformations) {
    transformedData = applyTransformation(transformation, transformedData);
  }

  return {
    transformed_data: transformedData,
  };
}

async function executeIntegrationStep(step, data, req) {
  const integration = step.config?.integration;
  
  // Mock integration with external system
  const integrationResult = {
    system: integration?.system || 'ERP',
    status: 'success',
    record_id: `REC_${Date.now()}`,
    integrated_at: new Date().toISOString(),
  };

  return {
    integration_result: integrationResult,
  };
}

async function executeNotificationStep(step, data, req) {
  const notification = step.config?.notification;
  
  // Mock notification sending
  const notificationResult = {
    type: notification?.type || 'email',
    recipients: notification?.recipients || [req.admin.email],
    status: 'sent',
    sent_at: new Date().toISOString(),
  };

  return {
    notification_result: notificationResult,
  };
}

// Helper functions
function validateRule(rule, data) {
  const value = data[rule.field];
  
  switch (rule.type) {
    case 'required':
      return value !== null && value !== undefined && value !== '';
    case 'numeric':
      return !isNaN(value);
    case 'min_length':
      return String(value).length >= rule.value;
    case 'max_length':
      return String(value).length <= rule.value;
    case 'pattern':
      return new RegExp(rule.pattern).test(String(value));
    default:
      return true;
  }
}

function applyTransformation(transformation, data) {
  const transformedData = { ...data };
  
  switch (transformation.type) {
    case 'field_mapping':
      transformedData[transformation.targetField] = data[transformation.sourceField];
      break;
    case 'value_conversion':
      transformedData[transformation.field] = convertValue(
        data[transformation.field], 
        transformation.from, 
        transformation.to
      );
      break;
    case 'field_calculation':
      transformedData[transformation.field] = calculateField(
        transformation.formula, 
        data
      );
      break;
  }
  
  return transformedData;
}

function convertValue(value, fromType, toType) {
  if (fromType === 'string' && toType === 'number') {
    return parseFloat(value) || 0;
  }
  if (fromType === 'number' && toType === 'string') {
    return String(value);
  }
  return value;
}

function calculateField(formula, data) {
  // Simple calculation - in production, use a secure expression evaluator
  try {
    const result = eval(formula.replace(/\{(\w+)\}/g, (match, field) => {
      return data[field] || 0;
    }));
    return result;
  } catch (error) {
    console.error('Calculation error:', error);
    return 0;
  }
}

module.exports = processWorkflow;
