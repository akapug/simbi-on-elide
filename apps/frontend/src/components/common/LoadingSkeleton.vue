<template>
  <div class="skeleton" :class="[variantClass, { pulse }]" :style="style"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    variant?: 'text' | 'circular' | 'rectangular' | 'card'
    width?: string | number
    height?: string | number
    pulse?: boolean
  }>(),
  {
    variant: 'text',
    pulse: true,
  }
)

const variantClass = computed(() => `skeleton-${props.variant}`)

const style = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  border-radius: 0.25rem;
}

.skeleton.pulse {
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text {
  height: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
}

.skeleton-circular {
  border-radius: 50%;
}

.skeleton-rectangular {
  border-radius: 0.5rem;
}

.skeleton-card {
  height: 200px;
  border-radius: 0.75rem;
}
</style>
