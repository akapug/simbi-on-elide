<template>
  <div class="min-h-screen">
    <Navbar />
    <main class="container mx-auto px-4 py-8">
      <div v-if="community" class="space-y-6">
        <div class="card">
          <h1 class="text-3xl font-bold mb-4">{{ community.name }}</h1>
          <p class="text-gray-700 mb-6">{{ community.description }}</p>
          <div class="flex gap-4">
            <button v-if="!isMember" @click="joinCommunity" class="btn btn-primary">
              Join Community
            </button>
            <button v-else class="btn btn-secondary">Joined</button>
          </div>
        </div>

        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Members</h2>
          <div class="grid md:grid-cols-4 gap-4">
            <div v-for="member in community.members" :key="member.id" class="flex items-center gap-2">
              <img v-if="member.user.avatar" :src="member.user.avatar" class="w-10 h-10 rounded-full" />
              <div>
                <p class="font-medium text-sm">{{ member.user.firstName }} {{ member.user.lastName }}</p>
                <p class="text-xs text-gray-500">{{ member.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/layout/Navbar.vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const route = useRoute()
const authStore = useAuthStore()
const community = ref(null)

const isMember = computed(() => {
  return community.value?.members?.some(m => m.userId === authStore.user?.id)
})

onMounted(async () => {
  const response = await api.get(`/communities/${route.params.id}`)
  community.value = response.data
})

async function joinCommunity() {
  await api.post(`/communities/${route.params.id}/join`)
  // Refresh community data
  const response = await api.get(`/communities/${route.params.id}`)
  community.value = response.data
}
</script>
