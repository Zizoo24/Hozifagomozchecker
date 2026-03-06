# Moz Bulk URL Checker

A simple, clean web application for checking Moz metrics (Domain Authority, Page Authority, and Spam Score) for multiple URLs at once.

## Features

- **Bulk URL Processing**: Check up to 1000 URLs at once
- **Automatic URL Cleaning**: Removes http/https, www, and trailing slashes
- **Duplicate Detection**: Automatically removes duplicate URLs
- **URL Validation**: Validates all URLs before processing
- **Clean Table View**: Results displayed in an easy-to-read table
- **Copy to Clipboard**: One-click copy for pasting into Google Sheets or Excel
- **CSV Export**: Download results as a CSV file
- **Loading States**: Clear feedback during processing
- **Error Handling**: Helpful error messages for API issues

## Metrics Provided

For each URL, the app fetches:
- URL (original input)
- Root Domain
- Domain Authority (DA)
- Page Authority (PA)
- Spam Score
- Status (Success/Error/No Data)

## Prerequisites

- Node.js (version 14 or higher)
- A Moz API account with Access ID and Secret Key

## Getting Your Moz API Credentials

1. Sign up for a free Mozscape account at [Moz API Pricing](https://moz.com/products/api/pricing)
2. After signing up, navigate to the [API Dashboard](https://moz.com/products/api/keys)
3. You'll find your **Access ID** and **Secret Key**

## Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Configure your Moz API credentials in `moz-config.json`:
```json
{
  "accessId": "YOUR_MOZ_ACCESS_ID",
  "secretKey": "YOUR_MOZ_SECRET_KEY"
}
```

## Usage

### Start the Backend Server

In one terminal, start the API server:
```bash
node src/server.js
```

The server will run on `http://localhost:3001`

### Start the Frontend Development Server

In another terminal, start the Vite dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Using the Application

1. **Enter URLs**: Paste your URLs into the textarea (one per line)
   ```
   https://example.com
   https://www.another-example.com
   website.org
   ```

2. **Click "Analyze URLs"**: The app will:
   - Trim whitespace
   - Remove duplicates
   - Validate URLs
   - Fetch Moz metrics
   - Display results in a table

3. **Copy or Export**:
   - Click "Copy Table" to copy the results (paste directly into Excel/Sheets)
   - Click "Export CSV" to download as a CSV file

## Project Structure

```
project/
├── index.html              # Main HTML file
├── package.json            # Node.js dependencies
├── vite.config.js          # Vite configuration
├── moz-config.json         # Moz API credentials
├── src/
│   ├── main.js             # Frontend logic
│   ├── styles.css          # Styling
│   ├── urlValidator.js     # URL validation and processing
│   ├── mozApi.js           # Moz API integration
│   └── server.js           # Express backend server
```

## API Endpoint

### POST `/api/check-urls`

Request body:
```json
{
  "urls": ["example.com", "another-example.com"]
}
```

Response:
```json
{
  "success": true,
  "count": 2,
  "results": [
    {
      "url": "example.com",
      "rootDomain": "example.com",
      "da": 95,
      "pa": 96,
      "spamScore": 1,
      "status": "Success"
    }
  ]
}
```

## Building for Production

Build the frontend:
```bash
npm run build
```

The built files will be in the `dist/` directory.

## Limitations

- Maximum 1000 URLs per request (Moz API limitation)
- API rate limits depend on your Moz subscription plan
- The app processes URLs in batches of 50

## Troubleshooting

### "Invalid Moz API credentials" error
- Check that your `accessId` and `secretKey` in `moz-config.json` are correct
- Ensure you've copied them exactly from the Moz dashboard

### "API rate limit exceeded" error
- You've hit your monthly API limit
- Upgrade your Moz plan or wait for the next billing cycle

### Results show "N/A" values
- The URL might not exist in Moz's index
- Try checking the URL in a browser first

## License

MIT

## Credits

Built with:
- [Vite](https://vitejs.dev/) - Frontend tooling
- [Express](https://expressjs.com/) - Backend server
- [Moz API](https://moz.com/products/api) - SEO metrics data
