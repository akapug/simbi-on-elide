<template>
  <div class="min-h-screen">
    <Navbar />
    <main class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-8">Messages</h1>

      <div v-if="talksStore.loading" class="text-center py-12">Loading...</div>

      <div v-else-if="talksStore.talks.length === 0" class="card text-center py-12">
        <p class="text-gray-500 mb-4">No messages yet</p>
        <router-link to="/services" class="btn btn-primary">Browse Services</router-link>
      </div>

      <div v-else class="space-y-4">
        <router-link
          v-for="talk in talksStore.talks"
          :key="talk.id"
          :to="`/inbox/${talk.id}`"
          class="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div class="flex items-center gap-4">
            <img v-if="otherUser(talk)?.avatar" :src="otherUser(talk).avatar" class="w-12 h-12 rounded-full" />
            <div class="flex-1">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-semibold">{{ otherUser(talk)?.firstName }} {{ otherUser(talk)?.lastName }}</p>
                  <p class="text-sm text-gray-500">{{ talk.service?.title }}</p>
                </div>
                <span class="text-xs text-gray-400">{{ formatDate(talk.updatedAt) }}</span>
              </div>
              <p class="text-sm text-gray-600 mt-1">{{ talk.messages[0]?.content }}</p>
            </div>
          </div>
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { formatDistance } from 'date-fns'
import Navbar from '@/components/layout/Navbar.vue'
import { useTalksStore } from '@/stores/talks'
import { useAuthStore } from '@/stores/auth'

const talksStore = useTalksStore()
const authStore = useAuthStore()

onMounted(async () => {
  await talksStore.fetchTalks()
})

function otherUser(talk: any) {
  return talk.senderId === authStore.user?.id ? talk.receiver : talk.sender
}

function formatDate(date: string) {
  return formatDistance(new Date(date), new Date(), { addSuffix: true })
}
</script>
