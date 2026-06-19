import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { keysRouter } from './routes/keys.js';
import { modelsRouter } from './routes/models.js';
import { proxyRouter } from './routes/proxy.js';
import { responsesRouter } from './routes/responses.js';
import { fallbackRouter } from './routes/fallback.js';
import { profilesRouter } from './routes/profiles.js';
import { embeddingsRouter } from './routes/embeddings.js';
import { analyticsRouter } from './routes/analytics.js';
import { healthRouter } from './routes/health.js';
import { settingsRouter } from './routes/settings.js';
import { premiumRouter } from './routes/premium.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: false
    })
  );

  // CORS
  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // JSON parser
  app.use(
    express.json({
      limit: '10mb'
    })
  );

  // Auth status (disabled)
  app.get('/api/auth/status', (_req, res) => {
    res.json({
      setup: true,
      authenticated: true
    });
  });

  app.post('/api/auth/setup', (_req, res) => {
    res.json({ success: true });
  });

  app.post('/api/auth/login', (_req, res) => {
    res.json({
      success: true,
      token: 'disabled-auth'
    });
  });

  // API routes
  app.use('/api/keys', keysRouter);
  app.use('/api/models', modelsRouter);
  app.use('/api/profiles', profilesRouter);
  app.use('/api/fallback', fallbackRouter);
  app.use('/api/embeddings', embeddingsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/premium', premiumRouter);

  // OpenAI API routes
  app.use('/v1', createProxyRateLimiter());
  app.use('/v1', proxyRouter);
  app.use('/v1', responsesRouter);

  // Health check
  app.get('/api/ping', (_req, res) => {
    res.json({
      status: 'ok',
      time: new Date()
    });
  });

  // Static frontend files
  const clientDist = process.env.CLIENT_DIST
    ? path.resolve(process.env.CLIENT_DIST)
    : path.resolve(__dirname, '../../client/dist');

  // Serve static files if they exist
  app.use(express.static(clientDist));

  // Catch-all route for frontend
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/v1/')) {
      return res.status(404).json({
        error: 'Not found'
      });
    }

    // Try to serve index.html
    res.sendFile(
      path.join(clientDist, 'index.html'),
      (err) => {
        if (err) {
          res.json({
            status: 'FreeLLMAPI API running',
            frontend: 'not built'
          });
        }
      }
    );
  });

  // Error handler
  app.use(errorHandler);

  return app;
}