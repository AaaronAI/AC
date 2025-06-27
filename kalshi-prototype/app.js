require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// Serve static files from public directory
app.use(express.static('public'));

const KALSHI_API_KEY_ID = process.env.KALSHI_API_KEY_ID;
const KALSHI_PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY ? process.env.KALSHI_PRIVATE_KEY.replace(/\\n/g, '\n') : '';

function generateKalshiToken() {
  const payload = {
    sub: KALSHI_API_KEY_ID,
    iat: Math.floor(Date.now() / 1000)
  };
  return jwt.sign(payload, KALSHI_PRIVATE_KEY, { algorithm: 'RS256' });
}

app.get('/api/market-data', async (req, res) => {
  try {
    const token = generateKalshiToken();
    const marketId = req.query.market_id || '0x77d130a2f4c45a7c2930263f35032a9c375531d0';
    const apiUrl = `https://trading-api.kalshi.com/v1/markets/${marketId}`;
    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Kalshi market data:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

app.get('/api/market-candles', async (req, res) => {
  try {
    const token = generateKalshiToken();
    const marketId = req.query.market_id || '0x77d130a2f4c45a7c2930263f35032a9c375531d0';
    const timeSpan = req.query.time_span || '1d';
    const candleSize = req.query.candle_size || '1m';
    const apiUrl = `https://trading-api.kalshi.com/v1/markets/${marketId}/candles?time_span=${timeSpan}&candle_size=${candleSize}`;
    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Kalshi candle data:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch candle data' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello from Kalshi Prototype!');
});

app.listen(port, () => {
  console.log(`Kalshi prototype server listening at http://localhost:${port}`);
});
