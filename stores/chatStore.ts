import { defineStore } from 'pinia';
import type { ChatMessage } from '~/utils/types';

interface ChatResponse {
  message?: string;
  status: string;
  rawResponse?: any;
}

interface StoredConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const conversations = ref<StoredConversation[]>([]);
  const activeConversationId = ref<string | null>(null);

  // Load conversations from localStorage on init
  onMounted(() => {
    loadConversations();
    loadActiveConversation();
  });

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  function loadConversations() {
    try {
      const storedConversations = localStorage.getItem('chatConversations');
      if (storedConversations) {
        conversations.value = JSON.parse(storedConversations);
      }
    } catch (err) {
      console.error('Failed to load conversations from localStorage:', err);
    }
  }

  function saveConversations() {
    try {
      localStorage.setItem('chatConversations', JSON.stringify(conversations.value));
    } catch (err) {
      console.error('Failed to save conversations to localStorage:', err);
    }
  }

  function loadActiveConversation() {
    try {
      const storedId = localStorage.getItem('activeConversationId');
      if (storedId) {
        activeConversationId.value = storedId;
        const conversation = conversations.value.find(c => c.id === storedId);
        if (conversation) {
          messages.value = conversation.messages;
        }
      }
    } catch (err) {
      console.error('Failed to load active conversation:', err);
    }
  }

  function saveActiveConversation() {
    try {
      if (activeConversationId.value) {
        localStorage.setItem('activeConversationId', activeConversationId.value);
      }
    } catch (err) {
      console.error('Failed to save active conversation ID:', err);
    }
  }

  function createConversation(title: string = 'New Conversation') {
    const id = generateId();
    const newConversation: StoredConversation = {
      id,
      title,
      messages: [],
      timestamp: Date.now()
    };
    
    conversations.value.unshift(newConversation);
    activeConversationId.value = id;
    messages.value = [];
    
    saveConversations();
    saveActiveConversation();
    
    return id;
  }

  function getConversationTitle(messages: ChatMessage[]): string {
    if (messages.length === 0) return 'New Conversation';
    
    // Use the first user message as the title, truncated
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const title = firstUserMessage.content.trim();
      return title.length > 30 ? title.substring(0, 30) + '...' : title;
    }
    
    return 'New Conversation';
  }

  function updateCurrentConversation() {
    if (!activeConversationId.value) {
      if (messages.value.length > 0) {
        // Create a new conversation with the current messages
        const id = generateId();
        const title = getConversationTitle(messages.value);
        
        const newConversation: StoredConversation = {
          id,
          title,
          messages: [...messages.value],
          timestamp: Date.now()
        };
        
        conversations.value.unshift(newConversation);
        activeConversationId.value = id;
        
        saveConversations();
        saveActiveConversation();
      }
    } else {
      // Update existing conversation
      const index = conversations.value.findIndex(c => c.id === activeConversationId.value);
      if (index !== -1) {
        const title = getConversationTitle(messages.value);
        
        conversations.value[index] = {
          ...conversations.value[index],
          title,
          messages: [...messages.value],
          timestamp: Date.now()
        };
        
        saveConversations();
      }
    }
  }

  function switchConversation(id: string) {
    const conversation = conversations.value.find(c => c.id === id);
    if (conversation) {
      activeConversationId.value = id;
      messages.value = [...conversation.messages];
      saveActiveConversation();
    }
  }

  function deleteConversation(id: string) {
    const index = conversations.value.findIndex(c => c.id === id);
    if (index !== -1) {
      conversations.value.splice(index, 1);
      saveConversations();
      
      // If we deleted the active conversation, clear messages or switch to another
      if (activeConversationId.value === id) {
        if (conversations.value.length > 0) {
          switchConversation(conversations.value[0].id);
        } else {
          activeConversationId.value = null;
          messages.value = [];
          localStorage.removeItem('activeConversationId');
        }
      }
    }
  }

  function addMessage(message: ChatMessage) {
    // Add timestamp if not provided
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }
    messages.value.push(message);
    
    // Update the conversation in storage
    updateCurrentConversation();
  }

  function clearMessages() {
    messages.value = [];
    activeConversationId.value = null;
    localStorage.removeItem('activeConversationId');
  }

  function setMessages(newMessages: ChatMessage[]) {
    // Ensure all messages have timestamps
    newMessages.forEach(msg => {
      if (!msg.timestamp) {
        msg.timestamp = Date.now();
      }
    });
    messages.value = [...newMessages];
    
    // Update the conversation in storage
    updateCurrentConversation();
  }

  function editMessage(index: number, newContent: string) {
    if (index >= 0 && index < messages.value.length) {
      // Update the message content and timestamp
      messages.value[index].content = newContent;
      messages.value[index].timestamp = Date.now();
      
      // If we're editing a user message, we need to remove all subsequent messages
      // and regenerate the AI response
      if (messages.value[index].role === 'user' && index < messages.value.length - 1) {
        // Keep all messages up to and including the edited message
        const messagesToKeep = messages.value.slice(0, index + 1);
        messages.value = messagesToKeep;
        
        // Update the conversation in storage
        updateCurrentConversation();
        
        // Regenerate the AI response
        return sendMessage(newContent, true);
      }
      
      // Update the conversation in storage
      updateCurrentConversation();
    }
    return Promise.resolve();
  }

  async function sendMessage(content: string, isResending = false) {
    if (!content.trim()) return;
    
    error.value = null;
    
    // Only add user message if not resending
    if (!isResending) {
      addMessage({
        role: 'user',
        content: content,
        timestamp: Date.now()
      });
    }
    
    isLoading.value = true;
    
    try {
      // Send to our server API endpoint
      const response = await $fetch<ChatResponse>('/api/chat', {
        method: 'POST',
        body: {
          messages: [
            { role: 'system', content: 'You are a helpful, friendly, and concise AI assistant.' },
            ...messages.value
          ]
        }
      });
      
      // Add AI response - handle different response formats
      let responseContent = '';
      
      if (typeof response.message === 'string') {
        responseContent = response.message;
      } else if (response.rawResponse) {
        // If we got a raw response object, convert it to string
        responseContent = JSON.stringify(response.rawResponse);
      } else {
        responseContent = 'Received response but unable to parse it.';
      }
      
      addMessage({
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now()
      });
    } catch (err: any) {
      error.value = err.message || 'Failed to get response from AI';
      console.error('Chat error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    messages,
    isLoading,
    error,
    conversations,
    activeConversationId,
    addMessage,
    clearMessages,
    setMessages,
    editMessage,
    sendMessage,
    createConversation,
    switchConversation,
    deleteConversation,
    loadConversations
  };
}); 