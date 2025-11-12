<template>
  <div class="min-h-screen">
    <Navbar />
    <main class="container mx-auto px-4 py-8">
      <div v-if="servicesStore.loading" class="text-center py-12">Loading...</div>

      <div v-else-if="service" class="grid lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="card">
            <div v-if="service.images?.length" class="mb-6">
              <img :src="service.images[0]" :alt="service.title" class="w-full h-96 object-cover rounded-lg" />
            </div>
            <h1 class="text-3xl font-bold mb-4">{{ service.title }}</h1>
            <div class="flex gap-2 mb-6">
              <span class="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">{{ service.kind }}</span>
              <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{{ service.tradingType }}</span>
            </div>
            <div class="prose max-w-none mb-6">
              <p class="text-gray-700">{{ service.description }}</p>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card">
            <h3 class="font-semibold mb-4">Offered by</h3>
            <div class="flex items-center gap-3 mb-4">
              <img v-if="service.user?.avatar" :src="service.user.avatar" class="w-12 h-12 rounded-full" />
              <div>
                <p class="font-medium">{{ service.user?.firstName }} {{ service.user?.lastName }}</p>
                <p class="text-sm text-gray-500">⭐ {{ service.user?.rating.toFixed(1) }}</p>
              </div>
            </div>
            <router-link :to="`/profile/${service.user?.username}`" class="btn btn-secondary w-full mb-2">
              View Profile
            </router-link>
            <button @click="startConversation" class="btn btn-primary w-full">
              Send Message
            </button>
          </div>

          <div class="card">
            <h3 class="font-semibold mb-4">Pricing</h3>
            <div class="space-y-2">
              <div v-if="service.simbiPrice" class="flex justify-between">
                <span class="text-gray-600">Simbi Credits</span>
                <span class="font-semibold">{{ service.simbiPrice }} ⚡</span>
              </div>
              <div v-if="service.usdPrice" class="flex justify-between">
                <span class="text-gray-600">USD Price</span>
                <span class="font-semibold">${{ (service.usdPrice / 100).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from '@/components/layout/Navbar.vue'
import { useServicesStore } from '@/stores/services'
import { useTalksStore } from '@/stores/talks'

const route = useRoute()
const router = useRouter()
const servicesStore = useServicesStore()
const talksStore = useTalksStore()
const service = ref(null)

onMounted(async () => {
  service.value = await servicesStore.fetchService(route.params.id as string)
})

async function startConversation() {
  const talk = await talksStore.createTalk({
    receiverId: service.value.userId,
    serviceId: service.value.id,
    subject: `Interested in: ${service.value.title}`,
  })
  router.push(`/inbox/${talk.id}`)
}
</script>
