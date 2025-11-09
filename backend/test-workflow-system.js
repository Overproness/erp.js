const WorkflowEngine = require('./src/core/WorkflowEngine');
const EnhancedWorkflow = require('./src/models/appModels/EnhancedWorkflow');
const mongoose = require('mongoose');

async function testWorkflowSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/erp-crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create a test workflow
    const testWorkflow = {
      name: 'Test Email Workflow',
      description: 'A simple test workflow that sends an email',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: {
            type: 'trigger',
            label: 'Start',
            config: {
              triggerType: 'manual',
            },
          },
        },
        {
          id: 'email-1',
          type: 'workflowNode',
          position: { x: 300, y: 100 },
          data: {
            type: 'email',
            label: 'Send Email',
            config: {
              to: 'test@example.com',
              subject: 'Test Workflow Email',
              body: 'This email was sent from a test workflow!',
            },
          },
        },
      ],
      connections: [
        {
          id: 'edge-1',
          source: 'trigger-1',
          target: 'email-1',
          type: 'smoothstep',
        },
      ],
      isActive: true,
      companyID: '000000000000000000000001',
    };

    console.log('📝 Creating test workflow...');
    const workflow = new EnhancedWorkflow(testWorkflow);
    await workflow.save();
    console.log('✅ Test workflow created with ID:', workflow._id);

    // Test workflow execution
    console.log('🚀 Testing workflow execution...');
    const workflowEngine = new WorkflowEngine();
    const result = await workflowEngine.executeWorkflow(workflow._id, {
      testData: 'Hello from test!',
    });

    console.log('✅ Workflow execution result:', result);

    // List all workflows
    const workflows = await EnhancedWorkflow.find({});
    console.log(`📋 Total workflows in database: ${workflows.length}`);

    console.log('\n🎉 Workflow system test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Open http://localhost:3000 to access the frontend');
    console.log('2. Navigate to the workflows section');
    console.log('3. Create and test your own workflows');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testWorkflowSystem();
