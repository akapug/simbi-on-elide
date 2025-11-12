import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  async function login(credentials: LoginCredentials) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials)
      user.value = response.data.user
      token.value = response.data.accessToken
      localStorage.setItem('token', response.data.accessToken)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterData) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<AuthResponse>('/auth/register', data)
      user.value = response.data.user
      token.value = response.data.accessToken
      localStorage.setItem('token', response.data.accessToken)
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const response = await api.get<User>('/auth/me')
      user.value = response.data
    } catch (err) {
      logout()
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    fetchUser,
    logout,
  }
})
