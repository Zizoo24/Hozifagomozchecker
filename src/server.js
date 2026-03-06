import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { MozApiService } from './mozApi.js';
import { SemrushApiService } from './semrushApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const distPath = join(__dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- Credential helpers ---

function getMozCredentials() {
  return {
    accessId: process.env.MOZ_ACCESS_ID || '',
    secretKey: process.env.MOZ_SECRET_KEY || ''
  };
}

function getSemrushCredentials() {
  return {
    apiKey: process.env.SEMRUSH_API_KEY || ''
  };
}

function hasMozCredentials() {
  const c = getMozCredentials();
  return Boolean(c.accessId && c.secretKey && c.accessId.length >= 4 && c.secretKey.length >= 4);
}

function hasSemrushCredentials() {
  const c = getSemrushCredentials();
  return Boolean(c.apiKey && c.apiKey.length >= 4);
}

// --- Config endpoints ---

app.get('/api/config', (req, res) => {
  const mozConfigured = hasMozCredentials();
  const semrushConfigured = hasSemrushCredentials();
  const providers = [];
  if (mozConfigured) providers.push('moz');
  if (semrushConfigured) providers.push('semrush');

  res.json({
    configured: providers.length > 0,
    providers,
    moz: {
      configured: mozConfigured,
      accessId: mozConfigured ? getMozCredentials().accessId.substring(0, 10) + '...' : null
    },
    semrush: {
      configured: semrushConfigured
    }
  });
});

app.post('/api/config/moz', (req, res) => {
  const { accessId, secretKey } = req.body;

  if (!accessId || !secretKey) {
    return res.status(400).json({ error: 'Both Access ID and Secret Key are required' });
  }
  if (accessId.trim().length < 4 || secretKey.trim().length < 4) {
    return res.status(400).json({ error: 'Invalid credentials format' });
  }

  process.env.MOZ_ACCESS_ID = accessId.trim();
  process.env.MOZ_SECRET_KEY = secretKey.trim();

  res.json({ success: true, message: 'Moz credentials saved for this session' });
});

app.post('/api/config/semrush', (req, res) => {
  const { apiKey } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' });
  }
  if (apiKey.trim().length < 4) {
    return res.status(400).json({ error: 'Invalid API key format' });
  }

  process.env.SEMRUSH_API_KEY = apiKey.trim();

  res.json({ success: true, message: 'Semrush credentials saved for this session' });
});

// Keep old POST /api/config working for backward compat
app.post('/api/config', (req, res) => {
  const { accessId, secretKey } = req.body;
  if (!accessId || !secretKey) {
    return res.status(400).json({ error: 'Both Access ID and Secret Key are required' });
  }
  if (accessId.trim().length < 4 || secretKey.trim().length < 4) {
    return res.status(400).json({ error: 'Invalid credentials format' });
  }
  process.env.MOZ_ACCESS_ID = accessId.trim();
  process.env.MOZ_SECRET_KEY = secretKey.trim();
  res.json({ success: true, message: 'Moz credentials saved for this session' });
});

// --- Analysis endpoint ---

app.post('/api/check-urls', async (req, res) => {
  try {
    const { urls, provider } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of URLs' });
    }
    if (urls.length > 1000) {
      return res.status(400).json({ error: 'Maximum 1000 URLs allowed per request' });
    }

    // Determine which provider to use
    const selectedProvider = provider || (hasMozCredentials() ? 'moz' : hasSemrushCredentials() ? 'semrush' : null);

    if (!selectedProvider) {
      return res.status(400).json({
        error: 'No API credentials configured. Open Settings to add Moz or Semrush credentials.'
      });
    }

    let results;

    if (selectedProvider === 'semrush') {
      if (!hasSemrushCredentials()) {
        return res.status(400).json({ error: 'Semrush API key not configured. Add it in Settings.' });
      }
      const semrushService = new SemrushApiService(getSemrushCredentials().apiKey);
      results = await semrushService.checkUrls(urls);
    } else {
      if (!hasMozCredentials()) {
        return res.status(400).json({ error: 'Moz API credentials not configured. Add them in Settings.' });
      }
      const mozService = new MozApiService(getMozCredentials().accessId, getMozCredentials().secretKey);
      const mozResults = await mozService.checkUrls(urls);
      results = mozResults.map(r => ({ ...r, provider: 'moz' }));
    }

    res.json({
      success: true,
      provider: selectedProvider,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message || 'Failed to process URLs' });
  }
});

// SPA fallback
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
  console.log(`Bulk URL Checker running on http://${HOST}:${PORT}`);
  const providers = [];
  if (hasMozCredentials()) providers.push('Moz');
  if (hasSemrushCredentials()) providers.push('Semrush');
  if (providers.length > 0) {
    console.log(`Configured providers: ${providers.join(', ')}`);
  } else {
    console.log('No API credentials found. Configure them in the app Settings.');
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
