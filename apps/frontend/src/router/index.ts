import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAccessibility } from '@/composables/useAccessibility'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'Home' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { title: 'Login' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { title: 'Register' },
    },
    {
      path: '/services',
      name: 'services',
      component: () => import('@/views/services/ServicesView.vue'),
      meta: { title: 'Services' },
    },
    {
      path: '/services/create',
      name: 'services-create',
      component: () => import('@/views/services/ServiceCreateView.vue'),
      meta: { requiresAuth: true, title: 'Create Service' },
    },
    {
      path: '/services/:id',
      name: 'service-detail',
      component: () => import('@/views/services/ServiceDetailView.vue'),
      meta: { title: 'Service Details' },
    },
    {
      path: '/inbox',
      name: 'inbox',
      component: () => import('@/views/talks/InboxView.vue'),
      meta: { requiresAuth: true, title: 'Inbox' },
    },
    {
      path: '/inbox/:id',
      name: 'talk-detail',
      component: () => import('@/views/talks/TalkDetailView.vue'),
      meta: { requiresAuth: true, title: 'Conversation' },
    },
    {
      path: '/communities',
      name: 'communities',
      component: () => import('@/views/communities/CommunitiesView.vue'),
      meta: { title: 'Communities' },
    },
    {
      path: '/communities/:id',
      name: 'community-detail',
      component: () => import('@/views/communities/CommunityDetailView.vue'),
      meta: { title: 'Community' },
    },
    {
      path: '/profile/:username',
      name: 'profile',
      component: () => import('@/views/users/ProfileView.vue'),
      meta: { title: 'Profile' },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/users/DashboardView.vue'),
      meta: { requiresAuth: true, title: 'Dashboard' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/users/SettingsView.vue'),
      meta: { requiresAuth: true, title: 'Settings' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '404 Not Found' },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

router.afterEach((to) => {
  // Update document title for accessibility
  const { setDocumentTitle } = useAccessibility()
  const title = (to.meta.title as string) || 'Simbi'
  setDocumentTitle(title)
})

export default router
