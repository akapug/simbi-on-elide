<template>
  <div id="app">
    <SkipToContent />
    <ConnectionStatus
      :status="wsStatus"
      :error="wsError"
      :on-retry="handleReconnect"
    />
    <Navbar />
    <ErrorBoundary :show-details="isDev">
      <main id="main-content" tabindex="-1">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <Suspense>
              <component :is="Component" />
              <template #fallback>
                <LoadingSpinner size="large" overlay message="Loading..." />
              </template>
            </Suspense>
          </transition>
        </router-view>
      </main>
    </ErrorBoundary>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Navbar from '@/components/layout/Navbar.vue'
import Footer from '@/components/layout/Footer.vue'
import SkipToContent from '@/components/common/SkipToContent.vue'
import ConnectionStatus from '@/components/common/ConnectionStatus.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import websocketService from '@/services/websocket'

const authStore = useAuthStore()
const isDev = import.meta.env.DEV

const wsStatus = computed(() => websocketService.status.value)
const wsError = computed(() => websocketService.error.value)

// Initialize WebSocket connection when user is authenticated
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && authStore.token) {
    websocketService.connect(authStore.token)
  } else {
    websocketService.disconnect()
  }
}, { immediate: true })

function handleReconnect() {
  if (authStore.token) {
    websocketService.reconnect(authStore.token)
  }
}

onMounted(async () => {
  if (authStore.token) {
    await authStore.fetchUser()
  }
})
</script>

<style>
/* Screen reader only utility class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus visible styles */
*:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* Main content */
#main-content {
  min-height: calc(100vh - 8rem);
}

#main-content:focus {
  outline: none;
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
