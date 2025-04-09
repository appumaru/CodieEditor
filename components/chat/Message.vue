<template>
  <div class="group relative mb-4">
    <!-- User message (right aligned) -->
    <div v-if="isUser" class="flex justify-end">
      <div class="flex items-start w-full max-w-[85%] sm:max-w-[75%]">
        <div class="flex flex-col items-end w-full">
          <!-- Message content wrapper -->
          <div class="w-full flex justify-end">
            <!-- User message content -->
            <div class="rounded-lg rounded-tr-none px-3 py-2 shadow-sm bg-primary text-primary-foreground max-w-full">
              <div class="break-words whitespace-pre-wrap px-4 py-3">
                {{ content }}
              </div>
            </div>
            
            <div class="ml-2 flex-shrink-0 self-start">
              <div class="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <UserIcon class="w-5 h-5" />
              </div>
            </div>
          </div>
          
          <!-- Timestamp -->
          <div class="text-xs text-muted-foreground opacity-70 text-right mt-1 pr-10">
            {{ formattedTime }}
          </div>
          
          <!-- User message actions -->
          <div class="flex justify-end opacity-0 transition-opacity group-hover:opacity-100 mt-1 pr-10">
            <div class="flex space-x-2">
              <button 
                @click="$emit('edit', content, index)" 
                class="bg-secondary/50 p-1 rounded-md hover:bg-secondary/80 transition-colors"
                title="Edit message"
              >
                <PencilIcon class="w-3.5 h-3.5" />
              </button>
              <button 
                @click="$emit('continue', content)" 
                class="bg-secondary/50 p-1 rounded-md hover:bg-secondary/80 transition-colors"
                title="Continue from this message"
              >
                <ArrowRightIcon class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- AI message (left aligned) -->
    <div v-else class="flex justify-start">
      <div class="flex items-start w-full max-w-[85%] sm:max-w-[75%]">
        <div class="mr-2 flex-shrink-0 self-start">
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <BrainCircuitIcon class="w-5 h-5" />
          </div>
        </div>
        
        <div class="flex flex-col w-full">
          <!-- AI message content -->
          <div
            class="rounded-lg rounded-tl-none px-3 py-2 shadow-sm bg-muted text-muted-foreground max-w-full"
            :class="[isTool ? 'border-l-4 border-accent' : '']"
          >
            <div class="px-4 py-3">
              <ChatMarkdown :content="content" />
            </div>
          </div>
          
          <!-- Timestamp -->
          <div class="text-xs text-muted-foreground opacity-70 text-left mt-1 pl-1">
            {{ formattedTime }}
          </div>
          
          <!-- AI message actions -->
          <div class="flex opacity-0 transition-opacity group-hover:opacity-100 mt-1">
            <div class="flex items-center space-x-2">
              <button 
                @click="$emit('regenerate', index)" 
                class="bg-secondary/50 text-xs py-1 px-2 rounded-md hover:bg-secondary/80 flex items-center gap-1 transition-colors"
              >
                <RefreshCwIcon class="w-3 h-3" /> Regenerate
              </button>
              
              <div class="flex space-x-1">
                <button 
                  @click="toggleReaction('like')" 
                  class="bg-secondary/50 p-1 rounded-md hover:bg-secondary/80 transition-colors"
                  :class="{'text-primary': reactions.like}"
                  title="Like"
                >
                  <ThumbsUpIcon class="w-3.5 h-3.5" />
                </button>
                <button 
                  @click="toggleReaction('dislike')" 
                  class="bg-secondary/50 p-1 rounded-md hover:bg-secondary/80 transition-colors"
                  :class="{'text-red-500': reactions.dislike}"
                  title="Dislike"
                >
                  <ThumbsDownIcon class="w-3.5 h-3.5" />
                </button>
                <button 
                  @click="toggleReaction('copy')"
                  class="bg-secondary/50 p-1 rounded-md hover:bg-secondary/80 transition-colors"
                  :class="{'text-green-500': reactions.copy}"
                  title="Copy to clipboard"
                >
                  <CopyIcon class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PencilIcon, ArrowRightIcon, RefreshCwIcon, ThumbsUpIcon, ThumbsDownIcon, CopyIcon, BrainCircuitIcon, UserIcon } from 'lucide-vue-next';

const props = defineProps<{
  role: 'user' | 'assistant' | 'system';
  content: string;
  index: number;
  timestamp?: number;
  isFirstMessage: boolean;
  isTool?: boolean;
}>();

defineEmits<{
  (e: 'regenerate', index: number): void;
  (e: 'edit', content: string, index: number): void;
  (e: 'continue', content: string): void;
}>();

const isUser = computed(() => props.role === 'user');

// Reactions state
const reactions = reactive({
  like: false,
  dislike: false,
  copy: false
});

// Format timestamp or use current time if not provided
const formattedTime = computed(() => {
  const date = props.timestamp ? new Date(props.timestamp) : new Date();
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
});

function toggleReaction(type: 'like' | 'dislike' | 'copy') {
  if (type === 'copy') {
    navigator.clipboard.writeText(props.content);
    reactions.copy = true;
    setTimeout(() => {
      reactions.copy = false;
    }, 2000);
  } else if (type === 'like') {
    reactions.like = !reactions.like;
    if (reactions.like) reactions.dislike = false;
  } else if (type === 'dislike') {
    reactions.dislike = !reactions.dislike;
    if (reactions.dislike) reactions.like = false;
  }
}
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> 