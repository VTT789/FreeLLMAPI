import { createApp } from './server/dist/server/src/app.js';
import { initDb, autoInitApiKeys } from './server/dist/server/src/db/index.js';

// Initialize database
const db = initDb();
console.log('Database initialized');

// Initialize API keys
(async () => {
  try {
    await autoInitApiKeys();
    console.log('API keys initialized successfully');
  } catch (error) {
    console.error('Failed to initialize API keys:', error);
  }
})();

const app = createApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('http://localhost:' + PORT);
});
