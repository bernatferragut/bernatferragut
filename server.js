import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ChatInterface {
  constructor() {
    this.knowledgeBase = null;
  }

  async loadKnowledgeBase() {
    try {
      const data = await fs.readFile(
        path.join(__dirname, 'public/assets/data/knowledge-base.json')
      );
      this.knowledgeBase = JSON.parse(data);
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      this.knowledgeBase = { facts: {}, faqs: [] };
    }
  }

  checkLocalKnowledge(message) {
    if (!this.knowledgeBase || !this.knowledgeBase.faqs || !this.knowledgeBase.facts) {
      return null;
    }

    // Check FAQs
    const faqMatch = this.knowledgeBase.faqs.find(faq =>
      faq.question.toLowerCase().includes(message.toLowerCase())
    );
    if (faqMatch) return faqMatch.answer;

    // Check facts
    const factMatch = Object.entries(this.knowledgeBase.facts).find(([key, value]) =>
      message.toLowerCase().includes(key.toLowerCase())
    );
    if (factMatch) return factMatch[1];

    return null;
  }
}
const app = express();
const port = 3001;
const chatInterface = new ChatInterface();

// Initialize knowledge base
await chatInterface.loadKnowledgeBase();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for chat
app.post('/api/chat', express.json(), async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Check local knowledge base first
    const localResponse = this.checkLocalKnowledge(messages[messages.length - 1].content);
    if (localResponse) {
      return res.json({
        choices: [{
          message: {
            content: localResponse
          }
        }]
      });
    }

    // Fallback to generic response
    const response = {
      choices: [{
        message: {
          content: "Let me think about that and get back to you with a more complete answer."
        }
      }]
    };
    
    res.json(response);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});