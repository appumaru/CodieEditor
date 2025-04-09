<template>
  <div class="border-b border-border">
    <div class="container flex h-16 items-center">
      <div class="flex items-center gap-2">
        <BrainCircuitIcon class="h-6 w-6 text-primary" />
        <span class="font-bold text-lg">CodieEditor AI (Beta)</span>
      </div>
      <div class="flex-1"></div>
      <div class="flex gap-2 items-center">
        <!-- Theme Switcher -->
        <button
          @click="toggleTheme"
          class="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        >
          <SunIcon v-if="isDarkMode" class="h-5 w-5" />
          <MoonIcon v-else class="h-5 w-5" />
        </button>
        
        <!-- Export Button -->
        <button
          @click="exportChat"
          class="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          title="Export Conversation"
        >
          <DownloadIcon class="h-5 w-5" />
        </button>
        
        <!-- Search Button -->
        <button
          @click="$emit('toggle-search')"
          class="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          title="Search Conversation"
        >
          <SearchIcon class="h-5 w-5" />
        </button>
        
        <!-- Reset Button -->
        <button
          @click="confirmReset"
          class="flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
        >
          <RotateCcwIcon class="h-4 w-4" />
          <span>Reset</span>
        </button>
      </div>
    </div>
    
    <!-- Confirmation Modal -->
    <div v-if="showResetConfirm" class="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-card border border-border p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-lg font-medium mb-2">Clear conversation?</h3>
        <p class="text-muted-foreground mb-4">This will delete all messages in this conversation. This action cannot be undone.</p>
        <div class="flex justify-end gap-2">
          <button 
            @click="showResetConfirm = false"
            class="px-4 py-2 rounded-md border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="confirmAndReset"
            class="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BrainCircuitIcon, RotateCcwIcon, SunIcon, MoonIcon, DownloadIcon, SearchIcon } from 'lucide-vue-next';
import { useChatStore } from '~/stores/chatStore';

const chatStore = useChatStore();
const showResetConfirm = ref(false);
const isDarkMode = ref(false);

defineEmits(['toggle-search']);

onMounted(() => {
  // Check if dark mode is already set
  isDarkMode.value = document.documentElement.classList.contains('dark');
  
  // Apply theme from local storage if exists
  const savedTheme = localStorage.getItem('color-theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    isDarkMode.value = true;
  } else {
    document.documentElement.classList.remove('dark');
    isDarkMode.value = false;
  }
});

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  
  // Get html element
  const htmlEl = document.documentElement;
  
  if (isDarkMode.value) {
    // Add dark class explicitly
    htmlEl.classList.add('dark');
    localStorage.setItem('color-theme', 'dark');
    console.log("Dark mode enabled");
  } else {
    // Remove dark class explicitly
    htmlEl.classList.remove('dark');
    localStorage.setItem('color-theme', 'light');
    console.log("Light mode enabled");
  }
}

function confirmReset() {
  showResetConfirm.value = true;
}

function confirmAndReset() {
  chatStore.clearMessages();
  showResetConfirm.value = false;
}

function exportChat() {
  const messages = chatStore.messages;
  const conversationText = messages
    .map((msg) => `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`)
    .join('\n\n');
  
  // Create a blob and download link
  const blob = new Blob([conversationText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-conversation-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
</script> 