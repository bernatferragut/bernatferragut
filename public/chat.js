class ChatInterface {
  constructor() {
    this.chatContainer = document.getElementById('chat-container');
    this.chatHistory = document.getElementById('chat-history');
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');
    
    this.personalityConfig = {};
    this.safeguardConfig = {};
    this.warningCount = 0;
    
    this.setupEventListeners();
    this.loadConfigurations();
    
    // Show initial greeting after configs load
    this.loadConfigurations().then(() => {
      const greeting = this.personalityConfig.personality_profile.initial_greeting.replace('Bernat thinks that... ', '');
      this.addMessage('bot', greeting);
    });
  }

  async loadConfigurations() {
    try {
      const [personalityRes, safeguardRes] = await Promise.all([
        fetch('/assets/data/chat-personality.json'),
        fetch('/assets/data/chat-safeguards.json')
      ]);
      
      this.personalityConfig = await personalityRes.json();
      this.safeguardConfig = await safeguardRes.json() || {
        prohibited_content: {
          words: {
            english: [],
            spanish: [],
            catalan: []
          },
          phrases: [],
          patterns: []
        },
        response_handling: {
          abusive_content: {
            action: 'warn',
            message: 'Please refrain from using inappropriate language'
          },
          sensitive_content: {
            action: 'redirect',
            message: 'This topic may be sensitive',
            resources: []
          }
        },
        safety_protocols: {
          content_moderation: {
            response_strategy: {
              initial_warning: 'Please be respectful',
              secondary_response: 'This is your second warning',
              final_action: 'Conversation ended due to policy violations',
              escalation_path: {
                threshold: 3
              }
            }
          },
          accessibility_features: {
            cognitive_load_management: {
              chunking: true,
              visual_breaks: '\n---\n'
            }
          }
        }
      };
      
      // Build system message from personality profile
      const profile = this.personalityConfig.personality_profile;
      this.systemMessage = `You are a ${profile.core_identity.archetype}. ` +
        `Your communication style is ${profile.core_identity.communication_style}. ` +
        `You frequently use these verbal quirks: ${profile.core_identity.verbal_quirks.join(', ')}. ` +
        `Your cultural influences include: ${profile.cultural_context.barcelona_influence.architecture_references.join(', ')} ` +
        `and you value ${profile.cultural_context.barcelona_influence.cultural_values.join(', ')}. ` +
        `You speak ${profile.response_mechanics.language_preferences.primary} primarily, ` +
        `and also ${profile.response_mechanics.language_preferences.secondary.join(', ')}.`;
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  }

  checkProhibitedContent(message) {
    const safeguards = this.safeguardConfig?.prohibited_content || {};
    const words = safeguards.words || {
      english: [],
      spanish: [],
      catalan: []
    };
    
    // Check words in all languages
    for (const lang of Object.keys(words)) {
      if (Array.isArray(words[lang]) && words[lang].some(word =>
        new RegExp(`\\b${word}\\b`, 'i').test(message)
      )) {
        return 'abusive_content';
      }
    }
    
    // Check phrases
    const phrases = safeguards.phrases || [];
    if (Array.isArray(phrases) && phrases.some(phrase =>
      message.toLowerCase().includes(phrase.toLowerCase())
    )) {
      return 'sensitive_content';
    }
    
    // Check patterns
    const patterns = safeguards.patterns || [];
    if (Array.isArray(patterns) && patterns.some(pattern =>
      new RegExp(pattern, 'i').test(message)
    )) {
      return 'sensitive_content';
    }
    
    return null;
  }

  getSafeguardResponse(type) {
    const response = this.safeguardConfig.response_handling[type];
    if (response.action === 'redirect') {
      return `${response.message} Resources: ${response.resources.join(', ')}`;
    }
    return response.message;
  }

  formatResponse(content) {
    const profile = this.personalityConfig.personality_profile;
    const format = profile.response_mechanics.response_format;
    const accessibility = this.safeguardConfig.safety_protocols.accessibility_features;
    
    // Get random cultural reference
    const culturalRef = this.getCulturalReference();
    
    // Build response structure
    let responseParts = [
      '', // No prefix
      content, // Core content
      culturalRef, // Cultural reference
      this.getReflectionQuestion() // Reflection question
    ];
    
    // Apply accessibility features
    if (accessibility.cognitive_load_management.chunking) {
      responseParts = responseParts.map(part => {
        if (part.length > 200) {
          return part.split('. ')
            .join('.\n\n')
            .split('? ')
            .join('?\n\n');
        }
        return part;
      });
    }
    
    // Add visual breaks if enabled
    if (accessibility.cognitive_load_management.visual_breaks) {
      responseParts = responseParts.flatMap(part => [
        part,
        accessibility.cognitive_load_management.visual_breaks
      ]);
    }
    
    // Join with appropriate spacing
    return responseParts
      .filter(part => part) // Remove empty parts
      .join('\n\n');
  }

  getCulturalReference() {
    const references = this.personalityConfig.personality_profile
      .response_mechanics.response_format.structure
      .find(s => s.cultural_reference)?.cultural_reference;
    
    if (!references) return '';
    
    // Randomly choose between Catalan and Spanish
    const lang = Math.random() > 0.5 ? 'catalan' : 'spanish';
    const phrases = references[lang];
    
    if (phrases && phrases.length > 0) {
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    return '';
  }

  getCulturalReference() {
    const references = this.personalityConfig.personality_profile
      .cultural_context.barcelona_influence;
    const randomRef = references.local_sayings[
      Math.floor(Math.random() * references.local_sayings.length)
    ];
    return `As we say in Barcelona: ${randomRef}`;
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
    // Check for prohibited content
    const prohibited = this.checkProhibitedContent(message);
    if (prohibited) {
      this.warningCount++;
      
      // Get appropriate response based on warning count
      const protocols = this.safeguardConfig.safety_protocols.content_moderation.response_strategy;
      
      if (this.warningCount >= protocols.escalation_path.threshold) {
        return protocols.final_action;
      } else if (this.warningCount > 1) {
        return protocols.secondary_response;
      }
      return protocols.initial_warning;
    }

    // First check local knowledge base
    const localResponse = this.checkLocalKnowledge(message);
    if (localResponse) return localResponse;

    // Get DeepSeek response
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: this.systemMessage
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const responseData = await response.json();
      return responseData.choices[0].message.content;
    } catch (error) {
      console.error('API Error:', error);
      return "I'm having trouble connecting to the chat service. Please try again later.";
    }
  }

  augmentResponse(rawResponse, message) {
    // Apply personality tone
    let response = rawResponse;
    const profile = this.personalityConfig.personality_profile;
    
    // Add tone indicator
    if (profile.response_mechanics.tone === "friendly") {
      response = `😊 ${response}`;
    }
    
    // Add cultural reference
    const culturalRef = this.getCulturalReference();
    if (culturalRef) {
      response += `\n\n${culturalRef}`;
    }
    
    // Add knowledge base augmentation
    const knowledge = this.checkLocalKnowledge(message);
    if (knowledge) {
      response += `\n\nAdditional Information:\n${knowledge}`;
    }
    
    return this.formatResponse(response);
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

    // Check triggers from knowledge base
    const triggerMatch = Object.entries(this.knowledgeBase.triggers || {}).find(([key, value]) =>
      message.toLowerCase().includes(key.toLowerCase())
    );
    if (triggerMatch) return triggerMatch[1];

    return null;
  }

  async addMessage(role, content) {
    if (role === 'bot') {
      // Show thinking indicator
      const thinkingElement = document.createElement('div');
      thinkingElement.classList.add('chat-message', 'bot', 'thinking');
      thinkingElement.innerHTML = '<span class="blinking">reasoning</span>';
      this.chatHistory.appendChild(thinkingElement);
      this.chatHistory.scrollTop = this.chatHistory.scrollHeight;

      // Wait for 1.5 seconds before showing response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Remove thinking indicator
      this.chatHistory.removeChild(thinkingElement);
      
      // Create actual response
      const messageElement = document.createElement('div');
      messageElement.classList.add('chat-message', role);
      messageElement.innerHTML = content;
      this.chatHistory.appendChild(messageElement);
    } else {
      // User message remains unchanged
      const messageElement = document.createElement('div');
      messageElement.classList.add('chat-message', role);
      messageElement.textContent = content;
      this.chatHistory.appendChild(messageElement);
    }
    this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
  }

  // Add blinking animation
  static addBlinkingStyle() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0; }
        100% { opacity: 1; }
      }
      .blinking {
        animation: blink 1s infinite;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize chat interface
document.addEventListener('DOMContentLoaded', () => {
  ChatInterface.addBlinkingStyle();
  new ChatInterface();
});