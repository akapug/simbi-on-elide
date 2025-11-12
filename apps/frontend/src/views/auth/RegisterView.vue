<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-bold text-gray-900">Create your account</h2>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="card">
          <div v-if="authStore.error" class="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {{ authStore.error }}
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="firstName" class="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  id="firstName"
                  v-model="form.firstName"
                  type="text"
                  class="input"
                />
              </div>
              <div>
                <label for="lastName" class="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  id="lastName"
                  v-model="form.lastName"
                  type="text"
                  class="input"
                />
              </div>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                class="input"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                class="input"
                minlength="8"
              />
            </div>
          </div>

          <div class="mt-6">
            <button type="submit" :disabled="authStore.loading" class="btn btn-primary w-full">
              {{ authStore.loading ? 'Creating account...' : 'Create account' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
})

async function handleSubmit() {
  const success = await authStore.register(form)
  if (success) {
    router.push('/dashboard')
  }
}
</script>
