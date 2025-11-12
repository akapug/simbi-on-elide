<template>
  <transition name="slide-down">
    <div v-if="showStatus" class="connection-status" :class="statusClass" role="status" aria-live="polite">
      <div class="status-content">
        <div class="status-icon">
          <svg v-if="status === 'connected'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="status === 'reconnecting' || status === 'connecting'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="animate-spin">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <span class="status-text">{{ statusMessage }}</span>
        <button
          v-if="canRetry"
          @click="handleRetry"
          class="retry-button"
          aria-label="Retry connection"
        >
          Retry
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ConnectionStatus } from '@/services/websocket'

const props = defineProps<{
  status: ConnectionStatus
  error?: string | null
  onRetry?: () => void
}>()

const showStatus = computed(() => {
  return props.status !== ConnectionStatus.CONNECTED
})

const statusClass = computed(() => {
  switch (props.status) {
    case ConnectionStatus.CONNECTED:
      return 'status-connected'
    case ConnectionStatus.CONNECTING:
    case ConnectionStatus.RECONNECTING:
      return 'status-connecting'
    case ConnectionStatus.DISCONNECTED:
    case ConnectionStatus.ERROR:
      return 'status-error'
    default:
      return ''
  }
})

const statusMessage = computed(() => {
  switch (props.status) {
    case ConnectionStatus.CONNECTED:
      return 'Connected'
    case ConnectionStatus.CONNECTING:
      return 'Connecting...'
    case ConnectionStatus.RECONNECTING:
      return 'Reconnecting...'
    case ConnectionStatus.DISCONNECTED:
      return 'Disconnected'
    case ConnectionStatus.ERROR:
      return props.error || 'Connection error'
    default:
      return ''
  }
})

const canRetry = computed(() => {
  return (
    props.onRetry &&
    (props.status === ConnectionStatus.DISCONNECTED ||
      props.status === ConnectionStatus.ERROR)
  )
})

function handleRetry() {
  props.onRetry?.()
}
</script>

<style scoped>
.connection-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 0.75rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  max-width: 1200px;
  margin: 0 auto;
}

.status-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.status-icon svg {
  width: 100%;
  height: 100%;
}

.status-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.retry-button {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.2);
}

.retry-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Status variants */
.status-connected {
  background: linear-gradient(90deg, #10b981, #059669);
  color: white;
}

.status-connecting {
  background: linear-gradient(90deg, #f59e0b, #d97706);
  color: white;
}

.status-error {
  background: linear-gradient(90deg, #ef4444, #dc2626);
  color: white;
}

/* Animations */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
