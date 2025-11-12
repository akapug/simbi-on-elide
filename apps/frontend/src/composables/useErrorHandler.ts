import { ref } from 'vue'
import { handleApiError } from '@/services/api'

export interface ErrorState {
  hasError: boolean
  message: string
  details?: any
}

export function useErrorHandler() {
  const errorState = ref<ErrorState>({
    hasError: false,
    message: '',
    details: null,
  })

  const clearError = () => {
    errorState.value = {
      hasError: false,
      message: '',
      details: null,
    }
  }

  const setError = (error: unknown, customMessage?: string) => {
    const message = customMessage || handleApiError(error)

    errorState.value = {
      hasError: true,
      message,
      details: error,
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error:', error)
    }
  }

  const handleError = async <T>(
    promise: Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    try {
      clearError()
      return await promise
    } catch (error) {
      setError(error, errorMessage)
      return null
    }
  }

  return {
    errorState,
    setError,
    clearError,
    handleError,
  }
}
