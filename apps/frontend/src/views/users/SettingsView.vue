<template>
  <div class="min-h-screen">
    <Navbar />
    <main class="container mx-auto px-4 py-8 max-w-3xl">
      <h1 class="text-3xl font-bold mb-8">Settings</h1>

      <div class="space-y-6">
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Profile Information</h2>
          <form @submit.prevent="updateProfile" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input v-model="form.firstName" type="text" class="input" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input v-model="form.lastName" type="text" class="input" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">About</label>
              <textarea v-model="form.about" class="input" rows="4"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input v-model="form.website" type="url" class="input" />
            </div>

            <button type="submit" class="btn btn-primary">Save Changes</button>
          </form>
        </div>

        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Notifications</h2>
          <div class="space-y-3">
            <label class="flex items-center gap-3">
              <input v-model="settings.disabledNotifications" type="checkbox" class="rounded" />
              <span>Disable all notifications</span>
            </label>
            <label class="flex items-center gap-3">
              <input v-model="settings.vacationMode" type="checkbox" class="rounded" />
              <span>Vacation mode</span>
            </label>
          </div>
          <button @click="updateSettings" class="btn btn-primary mt-4">Save Settings</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import Navbar from '@/components/layout/Navbar.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()

const form = reactive({
  firstName: '',
  lastName: '',
  about: '',
  website: '',
})

const settings = reactive({
  disabledNotifications: false,
  vacationMode: false,
})

onMounted(() => {
  if (authStore.user) {
    Object.assign(form, {
      firstName: authStore.user.firstName,
      lastName: authStore.user.lastName,
      about: authStore.user.about,
      website: authStore.user.website,
    })
    Object.assign(settings, authStore.user.settings || {})
  }
})

async function updateProfile() {
  await api.put('/users/profile', form)
  await authStore.fetchUser()
  alert('Profile updated successfully!')
}

async function updateSettings() {
  await api.put('/users/settings', settings)
  await authStore.fetchUser()
  alert('Settings updated successfully!')
}
</script>
