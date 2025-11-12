<template>
  <nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="navbar-container">
      <div class="navbar-content">
        <!-- Logo -->
        <router-link to="/" class="navbar-logo" aria-label="Simbi Home">
          <img src="/simbi-logo.svg" alt="Simbi" class="logo-image" v-if="false" />
          <span class="logo-text">Simbi</span>
        </router-link>

        <!-- Desktop Navigation -->
        <div class="navbar-links">
          <router-link to="/services" class="nav-link" active-class="active">
            Services
          </router-link>
          <router-link to="/communities" class="nav-link" active-class="active">
            Communities
          </router-link>
        </div>

        <!-- Desktop Actions -->
        <div class="navbar-actions">
          <template v-if="authStore.isAuthenticated">
            <router-link to="/inbox" class="nav-link" active-class="active" aria-label="Messages">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span class="link-text">Messages</span>
              <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
            </router-link>
            <router-link to="/dashboard" class="nav-link" active-class="active">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              <span class="link-text">Dashboard</span>
            </router-link>
            <button @click="handleLogout" class="btn-secondary">
              Logout
            </button>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-link" active-class="active">
              Login
            </router-link>
            <router-link to="/register" class="btn-primary">
              Sign Up
            </router-link>
          </template>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="toggleMobileMenu"
          class="mobile-menu-button"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle navigation menu"
        >
          <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <transition name="slide-down">
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <div class="mobile-menu-content">
          <router-link to="/services" @click="closeMobileMenu" class="mobile-nav-link">
            Services
          </router-link>
          <router-link to="/communities" @click="closeMobileMenu" class="mobile-nav-link">
            Communities
          </router-link>

          <template v-if="authStore.isAuthenticated">
            <router-link to="/inbox" @click="closeMobileMenu" class="mobile-nav-link">
              Messages
              <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
            </router-link>
            <router-link to="/dashboard" @click="closeMobileMenu" class="mobile-nav-link">
              Dashboard
            </router-link>
            <button @click="handleLogout" class="mobile-nav-button">
              Logout
            </button>
          </template>
          <template v-else>
            <router-link to="/login" @click="closeMobileMenu" class="mobile-nav-link">
              Login
            </router-link>
            <router-link to="/register" @click="closeMobileMenu" class="mobile-nav-button mobile-nav-button-primary">
              Sign Up
            </router-link>
          </template>
        </div>
      </div>
    </transition>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)
const unreadCount = ref(0)

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
  // Prevent body scroll when menu is open
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}

function handleLogout() {
  authStore.logout()
  closeMobileMenu()
  router.push('/login')
}

// Close mobile menu on route change
router.afterEach(() => {
  closeMobileMenu()
})

// Close mobile menu on escape key
function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape' && mobileMenuOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 50;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.logo-image {
  height: 2rem;
  width: auto;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar-links {
  display: none;
  gap: 2rem;
}

@media (min-width: 768px) {
  .navbar-links {
    display: flex;
  }
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
  position: relative;
}

.nav-link svg {
  width: 1.25rem;
  height: 1.25rem;
}

.nav-link:hover {
  color: #667eea;
}

.nav-link.active {
  color: #667eea;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -1.25rem;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.link-text {
  display: none;
}

@media (min-width: 768px) {
  .link-text {
    display: inline;
  }
}

.notification-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: #ef4444;
  border-radius: 9999px;
}

.navbar-actions {
  display: none;
  align-items: center;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .navbar-actions {
    display: flex;
  }
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.mobile-menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  background: none;
  border: none;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

@media (min-width: 768px) {
  .mobile-menu-button {
    display: none;
  }
}

.mobile-menu-button:hover {
  background: #f3f4f6;
  border-radius: 0.5rem;
}

.mobile-menu-button svg {
  width: 1.5rem;
  height: 1.5rem;
}

.mobile-menu {
  position: fixed;
  top: 4rem;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
}

.mobile-menu-content {
  background: white;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  color: #374151;
  text-decoration: none;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: background 0.2s;
}

.mobile-nav-link:hover {
  background: #f3f4f6;
}

.mobile-nav-button {
  width: 100%;
  padding: 0.75rem 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: #f3f4f6;
  color: #374151;
  text-align: center;
  text-decoration: none;
  display: block;
}

.mobile-nav-button:hover {
  background: #e5e7eb;
}

.mobile-nav-button-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-top: 0.5rem;
}

.mobile-nav-button-primary:hover {
  opacity: 0.9;
}

/* Animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease-out;
}

.slide-down-enter-from {
  opacity: 0;
}

.slide-down-leave-to {
  opacity: 0;
}

.slide-down-enter-from .mobile-menu-content {
  transform: translateY(-1rem);
}

.slide-down-leave-to .mobile-menu-content {
  transform: translateY(-1rem);
}
</style>
