<template>
  <div class="min-h-screen">
    <Navbar />
    <main class="container mx-auto px-4 py-8 max-w-4xl">
      <div v-if="talk" class="space-y-6">
        <div class="card">
          <div class="flex items-center gap-3 mb-6 pb-4 border-b">
            <router-link to="/inbox" class="text-gray-500 hover:text-gray-700">← Back</router-link>
            <div class="flex items-center gap-3 ml-4">
              <img v-if="otherUser?.avatar" :src="otherUser.avatar" class="w-10 h-10 rounded-full" />
              <div>
                <p class="font-semibold">{{ otherUser?.firstName }} {{ otherUser?.lastName }}</p>
                <p class="text-sm text-gray-500">{{ talk.service?.title }}</p>
              </div>
            </div>
          </div>

          <div class="space-y-4 mb-6 max-h-96 overflow-y-auto">
            <div
              v-for="message in talk.messages"
              :key="message.id"
              :class="['flex', message.userId === authStore.user?.id ? 'justify-end' : 'justify-start']"
            >
              <div
                :class="[
                  'max-w-md rounded-lg px-4 py-2',
                  message.userId === authStore.user?.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                ]"
              >
                <p>{{ message.content }}</p>
                <p class="text-xs mt-1 opacity-75">{{ formatTime(message.createdAt) }}</p>
              </div>
            </div>
          </div>

          <form @submit.prevent="sendMessage" class="flex gap-2">
            <input
              v-model="newMessage"
              type="text"
              placeholder="Type a message..."
              class="input flex-1"
              required
            />
            <button type="submit" class="btn btn-primary">Send</button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { format } from 'date-fns'
import Navbar from '@/components/layout/Navbar.vue'
import { useTalksStore } from '@/stores/talks'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const talksStore = useTalksStore()
const authStore = useAuthStore()
const talk = ref(null)
const newMessage = ref('')

const otherUser = computed(() => {
  if (!talk.value) return null
  return talk.value.senderId === authStore.user?.id ? talk.value.receiver : talk.value.sender
})

onMounted(async () => {
  talk.value = await talksStore.fetchTalk(route.params.id as string)
})

async function sendMessage() {
  if (!newMessage.value.trim()) return
  await talksStore.sendMessage(route.params.id as string, newMessage.value)
  newMessage.value = ''
  talk.value = talksStore.currentTalk
}

function formatTime(date: string) {
  return format(new Date(date), 'MMM d, h:mm a')
}
</script>
