// ─────────────────────────────────────────────────────────────
// Initial Setup
// ─────────────────────────────────────────────────────────────

// Enable support for module aliases defined in `package.json` (_moduleAliases)
require('module-alias/register');

// Load environment variables from `.env` and optionally `.env.local`
require('dotenv').config({ path: '.env' });

// ─────────────────────────────────────────────────────────────
// MongoDB Connection via Mongoose
// ─────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

// Connect to MongoDB using the DATABASE URI from environment
mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log('📚 MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit the app on DB connection failure
  });

// Connection error handling
mongoose.connection.on('error', (error) => {
  console.log('1. 🔥 Common Error → Check your .env file and ensure your DATABASE URI is valid.');
  console.error(`2. 🚫 Mongoose Error → ${error.message}`);
});

// ─────────────────────────────────────────────────────────────
// Dynamically Load All Mongoose Models
// ─────────────────────────────────────────────────────────────
const { globSync } = require('glob');
const path = require('path');

// Automatically require all model files under /src/models
const modelFiles = globSync('./src/models/**/*.js');
for (const filePath of modelFiles) {
  require(path.resolve(filePath));
}

// ─────────────────────────────────────────────────────────────
// Settings Initialization (Executed After Models Load)
// ─────────────────────────────────────────────────────────────
const initDefaultSettings = require('./middlewares/settings/initDefaultSettings');
const migrateSetting = require('./middlewares/settings/migrateSetting');
const { initializeCopilotModules } = require('./setup/copilotSetup');
const { initializeAIServices } = require('./services/aiServicesInitializer');
const reminderScheduler = require('./services/reminderScheduler');

mongoose.connection.once('open', async () => {
  try {
    await migrateSetting(); // Migrate existing settings (if structure changed)
    await initDefaultSettings(); // Set up default settings (if not present)
    console.log('⚙️ Settings initialization completed');

    // Initialize copilot modules
    initializeCopilotModules();

    // Initialize AI services (24/7 chatbot, follow-ups, self-learning)
    await initializeAIServices();

    // Start reminder scheduler
    reminderScheduler.start();
  } catch (error) {
    console.error('❌ Settings initialization failed:', error);
  }
});

// ─────────────────────────────────────────────────────────────
// Start Express Server
// ─────────────────────────────────────────────────────────────
const app = require('./app');

const PORT = process.env.PORT || 8888;
app.set('port', PORT);

const server = app.listen(PORT, () => {
  console.log(`🚀 Express server running → PORT: ${server.address().port}`);
});
