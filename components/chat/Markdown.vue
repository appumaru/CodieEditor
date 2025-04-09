<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

const props = defineProps<{
  content: string;
}>();

// Configure marked with highlight.js for code syntax highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (err) {}
    }
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

const renderedContent = computed(() => {
  try {
    const html = marked(props.content);
    return addCopyButtons(html);
  } catch (e) {
    console.error('Error rendering markdown:', e);
    return props.content;
  }
});

function addCopyButtons(html: string): string {
  // Add copy buttons to pre>code blocks with animation
  return html.replace(
    /<pre><code class="(language-[^"]+)">([\s\S]*?)<\/code><\/pre>/g,
    '<pre class="relative group"><div class="absolute top-2 right-2 z-10"><button class="copy-code-btn bg-secondary hover:bg-muted text-xs px-2 py-1 rounded transition-all duration-300" onclick="this.classList.add(\'copy-success\'); this.innerText=\'Copied!\'; navigator.clipboard.writeText(this.parentNode.parentNode.querySelector(\'code\').textContent.trim()); setTimeout(() => { this.classList.remove(\'copy-success\'); this.innerText=\'Copy\'; }, 2000)">Copy</button></div><code class="$1">$2</code></pre>'
  );
}

onMounted(() => {
  // Add custom styles for copy button animations
  const style = document.createElement('style');
  style.textContent = `
    .copy-code-btn.copy-success {
      background-color: rgb(34, 197, 94) !important;
      color: white !important;
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(style);
});
</script>

<style scoped>
.markdown-content {
  @apply text-sm leading-relaxed;
}

.markdown-content :deep(h1) {
  @apply text-2xl font-bold mb-4 mt-6;
}

.markdown-content :deep(h2) {
  @apply text-xl font-bold mb-3 mt-5;
}

.markdown-content :deep(h3) {
  @apply text-lg font-bold mb-2 mt-4;
}

.markdown-content :deep(p) {
  @apply mb-4;
}

.markdown-content :deep(ul), 
.markdown-content :deep(ol) {
  @apply pl-6 mb-4;
}

.markdown-content :deep(ul) {
  @apply list-disc;
}

.markdown-content :deep(ol) {
  @apply list-decimal;
}

.markdown-content :deep(li) {
  @apply mb-1;
}

.markdown-content :deep(a) {
  @apply text-primary hover:underline;
}

.markdown-content :deep(blockquote) {
  @apply border-l-4 border-muted pl-4 italic my-4;
}

.markdown-content :deep(pre) {
  @apply rounded-md p-4 mb-4 overflow-x-auto bg-[#0d1117];
}

.markdown-content :deep(code:not(pre code)) {
  @apply bg-muted px-1.5 py-0.5 rounded text-xs font-mono;
}

.markdown-content :deep(table) {
  @apply w-full border-collapse mb-4;
}

.markdown-content :deep(th), 
.markdown-content :deep(td) {
  @apply border border-border p-2;
}

.markdown-content :deep(th) {
  @apply bg-muted;
}

.markdown-content :deep(hr) {
  @apply my-6 border-t border-border;
}

.markdown-content :deep(img) {
  @apply max-w-full h-auto rounded-md;
}
</style> 