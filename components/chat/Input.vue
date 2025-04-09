<template>
  <div class="relative">
    <!-- Suggestions -->
    <ClientOnly fallback-tag="div">
      <div v-if="showSuggestions && isInputEmpty && !isEditing" class="mb-3 fade-in">
        <SuggestionPrompts :prompts="suggestions" @select="usePromptSuggestion" />
      </div>
    </ClientOnly>
    
    <form @submit.prevent="handleSubmit" class="relative">
      <textarea
        ref="textareaRef"
        v-model="inputMessage"
        rows="1"
        placeholder="Type your message..."
        class="w-full pl-4 pr-20 py-3 bg-input text-foreground rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
        @keydown.enter.prevent="handleKeyDown"
        @input="adjustHeight"
      ></textarea>
      
      <!-- Input controls -->
      <div class="absolute right-2 bottom-2 flex items-center">
        <!-- Voice Input Button -->
        <ClientOnly fallback-tag="div">
          <button
            v-if="isInputEmpty"
            type="button"
            @click="toggleVoiceInput"
            class="p-2 mr-1 rounded-full text-muted-foreground hover:bg-muted/50 transition-colors"
            :class="isListening ? 'text-red-500' : ''"
            :title="isListening ? 'Stop listening' : 'Voice input'"
          >
            <MicIcon class="w-4 h-4" />
            <span v-if="isListening" class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          </button>
        </ClientOnly>
        
        <!-- Cancel Button (when editing) -->
        <button
          v-if="isEditing"
          type="button"
          @click="handleCancel"
          class="p-2 mr-1 rounded-full text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <XIcon class="w-4 h-4" />
        </button>
        
        <!-- Send Button -->
        <button
          type="submit"
          class="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          :disabled="isSubmitting || (isInputEmpty && !isListening)"
        >
          <Loader2Icon v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <SendIcon v-else class="w-4 h-4" />
        </button>
      </div>
    </form>
    
    <!-- Voice Input Feedback -->
    <ClientOnly fallback-tag="div">
      <div v-if="isListening" class="absolute -top-10 left-0 right-0 bg-card border border-border p-2 rounded-md text-sm text-center fade-in">
        Listening... <span class="text-primary font-medium">{{ interimTranscript || '...' }}</span>
      </div>
    </ClientOnly>
    
    <!-- Editing Mode Indicator -->
    <div v-if="isEditing" class="absolute -top-6 left-0 text-xs text-muted-foreground">
      Editing message
    </div>
  </div>
</template>

<script setup lang="ts">
import { SendIcon, Loader2Icon, XIcon, MicIcon } from 'lucide-vue-next';
import { useChatStore } from '~/stores/chatStore';
import SuggestionPrompts from './SuggestionPrompts.vue';

const props = defineProps<{
  initialMessage?: string;
  isEditing?: boolean;
  editingIndex?: number;
}>();

const chatStore = useChatStore();
const inputMessage = ref('');
const isSubmitting = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const isListening = ref(false);
const interimTranscript = ref('');
const showSuggestions = ref(true);

const isEditing = computed(() => props.isEditing || false);

// Computed property for safe handling of input text
const inputText = computed(() => {
  return inputMessage.value || '';
});

const isInputEmpty = computed(() => {
  return !inputText.value.trim();
});

// Initialize client-side only values
onMounted(() => {
  // Initialize input with props if available
  if (props.initialMessage) {
    inputMessage.value = props.initialMessage;
    nextTick(() => {
      adjustHeight();
    });
  }
});

// Sample prompt suggestions
const suggestions = [
  'Write text animation for Premiere Pro',
  'Write video transition for Premiere Pro',
  'Write video transition for Final Cut Pro',
  'Write video transition for Davinci Resolve'
];

const emit = defineEmits<{
  (e: 'message-sent', message: string): void;
  (e: 'edit-completed', message: string, index: number): void;
  (e: 'editCancelled'): void;
}>();

// Watch props for changes after initial mount
watch(() => props.initialMessage, (newVal) => {
  if (newVal) {
    inputMessage.value = newVal;
    nextTick(() => {
      adjustHeight();
    });
  }
}, { immediate: false });

function adjustHeight() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`;
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (!e || e.shiftKey) return;
  e.preventDefault();
  submitForm();
}

function submitForm() {
  handleSubmit();
}

async function handleSubmit() {
  if (isInputEmpty.value && !isListening.value) return;
  
  if (isListening.value) {
    toggleVoiceInput();
  }
  
  isSubmitting.value = true;
  const message = inputText.value.trim();
  inputMessage.value = '';
  adjustHeight();

  try {
    if (isEditing.value && props.editingIndex !== undefined) {
      emit('edit-completed', message, props.editingIndex);
    } else {
      await chatStore.sendMessage(message);
      emit('message-sent', message);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  } finally {
    isSubmitting.value = false;
  }
}

function handleCancel() {
  inputMessage.value = '';
  emit('editCancelled');
}

// Voice input functionality
function toggleVoiceInput() {
  if (isListening.value) {
    stopVoiceInput();
  } else {
    startVoiceInput();
  }
}

function startVoiceInput() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Voice input is not supported in your browser.');
    return;
  }
  
  try {
    // @ts-ignore - WebkitSpeechRecognition is not in the TypeScript types
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      isListening.value = true;
      interimTranscript.value = '';
    };
    
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          inputMessage.value += event.results[i][0].transcript + ' ';
          interimTranscript.value = '';
        } else {
          interimTranscript.value = event.results[i][0].transcript;
        }
      }
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      isListening.value = false;
    };
    
    recognition.onend = () => {
      isListening.value = false;
    };
    
    // Store the recognition instance
    (window as any).recognitionInstance = recognition;
    
    // Start recognition
    recognition.start();
  } catch (error) {
    console.error('Failed to start speech recognition:', error);
    alert('Could not start voice input. Please try again.');
  }
}

function stopVoiceInput() {
  const recognition = (window as any).recognitionInstance;
  if (recognition) {
    recognition.stop();
    isListening.value = false;
    
    // Add the interim transcript to the input message if it exists
    if (interimTranscript.value) {
      inputMessage.value += interimTranscript.value + ' ';
      interimTranscript.value = '';
    }
  }
}

function usePromptSuggestion(suggestion: string) {
  inputMessage.value = suggestion;
  adjustHeight();
  textareaRef.value?.focus();
}

// Method to focus the input
function focusInput() {
  if (textareaRef.value) {
    textareaRef.value.focus();
    
    // Place cursor at the end of text
    const length = textareaRef.value.value.length;
    textareaRef.value.setSelectionRange(length, length);
    
    adjustHeight();
  }
}

// Clean up voice recognition when component is unmounted
onBeforeUnmount(() => {
  if (isListening.value) {
    stopVoiceInput();
  }
});

// Public methods exposed to the parent component
function focus() {
  if (textareaRef.value) {
    textareaRef.value.focus();
  }
}

// Expose public methods
defineExpose({
  focus
});
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 