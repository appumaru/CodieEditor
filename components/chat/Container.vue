<template>
  <div class="flex flex-col h-full">
    <!-- Conversation Search Overlay -->
    <div
      v-if="isSearching"
      class="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div class="bg-card border border-border p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">Search in conversation</h3>
          <button @click="closeSearch" class="text-muted-foreground hover:text-foreground">
            <XIcon class="w-5 h-5" />
          </button>
        </div>
        
        <div class="relative mb-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search messages..."
            class="w-full p-2 pl-10 border border-border rounded-md bg-input focus:ring-1 focus:ring-primary focus:outline-none"
            @input="performSearch"
          />
          <SearchIcon class="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        </div>
        
        <div v-if="searchResults.length > 0" class="max-h-[300px] overflow-y-auto chat-scrollbar">
          <div
            v-for="(result, index) in searchResults"
            :key="index"
            class="p-3 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
            @click="scrollToMessage(result.messageIndex)"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs text-muted-foreground">
                {{ result.role === 'user' ? 'You' : 'AI' }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ formatDate(result.timestamp) }}
              </span>
            </div>
            <p class="text-sm">{{ highlightMatch(result.content, searchQuery) }}</p>
          </div>
        </div>
        
        <div v-else-if="searchQuery && !searchResults.length" class="text-center py-8 text-muted-foreground">
          No results found
        </div>
      </div>
    </div>

    <!-- Mobile Sidebar Toggle -->
    <button
      v-if="!isSidebarOpen && isMobile"
      @click="toggleSidebar"
      class="fixed left-4 bottom-20 z-20 p-3 bg-primary text-primary-foreground rounded-full shadow-lg"
    >
      <LayoutListIcon class="w-5 h-5" />
    </button>

    <!-- Main Layout with Sidebar -->
    <div class="flex-1 overflow-hidden flex">
      <!-- Sidebar -->
      <div
        class="border-r border-border bg-card transition-all duration-300 overflow-y-auto"
        :class="sidebarClasses"
      >
        <div class="p-4 border-b border-border flex items-center justify-between">
          <h2 class="font-medium text-lg">Conversations</h2>
          <button
            v-if="isMobile"
            @click="toggleSidebar"
            class="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>
        
        <!-- New Chat Button -->
        <div class="p-3">
          <button
            @click="newConversation"
            class="w-full py-2 px-3 bg-primary text-primary-foreground rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
          >
            <PlusIcon class="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
        
        <!-- Conversation List -->
        <div class="px-2 py-3">
          <div
            v-for="(conversation, index) in chatStore.conversations"
            :key="conversation.id"
            class="px-3 py-2 rounded-md hover:bg-muted cursor-pointer transition-colors flex items-center gap-2 group"
            :class="{ 'bg-muted': conversation.id === chatStore.activeConversationId }"
            @click="switchConversation(conversation.id)"
          >
            <MessageSquareIcon class="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div class="truncate flex-1">
              {{ conversation.title }}
            </div>
            <div class="text-xs text-muted-foreground opacity-60">
              {{ formatDate(conversation.timestamp) }}
            </div>
            <button
              @click.stop="deleteConversation(conversation.id)"
              class="p-1 rounded-md hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <TrashIcon class="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
            </button>
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 flex flex-col">
        <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-6 chat-scrollbar">
          <div v-if="chatStore.messages.length === 0" class="flex flex-col items-center justify-center h-full">
            <div class="flex flex-col items-center max-w-lg mx-auto text-center">
              <BrainCircuitIcon class="w-14 h-14 text-primary mb-5" />
              <h2 class="text-xl font-bold mb-2">Welcome to CodieEditor AI</h2>
              <p class="text-muted-foreground mb-6">
                I am your AI video editor. I will help you to generate video editor's configuration scripts.
              </p>
              
              <!-- Quick start suggestions -->
              <div class="grid grid-cols-2 gap-2 w-full">
                <button 
                  v-for="(suggestion, i) in ['Write text animation for Premiere Pro ', 'Write video transition for Premiere Pro', 'Write video transition for Final Cut Pro', 'Write video transition for Davinci Resolve']" 
                  :key="i"
                  @click="startWithSuggestion(suggestion)"
                  class="p-3 text-sm rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors text-left"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>
          </div>
          <template v-else>
            <div class="space-y-6">
              <ChatMessage
                v-for="(message, index) in chatStore.messages"
                :key="`msg-${message.role}-${message.timestamp}-${index}`"
                :role="message.role"
                :content="message.content"
                :index="index"
                :timestamp="message.timestamp"
                :is-first-message="index === 0"
                @regenerate="regenerateMessage"
                @edit="editMessage"
                @continue="continueFromMessage"
              />
              <div v-if="chatStore.isLoading" class="group relative mb-4">
                <div class="flex justify-start">
                  <div class="flex items-start w-full max-w-[85%] sm:max-w-[75%]">
                    <div class="mr-2 flex-shrink-0 self-start">
                      <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <BrainCircuitIcon class="w-5 h-5" />
                      </div>
                    </div>
                    <div class="flex flex-col w-full">
                      <div class="bg-muted rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
                        <div class="typing-animation">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Error Alert -->
        <div v-if="chatStore.error" class="px-4 py-2 bg-red-500/10 text-red-500 mb-2 mx-4 rounded-md text-sm">
          <p>{{ chatStore.error }}</p>
        </div>

        <!-- Input Area -->
        <div class="p-4 border-t border-border bg-card/50">
          <ChatInput 
            ref="chatInputRef" 
            @message-sent="handleMessageSent" 
            @edit-cancelled="handleEditCancelled"
            @edit-completed="handleEditCompleted"
            :initial-message="editedMessage" 
            :is-editing="isEditing"
            :editing-index="editingIndex"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BrainCircuitIcon, SearchIcon, XIcon, LayoutListIcon, MessageSquareIcon, PlusIcon, TrashIcon } from 'lucide-vue-next';
import { useChatStore } from '~/stores/chatStore';

const chatStore = useChatStore();
const messagesContainer = ref<HTMLElement | null>(null);
const chatInputRef = ref<InstanceType<typeof ChatInput> | null>(null);
const editedMessage = ref('');
const isEditing = ref(false);
const editingIndex = ref(-1);

// Search functionality
const isSearching = ref(false);
const searchQuery = ref('');
const searchResults = ref<Array<{ content: string; role: string; messageIndex: number; timestamp?: number }>>([]);

// Sidebar and mobile responsive state
const isSidebarOpen = ref(true);
const isMobile = ref(false);

const sidebarClasses = computed(() => {
  if (isMobile.value) {
    return isSidebarOpen.value 
      ? 'w-[280px] fixed left-0 top-0 bottom-0 z-30' 
      : 'w-0';
  }
  
  return isSidebarOpen.value ? 'w-[280px]' : 'w-0';
});

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

onMounted(() => {
  scrollToBottom();
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkScreenSize);
});

watch(() => chatStore.messages.length, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

function checkScreenSize() {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    isSidebarOpen.value = false;
  }
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function newConversation() {
  chatStore.createConversation();
  if (isMobile.value) {
    isSidebarOpen.value = false;
  }
}

function switchConversation(id: string) {
  chatStore.switchConversation(id);
  if (isMobile.value) {
    isSidebarOpen.value = false;
  }
}

function deleteConversation(id: string) {
  chatStore.deleteConversation(id);
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function regenerateMessage(index: number) {
  if (index > 0 && chatStore.messages[index].role === 'assistant') {
    // Find the user message that came before this assistant message
    let userMessageIndex = index - 1;
    
    while (userMessageIndex >= 0 && chatStore.messages[userMessageIndex].role !== 'user') {
      userMessageIndex--;
    }
    
    if (userMessageIndex >= 0 && chatStore.messages[userMessageIndex].role === 'user') {
      // Get the user message content
      const userContent = chatStore.messages[userMessageIndex].content;
      
      // Keep all messages up to the user message
      const messagesToKeep = chatStore.messages.slice(0, userMessageIndex + 1);
      chatStore.setMessages(messagesToKeep);
      
      // Regenerate the response
      chatStore.sendMessage(userContent, true); // true = resending
    }
  }
}

function editMessage(content: string, index: number) {
  if (chatStore.messages[index]?.role === 'user') {
    isEditing.value = true;
    editedMessage.value = content;
    editingIndex.value = index;
    
    // Focus the input
    nextTick(() => {
      chatInputRef.value?.focus();
    });
  }
}

function continueFromMessage(content: string) {
  // Create a new message and continue the conversation
  chatStore.sendMessage(content);
}

function handleMessageSent(message: string) {
  // Input component already handled sending the message
  // This is just a hook for any additional logic
  scrollToBottom();
}

function handleEditCancelled() {
  isEditing.value = false;
  editedMessage.value = '';
  editingIndex.value = -1;
}

function handleEditCompleted(newContent: string, index: number) {
  chatStore.editMessage(index, newContent);
  isEditing.value = false;
  editedMessage.value = '';
  editingIndex.value = -1;
}

function openSearch() {
  isSearching.value = true;
  nextTick(() => {
    document.querySelector('input[type="text"]')?.focus();
  });
}

function closeSearch() {
  isSearching.value = false;
  searchQuery.value = '';
  searchResults.value = [];
}

function performSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }
  
  const query = searchQuery.value.toLowerCase();
  searchResults.value = chatStore.messages
    .map((message, index) => {
      if (message.content.toLowerCase().includes(query)) {
        return {
          content: message.content,
          role: message.role,
          messageIndex: index,
          timestamp: message.timestamp
        };
      }
      return null;
    })
    .filter(Boolean) as typeof searchResults.value;
}

function scrollToMessage(index: number) {
  closeSearch();
  
  nextTick(() => {
    const messageElements = document.querySelectorAll('[class*="flex mb-4 group"]');
    if (messageElements[index]) {
      (messageElements[index] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight the message briefly
      const el = messageElements[index] as HTMLElement;
      el.style.transition = 'background-color 0.5s ease';
      el.style.backgroundColor = 'rgba(var(--primary), 0.2)';
      
      setTimeout(() => {
        el.style.backgroundColor = '';
        setTimeout(() => {
          el.style.transition = '';
        }, 500);
      }, 1500);
    }
  });
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  
  // Limit text to 100 characters with the match in the middle
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(query.toLowerCase());
  
  if (index < 0) return text.slice(0, 100) + '...';
  
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + query.length + 40);
  let result = text.slice(start, end);
  
  if (start > 0) result = '...' + result;
  if (end < text.length) result = result + '...';
  
  return result;
}

function startWithSuggestion(suggestion: string) {
  // Set the suggestion as message and send it
  chatStore.sendMessage(suggestion);
  if (isMobile.value) {
    isSidebarOpen.value = false;
  }
}

defineExpose({
  openSearch
});
</script>

<style scoped>
.typing-animation {
  display: flex;
  align-items: center;
  column-gap: 6px;
  padding: 8px;
}

.typing-animation span {
  height: 10px;
  width: 10px;
  background-color: currentColor;
  opacity: 0.5;
  border-radius: 50%;
  display: block;
  animation: typing 1.5s infinite ease-in-out;
}

.typing-animation span:nth-child(1) {
  animation-delay: 0s;
}

.typing-animation span:nth-child(2) {
  animation-delay: 0.3s;
}

.typing-animation span:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes typing {
  0%, 100% {
    transform: translateY(0px);
    opacity: 0.2;
  }
  50% {
    transform: translateY(-5px);
    opacity: 0.8;
  }
}
</style> 