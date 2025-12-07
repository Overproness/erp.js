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
    // console.log('⚙️ Settings initialization completed');

    // Initialize copilot modules
    try {
      initializeCopilotModules();
    } catch (error) {
      console.error('⚠️ Copilot modules initialization failed (non-fatal):', error.message);
    }

    // Initialize AI services (24/7 chatbot, follow-ups, self-learning)
    await initializeAIServices();

    // Start reminder scheduler
    try {
      reminderScheduler.start();
    } catch (error) {
      console.error('⚠️ Reminder scheduler start failed (non-fatal):', error.message);
    }
  } catch (error) {
    console.error('⚠️ Initialization warning (non-fatal):', error.message);
    // Continue running server even if some initializations fail
  }
});

// ─────────────────────────────────────────────────────────────
// Start Express Server
// ─────────────────────────────────────────────────────────────
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 8888;
app.set('port', PORT);

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Make io accessible to other parts of the app
app.set('io', io);
global.io = io;

// Socket.io connection handling
require('./sockets/notificationSocket')(io);

server.listen(PORT, () => {
  console.log(`🚀 Express server running → PORT: ${server.address().port}`);
  console.log(`🔌 Socket.io server ready for real-time notifications`);
});

// ─────────────────────────────────────────────────────────────
// Global Error Handlers - Keep Server Running
// ─────────────────────────────────────────────────────────────

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception (non-fatal):', error.message);
  console.error('Stack:', error.stack);
  // Don't exit - keep the server running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection (non-fatal) at:', promise);
  console.error('Reason:', reason);
  // Don't exit - keep the server running
});

// Handle SIGTERM gracefully
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Handle SIGINT gracefully (Ctrl+C)
process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});
