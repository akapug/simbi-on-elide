import { ref, reactive, computed } from 'vue'
import { z, ZodSchema, ZodError } from 'zod'

export interface FormField<T = any> {
  value: T
  error: string
  touched: boolean
  dirty: boolean
}

export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormField<T[K]> }
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
  errors: { [K in keyof T]?: string }
}

export function useFormValidation<T extends Record<string, any>>(
  schema: ZodSchema<T>,
  initialValues: T
) {
  const fields = reactive<{ [K in keyof T]: FormField<T[K]> }>(
    Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = {
        value: initialValues[key as keyof T],
        error: '',
        touched: false,
        dirty: false,
      }
      return acc
    }, {} as { [K in keyof T]: FormField<T[K]> })
  )

  const isSubmitting = ref(false)

  const values = computed(() => {
    return Object.keys(fields).reduce((acc, key) => {
      acc[key as keyof T] = fields[key as keyof T].value
      return acc
    }, {} as T)
  })

  const errors = computed(() => {
    return Object.keys(fields).reduce((acc, key) => {
      const field = fields[key as keyof T]
      if (field.error && field.touched) {
        acc[key as keyof T] = field.error
      }
      return acc
    }, {} as { [K in keyof T]?: string })
  })

  const isValid = computed(() => {
    return Object.values(fields).every((field) => !field.error)
  })

  const isDirty = computed(() => {
    return Object.values(fields).some((field) => field.dirty)
  })

  const validateField = (fieldName: keyof T): boolean => {
    try {
      const fieldSchema = schema.pick({ [fieldName]: true } as any)
      fieldSchema.parse({ [fieldName]: fields[fieldName].value })
      fields[fieldName].error = ''
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        fields[fieldName].error = error.errors[0]?.message || 'Invalid value'
      }
      return false
    }
  }

  const validateAll = (): boolean => {
    try {
      schema.parse(values.value)
      // Clear all errors
      Object.keys(fields).forEach((key) => {
        fields[key as keyof T].error = ''
      })
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        error.errors.forEach((err) => {
          const fieldName = err.path[0] as keyof T
          if (fieldName && fields[fieldName]) {
            fields[fieldName].error = err.message
          }
        })
      }
      return false
    }
  }

  const setFieldValue = (fieldName: keyof T, value: T[keyof T]) => {
    fields[fieldName].value = value
    fields[fieldName].dirty = true
    if (fields[fieldName].touched) {
      validateField(fieldName)
    }
  }

  const setFieldTouched = (fieldName: keyof T, touched = true) => {
    fields[fieldName].touched = touched
    if (touched) {
      validateField(fieldName)
    }
  }

  const setFieldError = (fieldName: keyof T, error: string) => {
    fields[fieldName].error = error
    fields[fieldName].touched = true
  }

  const reset = () => {
    Object.keys(fields).forEach((key) => {
      const k = key as keyof T
      fields[k].value = initialValues[k]
      fields[k].error = ''
      fields[k].touched = false
      fields[k].dirty = false
    })
    isSubmitting.value = false
  }

  const handleSubmit = async (
    onSubmit: (values: T) => Promise<void> | void
  ) => {
    // Mark all fields as touched
    Object.keys(fields).forEach((key) => {
      fields[key as keyof T].touched = true
    })

    if (!validateAll()) {
      return
    }

    isSubmitting.value = true
    try {
      await onSubmit(values.value)
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    fields,
    values,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    validateField,
    validateAll,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    reset,
    handleSubmit,
  }
}
