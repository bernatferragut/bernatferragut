import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();
console.log('Environment variables:', {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '***' : 'Not set',
  NODE_ENV: process.env.NODE_ENV
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API endpoint for chat
app.post('/api/chat', async (req, res) => {
  console.log('Received chat request');
  try {
    const startTime = Date.now();
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat",
      messages: req.body.messages,
      temperature: 0.7,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY?.trim()}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log(`API request completed in ${Date.now() - startTime}ms`);
    res.json(response.data);
  } catch (error) {
    console.error('Detailed API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      },
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
});

// Serve static files from public directory with detailed logging
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    console.log(`Serving static file from: ${path}`);
    console.log(`Current directory: ${__dirname}`);
  }
}));

// Fallback route for SPA
app.get('*', (req, res) => {
  console.log(`Fallback route: ${req.path}`);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 3001;
console.log('Available routes:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`- ${r.route.path}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('API Base URL:', process.env.API_BASE_URL || 'https://api.deepseek.com');
});