<template>
  <NuxtLayout>
    <NuxtPage />
    <Toast />
  </NuxtLayout>
</template>

<script setup>
// Expose Nuxt refs for nested components
const nuxtApp = useNuxtApp();
nuxtApp.hook('page:finish', () => {
  const pageRefs = nuxtApp.vueApp._instance?.refs || {};
  
  // Bind container ref for search functionality
  const chatContainer = pageRefs.chatContainer;
  if (chatContainer) {
    nuxtApp.$refs = nuxtApp.$refs || {};
    nuxtApp.$refs.chatContainer = chatContainer;
  }
});
</script>
