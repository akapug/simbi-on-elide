<template>
  <div class="loading-spinner" :class="[sizeClass, { overlay }]" role="status" aria-label="Loading">
    <div class="spinner"></div>
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: 'small' | 'medium' | 'large'
    message?: string
    overlay?: boolean
  }>(),
  {
    size: 'medium',
    overlay: false,
  }
)

const sizeClass = computed(() => `size-${props.size}`)
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.loading-spinner.overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9998;
}

.spinner {
  border: 3px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.size-small .spinner {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 2px;
}

.size-medium .spinner {
  width: 2.5rem;
  height: 2.5rem;
  border-width: 3px;
}

.size-large .spinner {
  width: 4rem;
  height: 4rem;
  border-width: 4px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-message {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
