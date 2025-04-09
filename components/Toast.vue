<template>
  <ClientOnly>
    <Teleport to="body">
      <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <TransitionGroup name="toast">
          <div 
            v-for="toast in toasts" 
            :key="toast.id"
            class="bg-card border rounded-lg shadow-lg overflow-hidden max-w-sm w-full transform transition-all duration-300"
            :class="{
              'border-green-500': toast.type === 'success',
              'border-red-500': toast.type === 'error',
              'border-blue-500': toast.type === 'info',
              'border-yellow-500': toast.type === 'warning'
            }"
          >
            <div class="flex p-4">
              <div class="flex-shrink-0 mr-3">
                <CheckCircleIcon v-if="toast.type === 'success'" class="w-5 h-5 text-green-500" />
                <AlertCircleIcon v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500" />
                <InfoIcon v-else-if="toast.type === 'info'" class="w-5 h-5 text-blue-500" />
                <AlertTriangleIcon v-else-if="toast.type === 'warning'" class="w-5 h-5 text-yellow-500" />
              </div>
              <div class="flex-1">
                <h3 class="font-medium text-sm">{{ toast.title }}</h3>
                <p v-if="toast.description" class="mt-1 text-xs text-muted-foreground">
                  {{ toast.description }}
                </p>
              </div>
              <button 
                @click="dismissToast(toast.id)" 
                class="flex-shrink-0 ml-2 text-muted-foreground hover:text-foreground"
              >
                <XIcon class="w-4 h-4" />
              </button>
            </div>
            <div 
              class="h-1 transition-all duration-300"
              :class="{
                'bg-green-500': toast.type === 'success',
                'bg-red-500': toast.type === 'error',
                'bg-blue-500': toast.type === 'info',
                'bg-yellow-500': toast.type === 'warning'
              }"
              :style="{ width: getProgressWidth(toast) }"
            ></div>
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { CheckCircleIcon, AlertCircleIcon, InfoIcon, AlertTriangleIcon, XIcon } from 'lucide-vue-next';
import { useToast, type Toast } from '~/composables/useToast';
import { ref, onMounted, onBeforeUnmount } from 'vue';

// Create local reactive state to store toasts
const toasts = ref<Toast[]>([]);
const toastTimers = ref<Record<number, { start: number, duration: number }>>({});
const toastStore = useToast();

// Get toast store state safely
onMounted(() => {
  // Initialize toasts from store
  if (toastStore.toasts?.value) {
    toasts.value = [...toastStore.toasts.value];
  }
  
  // Set up watcher for toast changes - safe and only on client-side
  const stopWatch = watch(() => toastStore.toasts?.value, (newToasts) => {
    if (newToasts) {
      toasts.value = [...newToasts];
      
      // Update timers for new toasts
      newToasts.forEach(toast => {
        if (!toastTimers.value[toast.id]) {
          toastTimers.value[toast.id] = {
            start: Date.now(),
            duration: toast.duration || 3000
          };
        }
      });
      
      // Clean up dismissed toasts
      Object.keys(toastTimers.value).forEach(id => {
        if (!newToasts.some(t => t.id === Number(id))) {
          delete toastTimers.value[Number(id)];
        }
      });
    }
  }, { immediate: true });
  
  onBeforeUnmount(() => {
    stopWatch(); // Clean up the watcher
  });
});

// Dismiss toast using the store
function dismissToast(id: number) {
  toastStore.dismiss(id);
}

// Calculate progress bar width as percentage
function getProgressWidth(toast: Toast): string {
  const timer = toastTimers.value[toast.id];
  if (!timer) return '0%';
  
  const elapsed = Date.now() - timer.start;
  const progress = 100 - (elapsed / timer.duration * 100);
  return `${Math.max(0, progress)}%`;
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style> 