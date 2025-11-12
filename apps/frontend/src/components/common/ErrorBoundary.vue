<template>
  <div v-if="error" class="error-boundary">
    <div class="error-container">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h2>Oops! Something went wrong</h2>
      <p v-if="showDetails" class="error-message">{{ error.message }}</p>
      <p v-else>We're sorry, but something unexpected happened. Please try again.</p>
      <div class="error-actions">
        <button @click="handleReload" class="btn-primary">
          Reload Page
        </button>
        <button v-if="canReset" @click="handleReset" class="btn-secondary">
          Go Back
        </button>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  showDetails?: boolean
  canReset?: boolean
}>()

const router = useRouter()
const error = ref<Error | null>(null)

onErrorCaptured((err: Error) => {
  error.value = err
  console.error('Error captured by boundary:', err)

  // Report to error tracking service (e.g., Sentry)
  // reportError(err)

  return false // Prevent propagation
})

function handleReload() {
  window.location.reload()
}

function handleReset() {
  error.value = null
  router.back()
}
</script>

<style scoped>
.error-boundary {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.error-container {
  background: white;
  padding: 3rem;
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
}

.error-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.5rem;
  color: #ef4444;
}

.error-icon svg {
  width: 100%;
  height: 100%;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.error-message {
  font-family: monospace;
  font-size: 0.875rem;
  background: #fef2f2;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #fee2e2;
  color: #991b1b;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
</style>
