<template>
  <div class="flex flex-col h-screen bg-background text-foreground">
    <Header @toggle-search="toggleSearch" />
    <main class="flex-1 overflow-hidden">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast';

// Refs to access container's openSearch method
const { $refs } = useNuxtApp();

function toggleSearch() {
  // Access the chat container component's openSearch method
  const containerRef = $refs.chatContainer as { openSearch: () => void } | undefined;
  if (containerRef?.openSearch) {
    containerRef.openSearch();
  } else {
    useToast().show({
      title: 'Search not available',
      description: 'Search is only available when a chat is active.',
      type: 'error'
    });
  }
}
</script> 