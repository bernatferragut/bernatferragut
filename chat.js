class ChatInterface {
  constructor() {
    this.chatContainer = document.getElementById('chat-container');
    this.chatHistory = document.getElementById('chat-history');
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');
    this.apiKey = 'sk-5cfc45370d6f4516b7f554ca678fdb8a';
    if (!this.apiKey.startsWith('sk-')) {
      console.error('Invalid API key format');
      this.addMessage('bot', 'Invalid API key configuration. Please check your settings.');
      return;
    }
    
    this.setupEventListeners();
    this.loadKnowledgeBase();
    this.addMessage('bot', 'Hi! Ask me anything about Bernat.');
  }

  async loadKnowledgeBase() {
    try {
      const response = await fetch('/assets/data/knowledge-base.json');
      this.knowledgeBase = await response.json();
    } catch (error) {
      console.error('Error loading knowledge base:', error);
      this.knowledgeBase = { facts: {}, faqs: [] };
    }
  }

  setupEventListeners() {
    this.chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = this.chatInput.value.trim();
      if (message) {
        this.addMessage('user', message);
        this.chatInput.value = '';
        
        const response = await this.getResponse(message);
        this.addMessage('bot', response);
      }
    });
  }

  async getResponse(message) {
    // First check local knowledge base
    const localResponse = this.checkLocalKnowledge(message);
    if (localResponse) return localResponse;

    // Fallback to DeepSeek API
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that answers questions about Bernat Ferragut."
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || "I'm not sure how to respond to that.";
    } catch (error) {
      console.error('API Error:', error);
      if (error.message.includes('401')) {
        return "Authentication failed. Please check your API key.";
      } else if (error.message.includes('404')) {
        return "API endpoint not found. Please check the API URL.";
      } else if (error.message.includes('network')) {
        return "Network error. Please check your internet connection.";
      }
      return "I'm having trouble connecting to the chat service. Please try again later.";
    }
  }

  checkLocalKnowledge(message) {
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

  addMessage(role, content) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', role);
    messageElement.textContent = content;
    this.chatHistory.appendChild(messageElement);
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
  }
}

// Initialize chat interface
document.addEventListener('DOMContentLoaded', () => {
  new ChatInterface();
});