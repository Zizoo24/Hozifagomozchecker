import express from 'express';
import { MozApiService } from './mozApi.js';

const app = express();
const PORT = 3001;

app.use(express.json());

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

    const mozService = new MozApiService();
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

app.listen(PORT, () => {
  console.log(`Moz API server running on http://localhost:${PORT}`);
});
