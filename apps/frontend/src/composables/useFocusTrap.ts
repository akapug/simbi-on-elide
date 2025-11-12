import { onMounted, onUnmounted, Ref } from 'vue'

export function useFocusTrap(containerRef: Ref<HTMLElement | null>) {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  let firstFocusableElement: HTMLElement | null = null
  let lastFocusableElement: HTMLElement | null = null
  let previouslyFocusedElement: HTMLElement | null = null

  function updateFocusableElements() {
    if (!containerRef.value) return

    const focusableElements = Array.from(
      containerRef.value.querySelectorAll<HTMLElement>(focusableSelectors)
    )

    firstFocusableElement = focusableElements[0] || null
    lastFocusableElement = focusableElements[focusableElements.length - 1] || null
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !containerRef.value) return

    updateFocusableElements()

    if (!firstFocusableElement) return

    // Trap focus
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusableElement) {
        e.preventDefault()
        lastFocusableElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusableElement) {
        e.preventDefault()
        firstFocusableElement?.focus()
      }
    }
  }

  function activate() {
    if (!containerRef.value) return

    // Store the currently focused element
    previouslyFocusedElement = document.activeElement as HTMLElement

    updateFocusableElements()

    // Focus the first element
    requestAnimationFrame(() => {
      firstFocusableElement?.focus()
    })

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)
  }

  function deactivate() {
    // Remove event listener
    document.removeEventListener('keydown', handleKeyDown)

    // Restore focus to previously focused element
    requestAnimationFrame(() => {
      previouslyFocusedElement?.focus()
    })
  }

  onMounted(() => {
    activate()
  })

  onUnmounted(() => {
    deactivate()
  })

  return {
    activate,
    deactivate,
  }
}
