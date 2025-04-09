<template>
  <div class="w-full overflow-x-auto pb-2 mt-2 no-scrollbar">
    <div class="flex space-x-2">
      <button
        v-for="(prompt, index) in prompts"
        :key="index"
        @click="$emit('select', prompt)"
        class="min-w-fit px-3 py-1.5 text-sm text-muted-foreground bg-secondary/70 hover:bg-secondary rounded-full transition-colors whitespace-nowrap"
      >
        {{ prompt }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  prompts: string[];
}>();

defineEmits<{
  (e: 'select', prompt: string): void;
}>();
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style> 