<template>
  <transition name="slide-fade">
    <div v-if="modelValue" class="error-alert" role="alert" aria-live="assertive">
      <div class="error-content">
        <div class="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <div class="error-text">
          <p class="error-title">{{ title || 'Error' }}</p>
          <p class="error-message">{{ message }}</p>
        </div>
        <button @click="handleClose" class="close-button" aria-label="Close error message">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  message: string
  title?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.error-alert {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  max-width: 400px;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  border-left: 4px solid #ef4444;
}

.error-content {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  align-items: flex-start;
}

.error-icon {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  color: #ef4444;
}

.error-icon svg {
  width: 100%;
  height: 100%;
}

.error-text {
  flex: 1;
}

.error-title {
  font-weight: 600;
  color: #991b1b;
  margin-bottom: 0.25rem;
}

.error-message {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.4;
}

.close-button {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
}

.close-button:hover {
  color: #374151;
}

.close-button svg {
  width: 100%;
  height: 100%;
}

/* Animations */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
