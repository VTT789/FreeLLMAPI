import { createApp } from './app.js';
import { initDb, autoInitApiKeys, initApiKeysSync, loadKeysFromEnv, ensureTables } from './db/index.js';

// Initialize database
const db = initDb();
console.log('✅ Database initialized');

// Ensure all required tables exist
ensureTables(db);

// Load API keys from environment variables into database
loadKeysFromEnv();

// Initialize API keys from Google Sheets (async)
(async () => {
  try {
    await autoInitApiKeys();
    console.log('✅ API keys initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize API keys:', error);
    // Try synchronous fallback
    try {
      initApiKeysSync();
      console.log('✅ API keys initialized via sync fallback');
    } catch (syncError) {
      console.error('❌ Sync fallback also failed:', syncError);
    }
  }
})();

// Create and start the Express app
const app = createApp();
const PORT = process.env.PORT || 3001;

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📍 https://freellmapi-mmuc.onrender.com`);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  // Don't exit immediately - allow the server to continue serving requests
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection:', reason);
});