import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import type { ErrorResponse } from '@/types'

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]

// CSRF token management
let csrfToken: string | null = null
let csrfTokenExpiry: number = 0

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for CSRF cookies
})

// Add retry count to config
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: number
  _retryCount?: number
}

/**
 * Fetch CSRF token from the server
 */
async function fetchCsrfToken(): Promise<void> {
  try {
    const response = await axios.get(`${api.defaults.baseURL}/csrf/token`, {
      withCredentials: true,
    })
    csrfToken = response.data.csrfToken
    csrfTokenExpiry = Date.now() + (response.data.expiresIn || 3600000)
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error)
    // Don't throw - allow request to proceed without CSRF token
  }
}

/**
 * Get CSRF token, fetching if necessary
 */
async function getCsrfToken(): Promise<string | null> {
  // Check if token exists and is not expired
  if (csrfToken && Date.now() < csrfTokenExpiry) {
    return csrfToken
  }

  // Fetch new token
  await fetchCsrfToken()
  return csrfToken
}

// Request interceptor
api.interceptors.request.use(
  async (config: RetryConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add CSRF token for state-changing methods
    const method = config.method?.toUpperCase()
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrf = await getCsrfToken()
      if (csrf) {
        config.headers['X-CSRF-Token'] = csrf
      }
    }

    // Initialize retry count
    if (config._retryCount === undefined) {
      config._retryCount = 0
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const config = error.config as RetryConfig

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      }
      return Promise.reject(error)
    }

    // Handle 403 CSRF validation failed - refresh token and retry once
    if (
      error.response?.status === 403 &&
      error.response?.data?.error === 'CSRF_VALIDATION_FAILED' &&
      config &&
      !config._retry
    ) {
      config._retry = true

      // Clear expired token and fetch new one
      csrfToken = null
      csrfTokenExpiry = 0

      await fetchCsrfToken()

      // Retry the original request with new token
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken
        return api.request(config)
      }
    }

    // Retry logic for specific status codes and network errors
    const shouldRetry =
      config &&
      config._retryCount !== undefined &&
      config._retryCount < MAX_RETRIES &&
      (
        !error.response || // Network error
        RETRY_STATUS_CODES.includes(error.response.status)
      )

    if (shouldRetry) {
      config._retryCount++

      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, config._retryCount - 1)

      console.log(`Retrying request (${config._retryCount}/${MAX_RETRIES}) after ${delay}ms...`)

      await new Promise(resolve => setTimeout(resolve, delay))

      return api.request(config)
    }

    // Format error message
    const errorMessage = formatErrorMessage(error)

    // Attach formatted message to error
    if (error.response) {
      error.response.data = {
        ...error.response.data,
        message: errorMessage,
      }
    }

    return Promise.reject(error)
  }
)

// Helper function to format error messages
function formatErrorMessage(error: AxiosError<ErrorResponse>): string {
  if (!error.response) {
    return 'Network error. Please check your connection and try again.'
  }

  const { status, data } = error.response

  // Use backend error message if available
  if (data?.message) {
    return Array.isArray(data.message) ? data.message.join(', ') : data.message
  }

  // Check for specific CSRF error
  if (status === 403 && data?.error === 'CSRF_VALIDATION_FAILED') {
    return 'Security validation failed. Please refresh the page and try again.'
  }

  // Default messages by status code
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please login.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    408: 'Request timeout. Please try again.',
    409: 'Conflict. The resource already exists.',
    422: 'Validation error. Please check your input.',
    429: 'Too many requests. Please slow down.',
    500: 'Server error. Please try again later.',
    502: 'Bad gateway. Please try again later.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. Please try again later.',
  }

  return statusMessages[status] || `An error occurred (${status}). Please try again.`
}

// Helper function to handle API errors in components
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ErrorResponse>
    return formatErrorMessage(axiosError)
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

// Helper function to check if error is network error
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response
}

// Helper function to check if error is timeout
export function isTimeoutError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.code === 'ECONNABORTED'
}

/**
 * Initialize CSRF protection - should be called when app starts
 */
export async function initCsrf(): Promise<void> {
  await fetchCsrfToken()
}

export default api
