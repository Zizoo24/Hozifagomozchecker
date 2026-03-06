import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { MozApiService } from './mozApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Serve built frontend in production
const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

function getCredentials() {
  return {
    accessId: process.env.MOZ_ACCESS_ID || '',
    secretKey: process.env.MOZ_SECRET_KEY || ''
  };
}

function hasValidCredentials(creds) {
  return Boolean(creds.accessId && creds.secretKey &&
         creds.accessId.length >= 10 && creds.secretKey.length >= 10);
}

app.get('/api/config', (req, res) => {
  const creds = getCredentials();
  const configured = hasValidCredentials(creds);

  res.json({
    configured,
    accessId: configured ? creds.accessId.substring(0, 10) + '...' : null
  });
});

app.post('/api/config', (req, res) => {
  const { accessId, secretKey } = req.body;

  if (!accessId || !secretKey) {
    return res.status(400).json({
      error: 'Both Access ID and Secret Key are required'
    });
  }

  if (accessId.trim().length < 10 || secretKey.trim().length < 10) {
    return res.status(400).json({
      error: 'Invalid credentials format'
    });
  }

  // Store in process env for the current session
  process.env.MOZ_ACCESS_ID = accessId.trim();
  process.env.MOZ_SECRET_KEY = secretKey.trim();

  res.json({
    success: true,
    message: 'Credentials saved for this session'
  });
});

app.post('/api/check-urls', async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({
        error: 'Please provide an array of URLs'
      });
    }

    if (urls.length > 1000) {
      return res.status(400).json({
        error: 'Maximum 1000 URLs allowed per request'
      });
    }

    const creds = getCredentials();
    if (!hasValidCredentials(creds)) {
      return res.status(400).json({
        error: 'Moz API credentials not configured. Set MOZ_ACCESS_ID and MOZ_SECRET_KEY environment variables, or enter them in Settings.'
      });
    }

    const mozService = new MozApiService(creds.accessId, creds.secretKey);
    const results = await mozService.checkUrls(urls);

    res.json({
      success: true,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process URLs'
    });
  }
});

// SPA fallback - serve index.html for non-API routes
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send('App is starting up. Please refresh in a moment.');
  }
});

const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`Moz Bulk Checker running on http://${HOST}:${PORT}`);
  const creds = getCredentials();
  if (hasValidCredentials(creds)) {
    console.log('Moz API credentials loaded from environment');
  } else {
    console.log('No Moz API credentials found. Set MOZ_ACCESS_ID and MOZ_SECRET_KEY, or configure in the app.');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use`);
    process.exit(1);
  } else {
    throw err;
  }
});
