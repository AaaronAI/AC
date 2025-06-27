# Kalshi Prototype

This prototype demonstrates fetching market data from the Kalshi API and visualizing price candles using Chart.js. The backend is a simple Express server that authenticates with Kalshi using JWTs.

## Setup

1. Install dependencies (requires internet access):
   ```bash
   npm install
   ```
2. Create a `.env` file at the project root with your Kalshi API credentials. Example:
   ```dotenv
   KALSHI_API_KEY_ID=your_key_id
   KALSHI_PRIVATE_KEY="your_private_key"
   ```
   (A sample `.env` is included but ignored from version control.)

## Running

Start the server:
```bash
node app.js
```
Then open `http://localhost:3000` in your browser. Enter a market ID and click **Fetch Data** to see the raw market details and a candle chart.
