<template>
  <div class="filter-panel" :class="{ collapsed }">
    <div class="filter-header">
      <h3>Filters</h3>
      <button @click="toggleCollapse" class="toggle-button" aria-label="Toggle filters">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          :class="{ rotated: collapsed }"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
    </div>

    <transition name="slide">
      <div v-if="!collapsed" class="filter-content">
        <slot></slot>

        <div class="filter-actions">
          <button @click="handleReset" class="btn-secondary">
            Reset Filters
          </button>
          <button @click="handleApply" class="btn-primary">
            Apply Filters
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  initialCollapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'apply'): void
  (e: 'reset'): void
}>()

const collapsed = ref(props.initialCollapsed || false)

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function handleApply() {
  emit('apply')
}

function handleReset() {
  emit('reset')
}
</script>

<style scoped>
.filter-panel {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.filter-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.toggle-button {
  padding: 0.25rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-button:hover {
  color: #374151;
}

.toggle-button svg {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.2s;
}

.toggle-button svg.rotated {
  transform: rotate(-180deg);
}

.filter-content {
  padding: 1.25rem;
}

.filter-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 0.625rem 1rem;
  font-weight: 600;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
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

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-out;
  max-height: 1000px;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (max-width: 768px) {
  .filter-panel.collapsed {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  }
}
</style>
