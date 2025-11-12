<template>
  <nav class="pagination" role="navigation" aria-label="Pagination">
    <button
      @click="goToPage(currentPage - 1)"
      :disabled="currentPage === 1"
      class="pagination-button"
      :class="{ disabled: currentPage === 1 }"
      aria-label="Previous page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      Previous
    </button>

    <div class="pagination-pages">
      <button
        v-for="page in displayedPages"
        :key="page"
        @click="goToPage(page)"
        class="pagination-page"
        :class="{ active: page === currentPage, ellipsis: page === -1 }"
        :aria-label="`Go to page ${page}`"
        :aria-current="page === currentPage ? 'page' : undefined"
        :disabled="page === -1"
      >
        {{ page === -1 ? '...' : page }}
      </button>
    </div>

    <button
      @click="goToPage(currentPage + 1)"
      :disabled="currentPage === totalPages"
      class="pagination-button"
      :class="{ disabled: currentPage === totalPages }"
      aria-label="Next page"
    >
      Next
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  totalPages: number
  maxVisible?: number
}>()

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

const maxVisible = computed(() => props.maxVisible || 7)

const displayedPages = computed(() => {
  const pages: number[] = []
  const halfVisible = Math.floor(maxVisible.value / 2)

  if (props.totalPages <= maxVisible.value) {
    // Show all pages
    for (let i = 1; i <= props.totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    let start = Math.max(2, props.currentPage - halfVisible)
    let end = Math.min(props.totalPages - 1, props.currentPage + halfVisible)

    // Adjust if we're near the start
    if (props.currentPage <= halfVisible + 1) {
      end = maxVisible.value - 1
    }

    // Adjust if we're near the end
    if (props.currentPage >= props.totalPages - halfVisible) {
      start = props.totalPages - maxVisible.value + 2
    }

    // Add ellipsis after first page if needed
    if (start > 2) {
      pages.push(-1) // -1 represents ellipsis
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis before last page if needed
    if (end < props.totalPages - 1) {
      pages.push(-1)
    }

    // Always show last page
    pages.push(props.totalPages)
  }

  return pages
})

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:currentPage', page)
  }
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 2rem 0;
}

.pagination-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-button:hover:not(.disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.pagination-button.disabled {
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination-button svg {
  width: 1rem;
  height: 1rem;
}

.pagination-pages {
  display: flex;
  gap: 0.25rem;
}

.pagination-page {
  min-width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-page:hover:not(.active):not(.ellipsis) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.pagination-page.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.pagination-page.ellipsis {
  border: none;
  cursor: default;
  background: transparent;
}

@media (max-width: 640px) {
  .pagination-button span {
    display: none;
  }

  .pagination-pages {
    gap: 0.125rem;
  }

  .pagination-page {
    min-width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }
}
</style>
