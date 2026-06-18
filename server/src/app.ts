import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

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

import { createProxyRateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: false
    })
  );

  app.use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  app.use(
    express.json({
      limit: '10mb'
    })
  );

  app.get('/api/auth/status', (_req, res) => {
    res.json({
      setup: true,
      authenticated: true
    });
  });

  app.post('/api/auth/setup', (_req, res) => {
    res.json({
      success: true
    });
  });

  app.post('/api/auth/login', (_req, res) => {
    res.json({
      success: true,
      token: 'disabled-auth'
    });
  });

  app.use('/api/keys', keysRouter);
  app.use('/api/models', modelsRouter);
  app.use('/api/profiles', profilesRouter);
  app.use('/api/fallback', fallbackRouter);
  app.use('/api/embeddings', embeddingsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/health', healthRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/premium', premiumRouter);

  app.use('/v1', createProxyRateLimiter());
  app.use('/v1', proxyRouter);
  app.use('/v1', responsesRouter);

  app.get('/api/ping', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date()
    });
  });

  app.use(errorHandler);

  const clientDist =
    process.env.CLIENT_DIST
      ? path.resolve(process.env.CLIENT_DIST)
      : path.resolve(__dirname, '../../client/dist');

  app.use(express.static(clientDist));

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/v1/')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return app;
}

