<template>
  <div class="min-h-screen">
    <Navbar />
    <main class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Dashboard</h1>

      <div class="grid md:grid-cols-3 gap-6 mb-8">
        <div class="card text-center">
          <div class="text-3xl font-bold text-primary-600">{{ authStore.user?.accounts?.[0]?.simbiBalance || 0 }}</div>
          <p class="text-gray-600 mt-2">Simbi Credits</p>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-primary-600">{{ myServices.length }}</div>
          <p class="text-gray-600 mt-2">Active Listings</p>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-primary-600">{{ authStore.user?.rating?.toFixed(1) || 0 }}</div>
          <p class="text-gray-600 mt-2">Rating</p>
        </div>
      </div>

      <div class="card mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">My Services</h2>
          <router-link to="/services/create" class="btn btn-primary">Create Listing</router-link>
        </div>
        <div v-if="loading" class="text-center py-8">Loading...</div>
        <div v-else-if="myServices.length === 0" class="text-center py-8 text-gray-500">
          No services yet. Create your first listing!
        </div>
        <div v-else class="space-y-4">
          <div v-for="service in myServices" :key="service.id" class="border rounded-lg p-4">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-semibold">{{ service.title }}</h3>
                <p class="text-sm text-gray-600">{{ service.kind }} • {{ service.state }}</p>
              </div>
              <router-link :to="`/services/${service.id}`" class="text-primary-600 hover:underline text-sm">
                View
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Navbar from '@/components/layout/Navbar.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const authStore = useAuthStore()
const myServices = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.get('/services/my-services')
    myServices.value = response.data
  } finally {
    loading.value = false
  }
})
</script>
