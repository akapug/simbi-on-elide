import { onMounted, onUnmounted, Ref } from 'vue'

export interface KeyboardNavigationOptions {
  onEnter?: () => void
  onEscape?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
  enabled?: Ref<boolean>
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (options.enabled && !options.enabled.value) {
      return
    }

    switch (e.key) {
      case 'Enter':
        if (options.onEnter) {
          e.preventDefault()
          options.onEnter()
        }
        break
      case 'Escape':
        if (options.onEscape) {
          e.preventDefault()
          options.onEscape()
        }
        break
      case 'ArrowUp':
        if (options.onArrowUp) {
          e.preventDefault()
          options.onArrowUp()
        }
        break
      case 'ArrowDown':
        if (options.onArrowDown) {
          e.preventDefault()
          options.onArrowDown()
        }
        break
      case 'ArrowLeft':
        if (options.onArrowLeft) {
          e.preventDefault()
          options.onArrowLeft()
        }
        break
      case 'ArrowRight':
        if (options.onArrowRight) {
          e.preventDefault()
          options.onArrowRight()
        }
        break
      case 'Tab':
        if (options.onTab) {
          options.onTab()
        }
        break
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    handleKeyDown,
  }
}
