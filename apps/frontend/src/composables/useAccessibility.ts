import { ref, watch, Ref } from 'vue'

export function useAccessibility() {
  const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only' // Screen reader only
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  const setDocumentTitle = (title: string) => {
    document.title = `${title} - Simbi`
    announceMessage(`Navigated to ${title}`)
  }

  const handleSkipToContent = () => {
    const mainContent = document.querySelector('main')
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus()
      // Remove tabindex after focus to avoid breaking tab order
      mainContent.addEventListener('blur', () => {
        mainContent.removeAttribute('tabindex')
      }, { once: true })
    }
  }

  return {
    announceMessage,
    setDocumentTitle,
    handleSkipToContent,
  }
}

// Skip to content link component utility
export function useSkipLink() {
  const skipLinkRef = ref<HTMLElement | null>(null)

  const handleSkipLink = (e: Event) => {
    e.preventDefault()
    const mainContent = document.querySelector('main')
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus()
      mainContent.scrollIntoView()
    }
  }

  return {
    skipLinkRef,
    handleSkipLink,
  }
}

// Form field accessibility helper
export function useFormFieldA11y(fieldId: string, errorRef: Ref<string>) {
  const describedBy = ref<string>()

  watch(errorRef, (error) => {
    if (error) {
      describedBy.value = `${fieldId}-error`
    } else {
      describedBy.value = undefined
    }
  })

  return {
    describedBy,
    ariaInvalid: ref(!!errorRef.value),
  }
}
