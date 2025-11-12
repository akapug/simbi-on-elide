<template>
  <a
    href="#main-content"
    class="skip-to-content"
    @click="handleSkip"
    ref="skipLink"
  >
    Skip to main content
  </a>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const skipLink = ref<HTMLElement | null>(null)

function handleSkip(e: Event) {
  e.preventDefault()
  const mainContent = document.querySelector('#main-content') as HTMLElement
  if (mainContent) {
    mainContent.setAttribute('tabindex', '-1')
    mainContent.focus()
    mainContent.scrollIntoView({ behavior: 'smooth' })

    // Remove tabindex after blur to maintain natural tab order
    mainContent.addEventListener('blur', () => {
      mainContent.removeAttribute('tabindex')
    }, { once: true })
  }
}
</script>

<style scoped>
.skip-to-content {
  position: fixed;
  top: -100px;
  left: 0;
  z-index: 9999;
  padding: 1rem 1.5rem;
  background: #667eea;
  color: white;
  font-weight: 600;
  text-decoration: none;
  border-radius: 0 0 0.5rem 0;
  transition: top 0.3s;
}

.skip-to-content:focus {
  top: 0;
  outline: 3px solid #764ba2;
  outline-offset: 2px;
}
</style>
