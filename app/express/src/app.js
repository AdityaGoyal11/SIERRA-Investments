const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ESG data endpoint (placeholder)
app.get('/api/esg', (req, res) => {
  res.json({ message: 'ESG endpoint placeholder' });
});


module.exports = { app };
