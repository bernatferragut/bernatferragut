class ChatInterface {
  constructor() {
    this.chatContainer = document.getElementById('chat-container');
    this.chatHistory = document.getElementById('chat-history');
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');
    this.apiKey = null;
    
    this.initializeApiKey().then(() => {
      this.setupEventListeners();
      this.loadKnowledgeBase();
      this.addMessage('bot', 'Hi! Ask me anything about Bernat.');
    }).catch(error => {
      console.error('API key initialization failed:', error);
      // Redirect to setup if no API key found
      if (error.message.includes('No API key found')) {
        window.location.href = 'setup.html';
      } else {
        this.addMessage('bot', 'Chat service is currently unavailable. Please try again later.');
      }
    });
  }

  async initializeApiKey() {
    try {
      const encryptedData = JSON.parse(localStorage.getItem('encryptedApiKey'));
      const keyData = JSON.parse(localStorage.getItem('encryptionKey'));
      
      if (!encryptedData || !keyData) {
        throw new Error('No API key found. Please visit setup.html to configure your API key.');
      }

      const key = await crypto.subtle.importKey(
        "jwk",
        keyData,
        { name: "AES-GCM" },
        true,
        ["decrypt"]
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(encryptedData.iv) },
        key,
        new Uint8Array(encryptedData.data)
      );

      this.apiKey = new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('API key decryption failed:', error);
      throw error;
    }
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
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{
            role: "user",
            content: message
          }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content || "I'm not sure how to respond to that.";
    } catch (error) {
      console.error('API Error:', error);
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