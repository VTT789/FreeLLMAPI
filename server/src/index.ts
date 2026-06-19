import { loadKeysFromEnv } from './scripts/loadKeys.js';

// ... after database initialization ...

// Load API keys from environment variables into the database
loadKeysFromEnv();

import { initDb, autoInitApiKeys, initApiKeysSync } from './db/index.js';

// Initialize database
const db = initDb();
console.log('✅ Database initialized');

// Initialize API keys from Google Sheets
(async () => {
  try {
    await autoInitApiKeys();
    console.log('✅ API keys initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize API keys:', error);
    try {
      initApiKeysSync();
      console.log('✅ API keys initialized via sync fallback');
    } catch (syncError) {
      console.error('❌ Sync fallback also failed:', syncError);
    }
  }
})();

// Use dynamic import to handle both default and named exports
const { createApp } = await import('./app.js');
const app = createApp();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});