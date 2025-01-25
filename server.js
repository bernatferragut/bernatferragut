import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
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
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log(`API request completed in ${Date.now() - startTime}ms`);
    res.json(response.data);
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Failed to process request',
      details: error.message
    });
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});