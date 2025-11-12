<template>
  <div class="min-h-screen">
    <Navbar />
    <main class="container mx-auto px-4 py-8">
      <div v-if="user" class="space-y-6">
        <div class="card">
          <div class="flex items-start gap-6">
            <img v-if="user.avatar" :src="user.avatar" class="w-24 h-24 rounded-full" />
            <div class="flex-1">
              <h1 class="text-3xl font-bold mb-2">{{ user.firstName }} {{ user.lastName }}</h1>
              <p class="text-gray-600 mb-4">@{{ user.username }}</p>
              <div class="flex gap-4 text-sm mb-4">
                <span>⭐ {{ user.rating?.toFixed(1) || 0 }}</span>
                <span>{{ user._count?.services || 0 }} Services</span>
                <span>{{ user._count?.followers || 0 }} Followers</span>
              </div>
              <p v-if="user.about" class="text-gray-700">{{ user.about }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Services</h2>
          <div class="grid md:grid-cols-3 gap-4">
            <ServiceCard v-for="service in user.services" :key="service.id" :service="service" />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/layout/Navbar.vue'
import ServiceCard from '@/components/services/ServiceCard.vue'
import api from '@/services/api'

const route = useRoute()
const user = ref(null)

onMounted(async () => {
  const response = await api.get(`/users/username/${route.params.username}`)
  user.value = response.data
})
</script>
