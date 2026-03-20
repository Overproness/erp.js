require('module-alias/register');
require('dotenv').config({ path: '.env' });

import mongoose from 'mongoose';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

declare const global: typeof globalThis & { io?: SocketIOServer };

mongoose
  .connect(process.env.DATABASE as string)
  .then(() => {
    console.log('📚 MongoDB connected successfully');
  })
  .catch((err: Error) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

mongoose.connection.on('error', (error: Error) => {
  console.log('1. 🔥 Common Error → Check your .env file and ensure your DATABASE URI is valid.');
  console.error(`2. 🚫 Mongoose Error → ${error.message}`);
});

// ─────────────────────────────────────────────────────────────
// Dynamically Load All Mongoose Models
// ─────────────────────────────────────────────────────────────
const { globSync } = require('glob');

const modelFiles: string[] = globSync('./src/models/**/*.{js,ts}');
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

const app = require('./app');

mongoose.connection.once('open', async () => {
  // Settings initialization (non-critical)
  try {
    await migrateSetting();
    await initDefaultSettings();
  } catch (error: any) {
    console.error('⚠️ Settings initialization warning (non-fatal):', error.message);
  }

  // GraphQL MUST be initialized for the app to work
  try {
    await (app as any).setupGraphQL();
  } catch (error: any) {
    console.error('❌ GraphQL initialization failed:', error.message);
    console.error('Stack:', error.stack);
  }

  try {
    initializeCopilotModules();
  } catch (error: any) {
    console.error('⚠️ Copilot modules initialization failed (non-fatal):', error.message);
  }

  try {
    await initializeAIServices();
  } catch (error: any) {
    console.error('⚠️ AI services initialization failed (non-fatal):', error.message);
  }

  try {
    reminderScheduler.start();
  } catch (error: any) {
    console.error('⚠️ Reminder scheduler start failed (non-fatal):', error.message);
  }
});

const PORT: string | number = process.env.PORT || 8888;
app.set('port', PORT);

const server: http.Server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

app.set('io', io);
global.io = io;

require('./sockets/notificationSocket')(io);
require('./sockets/chatSocket')(io);

server.listen(PORT, () => {
  const addr = server.address();
  const port = typeof addr === 'string' ? addr : addr?.port;
  console.log(`🚀 Express server running → PORT: ${port}`);
  console.log(`🔌 Socket.io server ready for real-time notifications and chat`);
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
    mongoose.connection.close().then(() => {
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
    mongoose.connection.close().then(() => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});
