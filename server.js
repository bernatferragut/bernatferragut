import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
console.log('DeepSeek API Key:', process.env.DEEPSEEK_API_KEY ? 'Loaded' : 'Missing');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ChatInterface {
  constructor() {
    this.knowledgeBase = null;
    this.personalityConfig = null;
  }

  async loadPersonalityConfig() {
    try {
      const data = await fs.readFile(
        path.join(__dirname, 'public/assets/data/chat-personality.json')
      );
      this.personalityConfig = JSON.parse(data);
    } catch (error) {
      console.error('Error loading personality config:', error);
      this.personalityConfig = { personality_profile: {} };
    }
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

    // Normalize message by removing punctuation and splitting into words
    const words = message.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/);
      
    // Check FAQs using semantic similarity
    const faqMatch = this.knowledgeBase.faqs.reduce((bestMatch, faq) => {
      const questionWords = faq.question.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/);
        
      // Calculate match score based on word overlap
      const matchScore = words.filter(word =>
        questionWords.includes(word)
      ).length;
      
      // Only consider matches with at least 2 common words
      if (matchScore >= 2 && (!bestMatch || matchScore > bestMatch.score)) {
        return { answer: faq.answer, score: matchScore };
      }
      return bestMatch;
    }, null);
    
    if (faqMatch) return faqMatch.answer;

    // Check facts using semantic similarity
    const factMatch = Object.entries(this.knowledgeBase.facts).reduce((bestMatch, [key, value]) => {
      const keyWords = key.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/);
        
      // Calculate match score based on word overlap
      const matchScore = words.filter(word =>
        keyWords.includes(word)
      ).length;
      
      // Only consider matches with at least 2 common words
      if (matchScore >= 2 && (!bestMatch || matchScore > bestMatch.score)) {
        return { answer: value, score: matchScore };
      }
      return bestMatch;
    }, null);
    if (factMatch) return factMatch[1];

    return null;
  }

  applyPersonality(content, personality) {
    // Add cultural references
    const culturalRef = this.getCulturalReference(personality);
    if (culturalRef) {
      content = `${culturalRef}\n\n${content}`;
    }

    // Add reflection question
    const reflection = this.getReflectionQuestion();
    content = `${content}\n\n${reflection}`;

    // Apply verbal quirks
    if (personality.core_identity.verbal_quirks) {
      personality.core_identity.verbal_quirks.forEach(quirk => {
        if (quirk.includes('gardening')) {
          content = content.replace(/solution/g, 'seed');
          content = content.replace(/problem/g, 'weed');
        }
      });
    }

    return content;
  }

  enhanceWithLocalKnowledge(content, message) {
    const localKnowledge = this.checkLocalKnowledge(message);
    if (localKnowledge) {
      return `${localKnowledge}\n\n${content}`;
    }
    return content;
  }

  getCulturalReference(personality) {
    const references = personality.cultural_context.barcelona_influence;
    if (references && references.local_sayings) {
      return references.local_sayings[
        Math.floor(Math.random() * references.local_sayings.length)
      ];
    }
    return null;
  }

  getReflectionQuestion() {
    const questions = [
      "What are your thoughts on this?",
      "How does this resonate with your experiences?",
      "What would you do differently?",
      "How can we apply this in our daily lives?"
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }
}
const app = express();
const port = 3002;
const chatInterface = new ChatInterface();

// Enable CORS
app.use(cors({
  origin: 'http://localhost:3002',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Initialize configurations
await Promise.all([
  chatInterface.loadKnowledgeBase(),
  chatInterface.loadPersonalityConfig()
]);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for chat
app.post('/api/chat', express.json(), async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages format:', messages);
      return res.status(400).json({ error: 'Invalid request format: messages array required' });
    }
    
    const lastMessage = messages[messages.length - 1].content;
    if (!lastMessage || typeof lastMessage !== 'string') {
      console.error('Invalid message content:', lastMessage);
      return res.status(400).json({ error: 'Invalid message content' });
    }
    
    // Check local knowledge base first
    const localResponse = chatInterface.checkLocalKnowledge(lastMessage);
    if (localResponse) {
      return res.json({
        choices: [{
          message: {
            content: localResponse
          }
        }]
      });
    }

    // If no local match, query DeepSeek
    let responseContent = "Let me think about that and get back to you with a more complete answer.";
    
    try {
      const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-DeepSeek-Version': '2024-01-01',
          'X-DeepSeek-Organization': 'user' // Add organization header if required
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: messages,
          temperature: 0.7,
          max_tokens: 200,
          stream: false
        })
      });

      if (!deepseekResponse.ok) {
        const errorBody = await deepseekResponse.text();
        console.error(`DeepSeek API error: ${deepseekResponse.status} - ${errorBody}`);
        throw new Error(`DeepSeek API error: ${deepseekResponse.status}`);
      }
      
      const deepseekData = await deepseekResponse.json();
      responseContent = deepseekData.choices[0].message.content;
      console.log('DeepSeek response:', responseContent);
    } catch (error) {
      console.error('DeepSeek API connection error:', error);
    }

    // Apply personality filters if available
    if (chatInterface.personalityConfig && chatInterface.personalityConfig.personality_profile) {
      responseContent = chatInterface.applyPersonality(responseContent, chatInterface.personalityConfig.personality_profile);
    }

    // Check if we can enhance with local knowledge
    const enhancedResponse = chatInterface.enhanceWithLocalKnowledge(responseContent, messages[messages.length - 1].content);

    const response = {
      choices: [{
        message: {
          content: enhancedResponse || responseContent
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