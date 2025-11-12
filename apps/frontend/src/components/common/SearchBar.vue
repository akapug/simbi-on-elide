<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="placeholder"
        class="search-input"
        @input="handleInput"
        @keyup.enter="handleSearch"
        aria-label="Search"
      />
      <button
        v-if="searchQuery"
        @click="handleClear"
        class="clear-button"
        aria-label="Clear search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <button
      v-if="!hideButton"
      @click="handleSearch"
      class="search-button"
      :disabled="!searchQuery"
    >
      Search
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    debounce?: number
    hideButton?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: 'Search...',
    debounce: 300,
    hideButton: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'search', value: string): void
}>()

const searchQuery = ref(props.modelValue)
let debounceTimeout: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.modelValue,
  (newValue) => {
    searchQuery.value = newValue
  }
)

function handleInput() {
  emit('update:modelValue', searchQuery.value)

  if (props.debounce > 0) {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }
    debounceTimeout = setTimeout(() => {
      emit('search', searchQuery.value)
    }, props.debounce)
  }
}

function handleSearch() {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout)
  }
  emit('search', searchQuery.value)
}

function handleClear() {
  searchQuery.value = ''
  emit('update:modelValue', '')
  emit('search', '')
}
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: #9ca3af;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  font-size: 1rem;
  color: #1f2937;
  background: white;
  border: 1.5px solid #d1d5db;
  border-radius: 0.75rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.clear-button {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.2s;
}

.clear-button:hover {
  color: #374151;
}

.clear-button svg {
  width: 100%;
  height: 100%;
}

.search-button {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.search-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .search-bar {
    flex-direction: column;
  }

  .search-button {
    width: 100%;
  }
}
</style>
