<template>
  <div class="form-input">
    <label v-if="label" :for="id" class="form-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <div class="input-wrapper">
      <input
        :id="id"
        v-model="internalValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${id}-error` : undefined"
        class="form-control"
        :class="{ 'has-error': error, 'is-disabled': disabled }"
        @blur="handleBlur"
        @input="handleInput"
      />
    </div>
    <p v-if="error" :id="`${id}-error`" class="error-message" role="alert">
      {{ error }}
    </p>
    <p v-else-if="hint" class="hint-message">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    id: string
    modelValue: string | number
    type?: string
    label?: string
    placeholder?: string
    error?: string
    hint?: string
    disabled?: boolean
    required?: boolean
  }>(),
  {
    type: 'text',
    disabled: false,
    required: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'blur'): void
}>()

const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const handleBlur = () => {
  emit('blur')
}

const handleInput = () => {
  // Emit on input for real-time validation if needed
}
</script>

<style scoped>
.form-input {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.required {
  color: #ef4444;
  margin-left: 0.25rem;
}

.input-wrapper {
  position: relative;
}

.form-control {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #1f2937;
  background: white;
  border: 1.5px solid #d1d5db;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control.has-error {
  border-color: #ef4444;
}

.form-control.has-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-control.is-disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-control::placeholder {
  color: #9ca3af;
}

.error-message {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.hint-message {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}
</style>
