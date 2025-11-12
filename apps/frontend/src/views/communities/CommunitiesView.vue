<template>
  <div class="min-h-screen">
    <Navbar />
    <main class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Communities</h1>

      <div class="grid md:grid-cols-3 gap-6">
        <div v-for="community in communities" :key="community.id" class="card hover:shadow-md transition-shadow">
          <router-link :to="`/communities/${community.id}`">
            <h3 class="font-semibold text-lg mb-2">{{ community.name }}</h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">{{ community.description }}</p>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">{{ community.memberCount || 0 }} members</span>
              <span v-if="community.featured" class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                Featured
              </span>
            </div>
          </router-link>
        </div>
      </div>

      <div v-if="communities.length === 0" class="card text-center py-12">
        <p class="text-gray-500">No communities found. Be the first to create one!</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Navbar from '@/components/layout/Navbar.vue'
import api from '@/services/api'

const communities = ref([])

onMounted(async () => {
  const response = await api.get('/communities')
  communities.value = response.data
})
</script>
