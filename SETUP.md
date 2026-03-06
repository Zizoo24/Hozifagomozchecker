# Quick Setup Guide

## 1. Get Moz API Credentials

1. Visit [Moz API Pricing](https://moz.com/products/api/pricing)
2. Sign up for a free account
3. Navigate to your [API Dashboard](https://moz.com/products/api/keys)
4. Copy your **Access ID** and **Secret Key**

## 2. Configure the App

Edit `moz-config.json` and add your credentials:

```json
{
  "accessId": "mozscape-1234567890",
  "secretKey": "abcdef1234567890abcdef1234567890"
}
```

## 3. Run the Application

### Option A: Use the start script (recommended)

```bash
./start.sh
```

This will start both the backend and frontend servers.

### Option B: Run servers separately

**Terminal 1** - Start backend server:
```bash
npm run server
```

**Terminal 2** - Start frontend dev server:
```bash
npm run dev
```

## 4. Use the App

1. Open your browser to `http://localhost:5173`
2. Paste URLs into the textarea (one per line)
3. Click "Analyze URLs"
4. View results in the table
5. Use "Copy Table" to copy to clipboard or "Export CSV" to download

## Example URLs

You can test with the URLs in `example-urls.txt`:

```
https://example.com
https://www.google.com
https://github.com
https://stackoverflow.com
https://www.wikipedia.org
mozilla.org
reddit.com
www.amazon.com
```

## Troubleshooting

### "Error loading Moz config" or "Moz API credentials not configured"
- Make sure `moz-config.json` exists in the project root
- Verify your Access ID and Secret Key are correct
- Ensure there are no extra spaces or quotes in the JSON

### Backend server won't start
- Check if port 3001 is already in use
- Make sure you ran `npm install` first

### Frontend can't connect to backend
- Ensure the backend server is running on port 3001
- Check the browser console for error messages

### "API rate limit exceeded"
- You've hit your monthly limit on the free plan
- Wait for the next billing cycle or upgrade your plan

## Notes

- Maximum 1000 URLs per request
- The app automatically removes duplicates
- URLs are cleaned (http/https/www removed)
- Results can be copied directly into Google Sheets or Excel
