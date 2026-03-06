# Moz Bulk URL Checker

A simple web app to check Domain Authority (DA), Page Authority (PA), and Spam Score for multiple URLs using the Moz API.

## Features

- Bulk URL input (paste up to 1000 URLs)
- Fetches DA, PA, Spam Score via Moz API
- Results in a clean, copy-friendly table
- Copy Table (tab-separated, pastes directly into Google Sheets/Excel)
- Export CSV
- Configure Moz API credentials via environment variables or the Settings UI

## Prerequisites

- Node.js 18+
- Moz API credentials (get them at https://moz.com/products/api/pricing)

## Quick Start

1. **Clone and install:**

```bash
git clone <your-repo-url>
cd Hozifagomozchecker
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env
```

Edit `.env` and add your Moz API credentials:

```
MOZ_ACCESS_ID=your_moz_access_id
MOZ_SECRET_KEY=your_moz_secret_key
```

Alternatively, you can enter credentials from the Settings UI in the app.

3. **Run in development mode:**

```bash
npm run dev
```

This starts the backend (port 3001) and the Vite dev server (port 5173). Open http://localhost:5173.

4. **Build and run for production:**

```bash
npm run build
npm start
```

The app will be available at http://localhost:3001 (or the PORT you set).

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MOZ_ACCESS_ID` | Yes | Your Moz API Access ID |
| `MOZ_SECRET_KEY` | Yes | Your Moz API Secret Key |
| `PORT` | No | Server port (default: 3001) |

## Deployment

This app is a single Node.js server that serves both the API and the built frontend. To deploy:

1. Run `npm run build` to generate the `dist/` folder
2. Set the environment variables (`MOZ_ACCESS_ID`, `MOZ_SECRET_KEY`, `PORT`)
3. Start with `npm start` (or `node src/server.js`)

Works with any Node.js hosting platform (Railway, Render, Fly.io, VPS, etc.).

## License

MIT
